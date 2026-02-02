/**
 * ParentDashboardScreen - MBEST Mobile App
 * Parent dashboard with child switcher and statistics
 */

import React, { useState } from 'react';
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
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ParentTabParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<ParentTabParamList>;

export const ParentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: () => parentService.getDashboard(),
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
  const children = dashboardData?.children || [];
  const activeChild = dashboardData?.active_child || children[0];
  const stats = dashboardData?.stats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      {/* Child Switcher */}
      {children.length > 1 && (
        <View style={styles.childSwitcher}>
          <Text style={styles.childSwitcherLabel}>Select Child:</Text>
          <View style={styles.childButtons}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childButton,
                  activeChild?.id === child.id && styles.childButtonActive,
                ]}
                onPress={() => setSelectedChildId(child.id)}
              >
                <Text
                  style={[
                    styles.childButtonText,
                    activeChild?.id === child.id && styles.childButtonTextActive,
                  ]}
                >
                  {child.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Overall Grade</Text>
          <Text style={styles.statValue}>{stats?.overall_grade || 0}%</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Attendance Rate</Text>
          <Text style={styles.statValue}>{stats?.attendance_rate || 0}%</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Enrolled Classes</Text>
          <Text style={styles.statValue}>{stats?.enrolled_classes || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Active Assignments</Text>
          <Text style={styles.statValue}>{stats?.active_assignments || 0}</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ParentClasses')}
          >
            <Text style={styles.actionButtonText}>View Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('ParentAssignments')}
          >
            <Text style={styles.actionButtonText}>View Assignments</Text>
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
                {new Date(activity.date).toLocaleDateString()}
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
  childSwitcher: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  childSwitcherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  childButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  childButton: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  childButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  childButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  childButtonTextActive: {
    color: '#FFFFFF',
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
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
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
  },
  activityDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  activityDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
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
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});

