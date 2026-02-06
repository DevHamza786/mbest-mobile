/**
 * TutorSessionsScreen - MBEST Mobile App
 * Calendar view with session details - matching web app
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import type { TutorStackParamList } from '../../types/navigation';
import type { Session } from '../../services/api/tutor';

type NavigationPropType = NavigationProp<TutorStackParamList>;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  return { daysInMonth, startingDayOfWeek, year, month };
};

const formatTime = (time: string) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

const calculateDuration = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return '';
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
};

export const TutorSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  // Calculate date range for API call (current month)
  const monthStart = useMemo(() => {
    const date = new Date(currentMonth);
    date.setDate(1);
    return date;
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    const date = new Date(currentMonth);
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date;
  }, [currentMonth]);

  const dateFrom = monthStart.toISOString().split('T')[0];
  const dateTo = monthEnd.toISOString().split('T')[0];

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorSessions', dateFrom, dateTo],
    queryFn: () => tutorService.getSessions({ date_from: dateFrom, date_to: dateTo }),
    enabled: !!token,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tutorService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorSessions'] });
      queryClient.invalidateQueries({ queryKey: ['tutorDashboard'] });
      Alert.alert('Success', 'Session deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete session');
    },
  });

  const unavailableMutation = useMutation({
    mutationFn: (id: number) => tutorService.updateSession(id, { status: 'unavailable' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorSessions'] });
      queryClient.invalidateQueries({ queryKey: ['tutorDashboard'] });
      Alert.alert('Success', 'Session marked as unavailable');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update session');
    },
  });

  const handleDelete = (session: Session) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(session.id),
        },
      ]
    );
  };

  const handleEdit = (session: Session) => {
    navigation.navigate('AddLesson', { sessionId: session.id });
  };

  const handleCreate = () => {
    navigation.navigate('AddLesson');
  };

  const handleUnavailable = (session: Session) => {
    Alert.alert(
      'Mark as Unavailable',
      'Are you sure you want to mark this session as unavailable?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Unavailable',
          onPress: () => unavailableMutation.mutate(session.id),
        },
      ]
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentMonth(newDate);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header
          title="Calendar"
          showProfile
          rightAction={
            <TouchableOpacity
              onPress={handleCreate}
              style={styles.addButton}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Icon name="plus" size={20} color={colors.textInverse} />
              <Text style={styles.addButtonText}>Add Lesson</Text>
            </TouchableOpacity>
          }
        />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Calendar" showProfile />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading sessions</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sessionsRaw = data?.data || data || [];
  const sessions: Session[] = Array.isArray(sessionsRaw) ? sessionsRaw : [];

  // Group sessions by date - extract date directly from string to avoid timezone issues
  const sessionsByDate: Record<string, Session[]> = {};
  sessions.forEach((session) => {
    // Extract YYYY-MM-DD directly from date string (e.g., "2026-01-01T00:00:00.000000Z" -> "2026-01-01")
    const sessionDate = session.date ? session.date.split('T')[0] : '';
    if (sessionDate && !sessionsByDate[sessionDate]) {
      sessionsByDate[sessionDate] = [];
    }
    if (sessionDate) {
      sessionsByDate[sessionDate].push(session);
    }
  });

  // Get calendar structure
  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  // Format selected date as YYYY-MM-DD directly to avoid timezone conversion issues
  const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const selectedDaySessions = sessionsByDate[selectedDateStr] || [];

  // Render calendar
  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before month starts
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const isSelectedDate = (day: number | null) => {
    if (day === null) return false;
    const checkDate = new Date(year, month, day);
    return (
      checkDate.getDate() === selectedDate.getDate() &&
      checkDate.getMonth() === selectedDate.getMonth() &&
      checkDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getSessionsForDay = (day: number | null) => {
    if (day === null) return [];
    // Format date as YYYY-MM-DD directly to avoid timezone conversion issues
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessionsByDate[dateStr] || [];
  };

  return (
    <View style={styles.container}>
      <Header
        title="Calendar"
        showProfile
        rightAction={
          <TouchableOpacity
            onPress={handleCreate}
            style={styles.addButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon name="plus" size={16} color={colors.textInverse} />
            <Text style={styles.addButtonText}>Add Lesson</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Calendar View */}
        <Card variant="elevated" style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.monthNavButton}>
              <Icon name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.monthNavButton}>
              <Icon name="chevron-right" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {DAYS.map((day) => (
              <View key={day} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isSelected = isSelectedDate(day);
              const isToday = day !== null && (() => {
                const today = new Date();
                const checkDate = new Date(year, month, day);
                return (
                  checkDate.getDate() === today.getDate() &&
                  checkDate.getMonth() === today.getMonth() &&
                  checkDate.getFullYear() === today.getFullYear()
                );
              })();

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    isSelected && styles.calendarDaySelected,
                    isToday && !isSelected && styles.calendarDayToday,
                  ]}
                  onPress={() => {
                    if (day !== null) {
                      setSelectedDate(new Date(year, month, day));
                    }
                  }}
                  disabled={day === null}
                >
                  {day !== null && (
                    <>
                      <Text
                        style={[
                          styles.dayNumber,
                          isSelected && styles.dayNumberSelected,
                          isToday && !isSelected && styles.dayNumberToday,
                        ]}
                      >
                        {day}
                      </Text>
                      {daySessions.length > 0 && (
                        <View style={styles.sessionIndicators}>
                          {daySessions.slice(0, 2).map((session, idx) => (
                            <View
                              key={session.id}
                              style={[
                                styles.sessionIndicator,
                                { backgroundColor: session.color || colors.primary },
                              ]}
                            >
                              <Text style={styles.sessionIndicatorText} numberOfLines={1}>
                                {formatTime(session.start_time)}
                              </Text>
                            </View>
                          ))}
                          {daySessions.length > 2 && (
                            <Text style={styles.moreSessionsText}>
                              +{daySessions.length - 2} more
                            </Text>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Selected Day Sessions */}
        <View style={styles.sessionsSection}>
          <View style={styles.sessionsHeader}>
            <Text style={styles.sessionsTitle}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <Text style={styles.sessionsCount}>
              {selectedDaySessions.length} lesson{selectedDaySessions.length !== 1 ? 's' : ''} scheduled
            </Text>
          </View>

          {selectedDaySessions.length > 0 ? (
            selectedDaySessions.map((session) => {
              const studentNames = session.students.map((s) => s.user?.name || s.name || 'Student').filter(Boolean);
              const className = session.class_model?.name || session.subject || 'Session';
              const duration = calculateDuration(session.start_time, session.end_time);
              const isOnline = session.location?.toLowerCase() === 'online';
              const isScheduled = session.status === 'planned' || session.status === 'scheduled';
              const sessionStatus = (session.status || '').toLowerCase();
              const isClosed = sessionStatus === 'closed' || sessionStatus === 'cancelled' || sessionStatus === 'unavailable' || sessionStatus === 'completed' || sessionStatus === 'canceled';

              return (
                <Card key={session.id} variant="elevated" style={styles.sessionDetailCard}>
                  <View style={styles.sessionDetailHeader}>
                    <View style={styles.sessionDetailInfo}>
                      <Text style={styles.sessionDetailTitle}>{session.subject || className}</Text>
                      <View style={styles.sessionDetailMeta}>
                        <Text style={styles.sessionDetailTime}>
                          {formatTime(session.start_time)} - {duration}
                        </Text>
                        <Text style={styles.sessionDetailStudents}>
                          {studentNames.length} student{studentNames.length !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.sessionBadges}>
                      {isOnline && (
                        <View style={styles.badgeOnline}>
                          <Text style={styles.badgeOnlineText}>Online</Text>
                        </View>
                      )}
                      {isScheduled && (
                        <View style={styles.badgeScheduled}>
                          <Text style={styles.badgeScheduledText}>scheduled</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Students */}
                  {studentNames.length > 0 && (
                    <View style={styles.studentsSection}>
                      <Text style={styles.studentsLabel}>STUDENTS</Text>
                      <View style={styles.studentsList}>
                        {studentNames.map((name, idx) => (
                          <View key={idx} style={styles.studentBadge}>
                            <Text style={styles.studentBadgeText}>{name}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Session Details */}
                  <View style={styles.sessionDetailsList}>
                    <View style={styles.detailRow}>
                      <Icon name="user" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Tutor</Text>
                      <Text style={styles.detailValue}>Current Tutor</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name="book" size={16} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Subject</Text>
                      <Text style={styles.detailValue}>{session.subject || className}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Icon name={isOnline ? 'video' : 'map-pin'} size={16} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>
                        {isOnline ? 'Online' : session.location || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {!isClosed && (
                    <>
                      <View style={styles.sessionActions}>
                        <TouchableOpacity
                          style={styles.actionButtonEdit}
                          onPress={() => handleEdit(session)}
                        >
                          <Icon name="edit" size={16} color={colors.primary} />
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButtonComplete}
                          onPress={() => navigation.navigate('TutorSessionDetails', { sessionId: session.id })}
                        >
                          <Icon name="check" size={16} color={colors.text} />
                          <Text style={styles.actionButtonText}>Complete & Add Notes</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.sessionActionsBottom}>
                        <TouchableOpacity
                          style={styles.actionButtonCancel}
                          onPress={() => handleDelete(session)}
                        >
                          <Icon name="x" size={16} color={colors.textInverse} />
                          <Text style={styles.actionButtonCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButtonUnavailable}
                          onPress={() => handleUnavailable(session)}
                        >
                          <Icon name="alert-circle" size={16} color={colors.textInverse} />
                          <Text style={styles.actionButtonUnavailableText}>Unavailable</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </Card>
              );
            })
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Icon name="calendar" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No lessons scheduled for this day</Text>
            </Card>
          )}
        </View>
      </ScrollView>

    </View>
  );
};

const { width } = Dimensions.get('window');
const calendarCellSize = (width - spacing.lg * 2 - spacing.md) / 7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  calendarCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthNavButton: {
    padding: spacing.xs,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayCell: {
    width: calendarCellSize,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: calendarCellSize,
    minHeight: 60,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  calendarDayToday: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  calendarDaySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
    includeFontPadding: false,
  },
  dayNumberToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  dayNumberSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  sessionIndicators: {
    gap: spacing.xs / 2,
  },
  sessionIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  sessionIndicatorText: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  moreSessionsText: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    includeFontPadding: false,
  },
  sessionsSection: {
    marginBottom: spacing.lg,
  },
  sessionsHeader: {
    marginBottom: spacing.md,
  },
  sessionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sessionsCount: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  sessionDetailCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sessionDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  sessionDetailInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  sessionDetailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sessionDetailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  sessionDetailTime: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    includeFontPadding: false,
  },
  sessionDetailStudents: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  sessionBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
  },
  badgeOnline: {
    backgroundColor: colors.info,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeOnlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  badgeScheduled: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeScheduledText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'lowercase',
    includeFontPadding: false,
  },
  studentsSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  studentsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  studentsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  studentBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  studentBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    includeFontPadding: false,
  },
  sessionDetailsList: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    minWidth: 80,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButtonEdit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  actionButtonComplete: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  sessionActionsBottom: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButtonCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error,
  },
  actionButtonCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  actionButtonUnavailable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.success,
  },
  actionButtonUnavailableText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
    includeFontPadding: false,
  },
});
