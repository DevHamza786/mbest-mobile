/**
 * TutorAssignmentsScreen - MBEST Mobile App
 * Assignments management for tutor
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const TutorAssignmentsScreen: React.FC = () => {
  const { token } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tutorAssignments'],
    queryFn: () => tutorService.getAssignments(),
    enabled: !!token,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading assignments</Text>
      </View>
    );
  }

  const assignments = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={assignments}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.assignmentCard}>
            <Text style={styles.assignmentTitle}>{item.title}</Text>
            <Text style={styles.assignmentClass}>Class: {item.class}</Text>
            <Text style={styles.assignmentDue}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
            <Text style={styles.assignmentSubmissions}>
              Submissions: {item.submission_count}
            </Text>
            <View style={[styles.statusBadge, item.status === 'active' && styles.statusBadgeActive]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No assignments found</Text>}
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
  assignmentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  assignmentClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  assignmentDue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  assignmentSubmissions: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});

