/**
 * ParentGradesScreen - MBEST Mobile App
 * Grades list for parent's child
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

export const ParentGradesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [selectedChildId] = useState<number>(1); // This should come from parent dashboard

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildGrades', selectedChildId],
    queryFn: () => parentService.getChildGrades(selectedChildId),
    enabled: !!token && !!selectedChildId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading grades</Text>
      </View>
    );
  }

  const grades = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={grades}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.gradeCard}>
            <Text style={styles.gradeAssignment}>{item.assignment_name}</Text>
            <Text style={styles.gradeClass}>Class: {item.class}</Text>
            <Text style={styles.gradeScore}>
              {item.grade}/{item.max_points} ({item.percentage}%)
            </Text>
            <Text style={styles.gradeDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No grades found</Text>}
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
  gradeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  gradeAssignment: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  gradeClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  gradeScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  gradeDate: {
    fontSize: 12,
    color: colors.textSecondary,
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

