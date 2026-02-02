/**
 * TutorStudentsScreen - MBEST Mobile App
 * List of students for tutor
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

export const TutorStudentsScreen: React.FC = () => {
  const { token } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['tutorStudents'],
    queryFn: () => tutorService.getStudents(),
    enabled: !!token,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading students</Text>
      </View>
    );
  }

  const students = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.studentCard}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentClass}>Class: {item.class}</Text>
            <Text style={styles.studentGrade}>Grade Average: {item.grade_average}%</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No students found</Text>}
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
  studentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  studentClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  studentGrade: {
    fontSize: 14,
    color: colors.primary,
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

