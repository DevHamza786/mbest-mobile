/**
 * TutorAvailabilityScreen - MBEST Mobile App
 * Manage your weekly teaching availability
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { TimePickerInput } from '../../components/common/TimePickerInput';

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface TimeSlotInput {
  day: string;
  startTime: string;
  endTime: string;
  id?: number;
}

export const TutorAvailabilityScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<{
    toAdd: TimeSlotInput[];
    toDelete: number[];
  }>({ toAdd: [], toDelete: [] });

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorAvailability'],
    queryFn: () => tutorService.getAvailability(),
    enabled: !!token,
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: (availability: Array<{
      day_of_week: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }>) => tutorService.saveAvailability(availability),
  });

  const handleAddTimeSlot = (day: string) => {
    setAddingToDay(day);
  };

  const handleSaveTimeSlot = (day: string, startTime: string, endTime: string) => {
    if (!startTime || !endTime) {
      Alert.alert('Error', 'Please enter both start and end times');
      return;
    }

    // Convert to 24-hour format if needed
    const formattedStart = convertTo24Hour(startTime);
    const formattedEnd = convertTo24Hour(endTime);

    if (formattedStart >= formattedEnd) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    // Keep in HH:MM format (no seconds needed yet)
    setPendingChanges((prev) => ({
      ...prev,
      toAdd: [...prev.toAdd, { day, startTime: formattedStart, endTime: formattedEnd }],
    }));

    setAddingToDay(null);
  };

  const handleCancelTimeSlot = () => {
    setAddingToDay(null);
  };

  const handleDeleteTimeSlot = (id: number) => {
    setPendingChanges((prev) => ({
      ...prev,
      toDelete: [...prev.toDelete, id],
    }));
  };

  const formatTimeForAPI = (time: string): string => {
    // Remove seconds if present (18:00:00 -> 18:00)
    return time.replace(/(\d{2}:\d{2})(:\d{2})?/, '$1');
  };

  const handleSaveChanges = async () => {
    try {
      const availability = Array.isArray(data?.data) ? data.data : [];
      
      // Build the complete availability array
      const availabilityData = [];
      
      // Add existing slots that are not marked for deletion
      for (const avail of availability) {
        if (!pendingChanges.toDelete.includes(avail.id)) {
          availabilityData.push({
            day_of_week: avail.day_of_week,
            start_time: formatTimeForAPI(avail.start_time),
            end_time: formatTimeForAPI(avail.end_time),
            is_available: true,
          });
        }
      }
      
      // Add new slots
      for (const slot of pendingChanges.toAdd) {
        availabilityData.push({
          day_of_week: slot.day,
          start_time: formatTimeForAPI(slot.startTime),
          end_time: formatTimeForAPI(slot.endTime),
          is_available: true,
        });
      }

      await saveAvailabilityMutation.mutateAsync(availabilityData);
      
      queryClient.invalidateQueries({ queryKey: ['tutorAvailability'] });
      setPendingChanges({ toAdd: [], toDelete: [] });
      Alert.alert('Success', 'Availability updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save changes');
    }
  };

  const convertTo24Hour = (time: string): string => {
    // Remove seconds if present (18:00:00 -> 18:00)
    const timeWithoutSeconds = time.replace(/(\d{2}:\d{2}):\d{2}/, '$1');
    
    // If already in 24-hour format (HH:MM), return as is
    if (/^\d{2}:\d{2}$/.test(timeWithoutSeconds)) {
      return timeWithoutSeconds;
    }

    // Handle 12-hour format with AM/PM
    const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }

      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    return timeWithoutSeconds;
  };

  const formatTimeDisplay = (time: string): string => {
    // Remove seconds if present (18:00:00 -> 18:00)
    const timeWithoutSeconds = time.replace(/(\d{2}:\d{2}):\d{2}/, '$1');
    
    // Convert 24-hour to 12-hour format for display
    const [hours, minutes] = timeWithoutSeconds.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Availability" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Availability" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading availability</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const availability = Array.isArray(data?.data) ? data.data : [];
  const availabilityByDay: Record<string, any[]> = {};
  
  availability.forEach((avail) => {
    const dayName = avail.day_of_week;
    if (dayName && DAYS.includes(dayName)) {
      if (!availabilityByDay[dayName]) {
        availabilityByDay[dayName] = [];
      }
      // Don't show if it's marked for deletion
      if (!pendingChanges.toDelete.includes(avail.id)) {
        availabilityByDay[dayName].push(avail);
      }
    }
  });

  // Add pending slots
  pendingChanges.toAdd.forEach((slot) => {
    if (!availabilityByDay[slot.day]) {
      availabilityByDay[slot.day] = [];
    }
    availabilityByDay[slot.day].push({
      id: `temp-${Math.random()}`,
      start_time: slot.startTime,
      end_time: slot.endTime,
      isPending: true,
    });
  });

  const hasChanges = pendingChanges.toAdd.length > 0 || pendingChanges.toDelete.length > 0;

  return (
    <View style={styles.container}>
      <Header title="Availability" showBack />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
            <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
            <Text style={styles.scheduleSubtitle}>Times in Sydney timezone</Text>
            </View>
            <Button
              title="Save Changes"
              onPress={handleSaveChanges}
              variant="primary"
              size="small"
              disabled={!hasChanges || saveAvailabilityMutation.isPending}
              loading={saveAvailabilityMutation.isPending}
              style={styles.saveButton}
            />
          </View>
        </View>

        {/* Weekly Schedule */}
        <View style={styles.scheduleSection}>
          {/* Days */}
          {DAYS.map((day) => {
            const daySlots = availabilityByDay[day] || [];
            const isAdding = addingToDay === day;

            return (
              <View key={day} style={styles.dayContainer}>
                {/* Day Header */}
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day}</Text>
                  <TouchableOpacity
                    style={styles.addTimeButton}
                    onPress={() => handleAddTimeSlot(day)}
                    disabled={isAdding}
                  >
                    <Icon name="plus" size={16} color={colors.text} />
                    <Text style={styles.addTimeText}>Add Time</Text>
                  </TouchableOpacity>
                </View>

                {/* Time Slots */}
                {daySlots.length > 0 ? (
                  daySlots.map((slot) => (
                    <View key={slot.id} style={styles.timeSlotContainer}>
                      <View
                        style={[
                          styles.timeSlotBadge,
                          slot.isPending && styles.timeSlotBadgePending,
                        ]}
                      >
                        <Text style={styles.timeSlotText}>
                          {formatTimeDisplay(slot.start_time)} -{' '}
                          {formatTimeDisplay(slot.end_time)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteTimeSlot(slot.id)}
                      >
                        <Icon name="trash-2" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))
                ) : !isAdding ? (
                  <Text style={styles.noAvailabilityText}>No availability set</Text>
                ) : null}

                {/* Add Time Slot Form */}
                {isAdding && <AddTimeSlotForm
                  onSave={(start, end) => handleSaveTimeSlot(day, start, end)}
                  onCancel={handleCancelTimeSlot}
                />}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

interface AddTimeSlotFormProps {
  onSave: (startTime: string, endTime: string) => void;
  onCancel: () => void;
}

const AddTimeSlotForm: React.FC<AddTimeSlotFormProps> = ({ onSave, onCancel }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  return (
    <View style={styles.addFormContainer}>
      <View style={styles.addFormInputs}>
        <View style={styles.timePickerWrapper}>
          <TimePickerInput
            label="Start"
            value={startTime}
            onChange={setStartTime}
            placeholder="09:00 AM"
          />
        </View>

        <Text style={styles.toText}>to</Text>

        <View style={styles.timePickerWrapper}>
          <TimePickerInput
            label="End"
            value={endTime}
            onChange={setEndTime}
            placeholder="05:00 PM"
          />
        </View>
      </View>

      <View style={styles.addFormActions}>
        <TouchableOpacity
          style={styles.saveSlotButton}
          onPress={() => onSave(startTime, endTime)}
        >
          <Icon name="check" size={20} color={colors.textInverse} />
          <Text style={styles.saveSlotButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelSlotButton} onPress={onCancel}>
          <Icon name="x" size={20} color={colors.text} />
          <Text style={styles.cancelSlotButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  saveButton: {
    minWidth: 120,
  },
  scheduleSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  scheduleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  dayContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  addTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    includeFontPadding: false,
  },
  noAvailabilityText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    includeFontPadding: false,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  timeSlotBadge: {
    flex: 1,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  timeSlotBadgePending: {
    backgroundColor: colors.warning,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  deleteButton: {
    padding: spacing.xs,
  },
  addFormContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  addFormInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timePickerWrapper: {
    flex: 1,
  },
  toText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    paddingBottom: spacing.md,
    includeFontPadding: false,
  },
  addFormActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveSlotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveSlotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  cancelSlotButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  cancelSlotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
