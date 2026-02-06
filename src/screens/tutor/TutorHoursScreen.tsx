/**
 * TutorHoursScreen - MBEST Mobile App
 * Hours tracking
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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

export const TutorHoursScreen: React.FC = () => {
  const { token } = useAuthStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorHours'],
    queryFn: () => tutorService.getHours(),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Hours" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Hours" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading hours</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const hours = data?.data;

  return (
    <View style={styles.container}>
      <Header title="Hours" showBack />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Icon name="clock" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{hours?.total_hours || 0}</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="calendar" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{hours?.this_month || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="calendar-days" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{hours?.this_week || 0}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </Card>
          <Card style={styles.statCard}>
            <Icon name="book-open" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{hours?.sessions_count || 0}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </Card>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: spacing.sm,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
});
