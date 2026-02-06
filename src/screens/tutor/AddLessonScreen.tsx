/**
 * AddLessonScreen - Schedule New Lesson
 * Full-screen form for adding or editing lessons
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal as RNModal,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import type { Session, Student } from '../../services/api/tutor';
import type { TutorStackParamList } from '../../types/navigation';

type AddLessonRouteProp = RouteProp<TutorStackParamList, 'AddLesson'>;

const DURATION_OPTIONS = [
  { label: '30 minutes', value: 0.5 },
  { label: '1 hour', value: 1 },
  { label: '1.5 hours', value: 1.5 },
  { label: '2 hours', value: 2 },
];

const LOCATION_OPTIONS = [
  { label: 'Online', value: 'online' },
  { label: "Student's Home", value: "student's home" },
  { label: 'Centre', value: 'centre' },
];

const formatDateForInput = (date: Date): string => {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();
  return `${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}/${y}`;
};

const formatDateForApi = (mmddyyyy: string): string => {
  const parts = mmddyyyy.split('/');
  if (parts.length !== 3) return '';
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};

const parseDateFromInput = (mmddyyyy: string): Date | null => {
  const parts = mmddyyyy.split('/');
  if (parts.length !== 3) return null;
  const m = parseInt(parts[0], 10) - 1;
  const d = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(m) || isNaN(d) || isNaN(y)) return null;
  const date = new Date(y, m, d);
  return isNaN(date.getTime()) ? null : date;
};

const formatTime12h = (hours: number, minutes: number): string => {
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatTimeForApi = (hours: number, minutes: number): string => {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const addDurationToTime = (startH: number, startM: number, durationHours: number): { h: number; m: number } => {
  const totalMinutes = startH * 60 + startM + durationHours * 60;
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return { h, m };
};

export const AddLessonScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<AddLessonRouteProp>();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const sessionId = route.params?.sessionId;
  const isEditing = !!sessionId;

  const { data: sessionData, isLoading: loadingSession } = useQuery({
    queryKey: ['tutorSession', sessionId],
    queryFn: () => tutorService.getSessionDetails(sessionId!),
    enabled: !!sessionId && !!token,
  });

  const session: Session | undefined = (sessionData as any)?.data ?? sessionData;

  const [subject, setSubject] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [dateInput, setDateInput] = useState('');
  const [startTimeInput, setStartTimeInput] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [location, setLocation] = useState('online');
  const [yearLevel, setYearLevel] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showStudentsDropdown, setShowStudentsDropdown] = useState(false);
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);
  const [tempAmPm, setTempAmPm] = useState<'AM' | 'PM'>('AM');

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['tutorStudents'],
    queryFn: () => tutorService.getStudents(),
    enabled: !!token,
  });

  // API returns: data: [{ id, user_id, user: { id, name, email }, ... }]
  const students: Array<{ id: number; name?: string; email?: string; user?: { id: number; name: string; email: string } }> = (() => {
    const raw = studentsData?.data ?? studentsData;
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).data)) return (raw as any).data;
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).students)) return (raw as any).students;
    return [];
  })();

  useEffect(() => {
    if (session) {
      setDateInput(session.date ? formatDateForInput(new Date(session.date)) : '');
      const [h, m] = (session.start_time || '00:00').split(':').map(Number);
      setStartTimeInput(formatTime12h(h, m));
      setSubject(session.subject || '');
      setYearLevel(session.year_level || '');
      setLocation((session.location || 'online').toLowerCase());
      setSelectedStudentIds(session.students?.map((s) => s.id) || []);
      const [eh, em] = (session.end_time || '00:00').split(':').map(Number);
      const startMins = h * 60 + m;
      const endMins = eh * 60 + em;
      const dur = (endMins - startMins) / 60;
      setDurationHours(dur === 0.5 ? 0.5 : dur === 1.5 ? 1.5 : dur === 2 ? 2 : 1);
    } else if (!sessionId) {
      resetForm();
    }
  }, [session, sessionId]);

  const resetForm = () => {
    setSubject('');
    setSelectedStudentIds([]);
    setDateInput('');
    setStartTimeInput('');
    setDurationHours(1);
    setLocation('online');
    setYearLevel('');
    setErrors({});
    setShowStudentsDropdown(false);
    setShowDurationDropdown(false);
    setShowLocationDropdown(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
  };

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof tutorService.createSession>[0]) =>
      isEditing ? tutorService.updateSession(session!.id, data) : tutorService.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorSessions'] });
      queryClient.invalidateQueries({ queryKey: ['tutorDashboard'] });
      Alert.alert('Success', `Lesson ${isEditing ? 'updated' : 'added'} successfully`);
      resetForm();
      navigation.goBack();
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(errorData.errors).forEach((key) => {
          fieldErrors[key] = errorData.errors[key][0];
        });
        setErrors(fieldErrors);
      } else {
        Alert.alert('Error', errorData?.message || 'Failed to save lesson');
      }
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (selectedStudentIds.length === 0) newErrors.students = 'Select at least one student';
    if (!dateInput.trim()) newErrors.date = 'Date is required';
    if (!startTimeInput.trim()) newErrors.start_time = 'Start time is required';

    const apiDate = formatDateForApi(dateInput);
    if (dateInput && !apiDate) newErrors.date = 'Use mm/dd/yyyy format';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseStartTime = (): { h: number; m: number } | null => {
    const match = startTimeInput.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m };
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const apiDate = formatDateForApi(dateInput);
    const start = parseStartTime();
    if (!start) {
      setErrors({ ...errors, start_time: 'Use format like 10:00 AM' });
      return;
    }

    const { h: endH, m: endM } = addDurationToTime(start.h, start.m, durationHours);
    const start_time = formatTimeForApi(start.h, start.m);
    const end_time = formatTimeForApi(endH, endM);

    const sessionType = selectedStudentIds.length > 1 ? 'group' : '1:1';
    const locationValue = LOCATION_OPTIONS.find((o) => o.value === location)?.value || 'online';

    const data: Parameters<typeof tutorService.createSession>[0] = {
      date: apiDate,
      start_time,
      end_time,
      student_ids: selectedStudentIds,
      subject: subject.trim(),
      location: locationValue,
      session_type: sessionType,
    };
    if (yearLevel.trim()) data.year_level = yearLevel.trim();

    createMutation.mutate(data);
  };

  const toggleStudent = (id: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedStudents = students.filter((s) => selectedStudentIds.includes(s.id));
  const studentsDisplayText = selectedStudents.length > 0
    ? selectedStudents.map((s) => s.user?.name || s.name || `Student ${s.id}`).join(', ')
    : '';

  const durationLabel = DURATION_OPTIONS.find((o) => o.value === durationHours)?.label || '1 hour';
  const locationLabel = LOCATION_OPTIONS.find((o) => o.value === location)?.label || 'Online';

  if (isEditing && loadingSession) {
    return (
      <View style={styles.container}>
        <Header title={isEditing ? 'Edit Lesson' : 'Add Lesson'} showBack />
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={isEditing ? 'Edit Lesson' : 'Schedule New Lesson'}
        showBack
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Add a new lesson to your calendar</Text>

        <Input
          label="Subject *"
          placeholder="e.g., Mathematics, Physics, English"
          value={subject}
          onChangeText={(t) => {
            setSubject(t);
            if (errors.subject) setErrors({ ...errors, subject: '' });
          }}
          error={errors.subject}
        />

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Students * (Select one or more)</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.students && styles.dropdownError]}
            onPress={() => setShowStudentsDropdown(!showStudentsDropdown)}
          >
            <Icon name="users" size={20} color={colors.textSecondary} />
            <Text style={[styles.dropdownText, !studentsDisplayText && styles.placeholder]}>
              {studentsDisplayText || 'Select students...'}
            </Text>
            <Icon name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {errors.students && <Text style={styles.errorText}>{errors.students}</Text>}

          {showStudentsDropdown && (
            <RNModal visible transparent animationType="fade">
              <View style={styles.dropdownModalContainer}>
                <TouchableWithoutFeedback onPress={() => setShowStudentsDropdown(false)}>
                  <View style={styles.dropdownOverlay} />
                </TouchableWithoutFeedback>
                <View style={styles.dropdownPanel}>
                  <Text style={styles.dropdownPanelTitle}>Select Students</Text>
                  {loadingStudents ? (
                    <Text style={styles.emptyStudentsText}>Loading students...</Text>
                  ) : students.length > 0 ? (
                    <FlatList
                      data={students}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item }) => {
                        const isSelected = selectedStudentIds.includes(item.id);
                        return (
                          <TouchableOpacity
                            style={styles.studentRow}
                            onPress={() => toggleStudent(item.id)}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                              {isSelected ? (
                                <View style={styles.radioInner}>
                                  <Icon name="check" size={12} color={colors.textInverse} />
                                </View>
                              ) : null}
                            </View>
                            <Text style={styles.studentName}>
                              {item.user?.name || item.name || (item as any).email || `Student ${item.id}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      }}
                      style={styles.studentList}
                      contentContainerStyle={styles.studentListContent}
                      showsVerticalScrollIndicator={true}
                    />
                  ) : (
                    <Text style={styles.emptyStudentsText}>No students available</Text>
                  )}
                </View>
              </View>
            </RNModal>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Date *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.date && styles.dropdownError]}
            onPress={() => {
              setCalendarMonth(dateInput ? parseDateFromInput(dateInput) || new Date() : new Date());
              setShowDatePicker(true);
            }}
          >
            <Text style={[styles.dropdownText, !dateInput && styles.placeholder]}>
              {dateInput || 'mm/dd/yyyy'}
            </Text>
            <Icon name="calendar" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Start Time *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.start_time && styles.dropdownError]}
            onPress={() => {
              const parsed = parseStartTime();
              if (parsed) {
                setTempHour(parsed.h % 12 || 12);
                setTempMinute(parsed.m);
                setTempAmPm(parsed.h >= 12 ? 'PM' : 'AM');
              } else {
                setTempHour(9);
                setTempMinute(0);
                setTempAmPm('AM');
              }
              setShowTimePicker(true);
            }}
          >
            <Text style={[styles.dropdownText, !startTimeInput && styles.placeholder]}>
              {startTimeInput || '--:-- --'}
            </Text>
            <Icon name="clock" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {errors.start_time && <Text style={styles.errorText}>{errors.start_time}</Text>}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Duration (hours)</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowDurationDropdown(!showDurationDropdown);
              setShowLocationDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>{durationLabel}</Text>
            <Icon name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showDurationDropdown && (
            <View style={styles.optionsList}>
              {DURATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionRow, durationHours === opt.value && styles.optionRowSelected]}
                  onPress={() => {
                    setDurationHours(opt.value);
                    setShowDurationDropdown(false);
                  }}
                >
                  {durationHours === opt.value && (
                    <Icon name="check" size={18} color={colors.textInverse} />
                  )}
                  <Text style={[styles.optionText, durationHours === opt.value && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowLocationDropdown(!showLocationDropdown);
              setShowDurationDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>{locationLabel}</Text>
            <Icon name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          {showLocationDropdown && (
            <View style={styles.optionsList}>
              {LOCATION_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionRow, location === opt.value && styles.optionRowSelected]}
                  onPress={() => {
                    setLocation(opt.value);
                    setShowLocationDropdown(false);
                  }}
                >
                  {location === opt.value && (
                    <Icon name="check" size={18} color={colors.textInverse} />
                  )}
                  <Text style={[styles.optionText, location === opt.value && styles.optionTextSelected]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Input
          label="Year Level (Optional)"
          placeholder="e.g., Year 10, Year 11"
          value={yearLevel}
          onChangeText={setYearLevel}
        />

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={createMutation.isPending ? 'Saving...' : isEditing ? 'Update Lesson' : 'Add Lesson'}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            variant="primary"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>

      {showDatePicker && (() => {
        const { daysInMonth, startingDayOfWeek, year, month } = (() => {
          const d = new Date(calendarMonth);
          const first = new Date(d.getFullYear(), d.getMonth(), 1);
          const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          return {
            daysInMonth: last.getDate(),
            startingDayOfWeek: first.getDay(),
            year: d.getFullYear(),
            month: d.getMonth(),
          };
        })();
        const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        const calendarDays: (number | null)[] = [];
        for (let i = 0; i < startingDayOfWeek; i++) calendarDays.push(null);
        for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
        const selectedDate = parseDateFromInput(dateInput);
        return (
          <RNModal visible transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
              <View style={styles.pickerOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.datePickerContainer}>
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(year, month - 1, 1))}>
                  <Icon name="chevron-left" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthYear}>{MONTHS[month]} {year}</Text>
                <TouchableOpacity onPress={() => setCalendarMonth(new Date(year, month + 1, 1))}>
                  <Icon name="chevron-right" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.weekdayRow}>
                {DAYS.map((d) => <Text key={d} style={styles.weekdayLabel}>{d}</Text>)}
              </View>
              <View style={styles.calendarGrid}>
                {calendarDays.map((day, i) => {
                  const isSelected = day !== null && selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.calendarDay, isSelected && styles.calendarDaySelected]}
                      onPress={() => {
                        if (day !== null) {
                          setDateInput(formatDateForInput(new Date(year, month, day)));
                          setShowDatePicker(false);
                        }
                      }}
                      disabled={day === null}
                    >
                      {day !== null && <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextSelected]}>{day}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={() => { setDateInput(''); setShowDatePicker(false); }}>
                  <Text style={styles.clearTodayText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setDateInput(formatDateForInput(new Date())); setShowDatePicker(false); }}>
                  <Text style={styles.clearTodayText}>Today</Text>
                </TouchableOpacity>
              </View>
            </View>
          </RNModal>
        );
      })()}

      {showTimePicker && (() => {
        const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
        const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
        const applyTime = () => {
          let h = tempHour;
          if (tempAmPm === 'PM' && h !== 12) h += 12;
          if (tempAmPm === 'AM' && h === 12) h = 0;
          setStartTimeInput(formatTime12h(h, tempMinute));
          setShowTimePicker(false);
        };
        return (
          <RNModal visible transparent animationType="fade">
            <TouchableWithoutFeedback onPress={() => setShowTimePicker(false)}>
              <View style={styles.pickerOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerColumns}>
                <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={true}>
                  {hours.map((h) => {
                    const val = parseInt(h, 10);
                    const isSelected = tempHour === val;
                    return (
                      <TouchableOpacity key={h} style={[styles.timeColumnItem, isSelected && styles.timeColumnItemSelected]} onPress={() => setTempHour(val)}>
                        <Text style={[styles.timeColumnText, isSelected && styles.timeColumnTextSelected]}>{h}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={true}>
                  {minutes.map((m) => {
                    const val = parseInt(m, 10);
                    const isSelected = tempMinute === val;
                    return (
                      <TouchableOpacity key={m} style={[styles.timeColumnItem, isSelected && styles.timeColumnItemSelected]} onPress={() => setTempMinute(val)}>
                        <Text style={[styles.timeColumnText, isSelected && styles.timeColumnTextSelected]}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={true}>
                  {['AM', 'PM'].map((ap) => {
                    const isSelected = tempAmPm === ap;
                    return (
                      <TouchableOpacity key={ap} style={[styles.timeColumnItem, isSelected && styles.timeColumnItemSelected]} onPress={() => setTempAmPm(ap as 'AM' | 'PM')}>
                        <Text style={[styles.timeColumnText, isSelected && styles.timeColumnTextSelected]}>{ap}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
              <TouchableOpacity style={styles.timePickerDone} onPress={applyTime}>
                <Text style={styles.timePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </RNModal>
        );
      })()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  fieldContainer: { marginBottom: spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dropdownError: { borderColor: colors.error },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    includeFontPadding: false,
  },
  placeholder: { color: colors.textTertiary },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  dropdownModalContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    position: 'relative',
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownPanel: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  studentList: {
    maxHeight: 300,
  },
  studentListContent: {
    paddingBottom: spacing.md,
  },
  emptyStudentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    includeFontPadding: false,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    includeFontPadding: false,
  },
  todayButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  timeOptionText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  optionsList: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  optionRowSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    includeFontPadding: false,
  },
  optionTextSelected: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  cancelButton: { flex: 1 },
  submitButton: { flex: 1 },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  calendarDaySelected: {
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  calendarDayTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  clearTodayText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    includeFontPadding: false,
  },
  timePickerContainer: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 120,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  timePickerColumns: {
    flexDirection: 'row',
    height: 180,
    gap: spacing.xs,
  },
  timeColumn: {
    flex: 1,
  },
  timeColumnItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  timeColumnItemSelected: {
    backgroundColor: colors.secondary,
  },
  timeColumnText: {
    fontSize: 16,
    color: colors.text,
    includeFontPadding: false,
  },
  timeColumnTextSelected: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  timePickerDone: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  timePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
});
