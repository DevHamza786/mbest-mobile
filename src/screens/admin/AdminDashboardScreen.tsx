/**
 * AdminDashboardScreen - MBEST Mobile App
 * Admin dashboard with statistics and recent activities
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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { adminService } from '../../services/api/admin';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { AdminTabParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<AdminTabParamList>;

export const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
    enabled: !!token,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading dashboard</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dashboardData = data?.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Students</Text>
          <Text style={styles.statValue}>{dashboardData?.total_students || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Tutors</Text>
          <Text style={styles.statValue}>{dashboardData?.total_tutors || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Classes</Text>
          <Text style={styles.statValue}>{dashboardData?.total_classes || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Monthly Revenue</Text>
          <Text style={styles.statValue}>${dashboardData?.monthly_revenue?.toLocaleString() || 0}</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminUsers')}
          >
            <Text style={styles.actionButtonText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AdminClasses')}
          >
            <Text style={styles.actionButtonText}>Manage Classes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {dashboardData?.recent_activities && dashboardData.recent_activities.length > 0 ? (
          dashboardData.recent_activities.map((activity) => (
            <Card key={activity.id} style={styles.activityCard}>
              <Text style={styles.activityType}>{activity.type}</Text>
              <Text style={styles.activityDescription}>{activity.description}</Text>
              <Text style={styles.activityDate}>
                {new Date(activity.created_at).toLocaleDateString()}
              </Text>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No recent activities</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: spacing.md,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    lineHeight: 40,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 28,
    includeFontPadding: false,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    includeFontPadding: false,
  },
  activityCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  activityType: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
    lineHeight: 18,
    includeFontPadding: false,
  },
  activityDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
    includeFontPadding: false,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    includeFontPadding: false,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
    lineHeight: 24,
    includeFontPadding: false,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    includeFontPadding: false,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.md,
    lineHeight: 20,
    includeFontPadding: false,
  },
});

