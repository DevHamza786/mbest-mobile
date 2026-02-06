/**
 * TutorSessionDetailsScreen - MBEST Mobile App
 * Session details with notes and attendance
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import type { TutorStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<TutorStackParamList, 'TutorSessionDetails'>;

export const TutorSessionDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { sessionId } = route.params;
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorSessionDetails', sessionId],
    queryFn: () => tutorService.getSessionDetails(sessionId),
    enabled: !!token && !!sessionId,
  });

  const notesMutation = useMutation({
    mutationFn: (notesText: string) => tutorService.addSessionNotes(sessionId, notesText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorSessionDetails', sessionId] });
      Alert.alert('Success', 'Notes added successfully');
      setShowNotesInput(false);
      setNotes('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save notes');
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: (attendance: Array<{ student_id: number; status: 'present' | 'absent' | 'late' }>) =>
      tutorService.markSessionAttendance(sessionId, attendance),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorSessionDetails', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['tutorAttendance'] });
      Alert.alert('Success', 'Attendance marked successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to mark attendance');
    },
  });

  const handleMarkAttendance = () => {
    if (!data?.data?.students || data.data.students.length === 0) {
      Alert.alert('Error', 'No students in this session');
      return;
    }

    const attendance = data.data.students.map((student) => ({
      student_id: student.id,
      status: 'present' as const,
    }));

    Alert.alert(
      'Mark Attendance',
      `Mark all ${data.data.students.length} students as present?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Present',
          onPress: () => attendanceMutation.mutate(attendance),
        },
      ]
    );
  };

  const handleSaveNotes = () => {
    if (!notes.trim()) {
      Alert.alert('Error', 'Please enter notes');
      return;
    }
    notesMutation.mutate(notes.trim());
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Session Details" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Session Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading session details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const session = data?.data;

  return (
    <View style={styles.container}>
      <Header title="Session Details" showBack />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Session Information */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="book" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Subject</Text>
              <Text style={styles.infoValue}>{session?.subject}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>
                {session?.date && new Date(session.date).toLocaleDateString()} • {session?.start_time} - {session?.end_time}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="graduation-cap" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Year Level</Text>
              <Text style={styles.infoValue}>{session?.year_level}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-pin" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{session?.location}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="tag" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{session?.session_type}</Text>
            </View>
          </View>
        </Card>

        {/* Students */}
        {session?.students && session.students.length > 0 && (
          <Card style={styles.studentsCard}>
            <Text style={styles.sectionTitle}>Students ({session.students.length})</Text>
            {session.students.map((student) => (
              <View key={student.id} style={styles.studentItem}>
                <Icon name="user" size={16} color={colors.textSecondary} />
                <Text style={styles.studentName}>{student.name}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Notes */}
        <Card style={styles.notesCard}>
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>Lesson Notes</Text>
            {!showNotesInput && (
              <TouchableOpacity onPress={() => setShowNotesInput(true)}>
                <Icon name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
          {showNotesInput ? (
            <View>
              <TextInput
                style={styles.notesInput}
                placeholder="Enter lesson notes..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={6}
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.notesActions}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowNotesInput(false);
                    setNotes('');
                  }}
                  variant="outline"
                  style={styles.notesButton}
                />
                <Button
                  title="Save"
                  onPress={handleSaveNotes}
                  variant="primary"
                  style={styles.notesButton}
                  loading={notesMutation.isPending}
                />
              </View>
            </View>
          ) : (
            <Text style={styles.notesText}>
              {session?.notes || 'No notes added yet. Tap edit to add notes.'}
            </Text>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Mark Attendance"
            onPress={handleMarkAttendance}
            variant="primary"
            loading={attendanceMutation.isPending}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  studentsCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  studentName: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  notesCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  notesActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  notesButton: {
    flex: 1,
  },
  actions: {
    marginTop: spacing.md,
  },
  actionButton: {
    width: '100%',
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
});
