/**
 * TutorDashboardScreen - MBEST Mobile App
 * Tutor dashboard with statistics and upcoming sessions
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
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { TutorTabParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<TutorTabParamList>;

export const TutorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorDashboard'],
    queryFn: () => tutorService.getDashboard(),
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
          <Text style={styles.statLabel}>Upcoming Classes</Text>
          <Text style={styles.statValue}>{dashboardData?.upcoming_classes || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Assignments</Text>
          <Text style={styles.statValue}>{dashboardData?.pending_assignments || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Unread Messages</Text>
          <Text style={styles.statValue}>{dashboardData?.unread_messages || 0}</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statLabel}>Total Students</Text>
          <Text style={styles.statValue}>{dashboardData?.total_students || 0}</Text>
        </Card>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TutorCalendar')}
          >
            <Text style={styles.actionButtonText}>View Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('TutorStudents')}
          >
            <Text style={styles.actionButtonText}>View Students</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upcoming Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        {dashboardData?.upcoming_sessions && dashboardData.upcoming_sessions.length > 0 ? (
          dashboardData.upcoming_sessions.map((session) => (
            <Card key={session.id} style={styles.sessionCard}>
              <Text style={styles.sessionSubject}>{session.subject}</Text>
              <Text style={styles.sessionDate}>
                {new Date(session.date).toLocaleDateString()} at {session.time}
              </Text>
              <Text style={styles.sessionStudents}>
                Students: {session.students.join(', ')}
              </Text>
            </Card>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming sessions</Text>
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
  sessionCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 24,
    includeFontPadding: false,
  },
  sessionDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
    includeFontPadding: false,
  },
  sessionStudents: {
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

