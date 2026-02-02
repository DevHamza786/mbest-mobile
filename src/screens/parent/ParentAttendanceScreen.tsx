/**
 * ParentAttendanceScreen - MBEST Mobile App
 * Attendance records for parent's child
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

export const ParentAttendanceScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [selectedChildId] = useState<number>(1); // This should come from parent dashboard

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildAttendance', selectedChildId],
    queryFn: () => parentService.getChildAttendance(selectedChildId),
    enabled: !!token && !!selectedChildId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading attendance</Text>
      </View>
    );
  }

  const attendanceData = data?.data;

  return (
    <View style={styles.container}>
      <FlatList
        data={attendanceData?.data || []}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.recordCard}>
            <Text style={styles.recordDate}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
            <Text style={styles.recordClass}>Class: {item.class}</Text>
            <View style={[styles.statusBadge, item.status === 'present' && styles.statusBadgePresent]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found</Text>}
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
  recordCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recordClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statusBadgePresent: {
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

