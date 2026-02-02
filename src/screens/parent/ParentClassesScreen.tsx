/**
 * ParentClassesScreen - MBEST Mobile App
 * Classes list for parent's child
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

export const ParentClassesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [selectedChildId] = useState<number>(1); // This should come from parent dashboard

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildClasses', selectedChildId],
    queryFn: () => parentService.getChildClasses(selectedChildId),
    enabled: !!token && !!selectedChildId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading classes</Text>
      </View>
    );
  }

  const classes = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.classCard}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classSubject}>{item.subject}</Text>
            <Text style={styles.classTutor}>Tutor: {item.tutor_name}</Text>
            <Text style={styles.classSchedule}>Schedule: {item.schedule}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No classes found</Text>}
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
  classCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classSubject: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classTutor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  classSchedule: {
    fontSize: 14,
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

