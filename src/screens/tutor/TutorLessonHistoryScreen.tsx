/**
 * TutorLessonHistoryScreen - MBEST Mobile App
 * Lesson history
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';

export const TutorLessonHistoryScreen: React.FC = () => {
  const { token } = useAuthStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorLessonHistory'],
    queryFn: () => tutorService.getLessonHistory(),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Lesson History" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Lesson History" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading lesson history</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const history = data?.data || [];

  return (
    <View style={styles.container}>
      <Header title="Lesson History" showBack />
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={styles.historyInfo}>
                <Text style={styles.historySubject}>{item.subject}</Text>
                <Text style={styles.historyDate}>
                  {new Date(item.date).toLocaleDateString()} • {item.duration} min
                </Text>
              </View>
            </View>
            <View style={styles.studentsContainer}>
              <Icon name="users" size={16} color={colors.textSecondary} />
              <Text style={styles.studentsText}>{item.students.join(', ')}</Text>
            </View>
            {item.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="history" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No lesson history found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  historyCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  historyHeader: {
    marginBottom: spacing.sm,
  },
  historyInfo: {
    flex: 1,
  },
  historySubject: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  studentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  studentsText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  notesContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
    includeFontPadding: false,
  },
});
