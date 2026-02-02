/**
 * ParentAssignmentsScreen - MBEST Mobile App
 * Assignments list for parent's child
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ParentAssignmentsScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [selectedChildId] = useState<number>(1); // This should come from parent dashboard

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildAssignments', selectedChildId],
    queryFn: () => parentService.getChildAssignments(selectedChildId),
    enabled: !!token && !!selectedChildId,
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
            <Text style={styles.assignmentDue}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
            <Text style={styles.assignmentStatus}>
              Status: {item.submission_status}
            </Text>
            {item.grade && (
              <Text style={styles.assignmentGrade}>Grade: {item.grade}</Text>
            )}
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
  assignmentStatus: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  assignmentGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
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

