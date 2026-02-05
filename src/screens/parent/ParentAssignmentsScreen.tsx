/**
 * ParentAssignmentsScreen - MBEST Mobile App
 * Assignments list for parent's child with stats, view detail, and status
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { ParentAssignmentDetailsModal } from '../../components/common/ParentAssignmentDetailsModal';

const getDaysUntilDue = (dueDate: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const getStatusDisplay = (dueDate: string, submissions: any[] = []) => {
  const days = getDaysUntilDue(dueDate);
  const isSubmitted = submissions && submissions.length > 0;
  if (isSubmitted) return { text: 'Submitted', color: colors.success };
  if (days < 0) return { text: 'Late', color: colors.error };
  if (days === 0) return { text: 'Due today', color: colors.warning };
  if (days === 1) return { text: 'Due tomorrow', color: colors.warning };
  if (days <= 3) return { text: `${days} days left`, color: colors.warning };
  return { text: `${days} days left`, color: colors.textSecondary };
};

const isDueSoon = (dueDate: string, submissions: any[] = []) => {
  const days = getDaysUntilDue(dueDate);
  return days >= 0 && days <= 3 && (!submissions || submissions.length === 0);
};

const isSubmitted = (submissions: any[] = []) => submissions && submissions.length > 0;

export const ParentAssignmentsScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChildId } = useParentStore();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildAssignments', selectedChildId],
    queryFn: () => parentService.getChildAssignments(selectedChildId!),
    enabled: !!token && !!selectedChildId,
  });

  const responseData = data?.data;
  const assignments = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];

  const stats = useMemo(() => {
    const total = assignments.length;
    const dueSoonCount = assignments.filter((a) =>
      isDueSoon(a.due_date, a.submissions)
    ).length;
    const submittedCount = assignments.filter((a) => isSubmitted(a.submissions)).length;
    const gradedSubmissions = assignments
      .filter((a) => a.submissions?.[0]?.grade != null)
      .map((a) => {
        const sub = a.submissions[0];
        const max = a.max_points ? Number(a.max_points) : 100;
        const grade = Number(sub.grade);
        return max > 0 ? (grade / max) * 100 : 0;
      });
    const avgGrade =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((s, g) => s + g, 0) / gradedSubmissions.length
          )
        : 0;

    return { total, dueSoon: dueSoonCount, submitted: submittedCount, avgGrade };
  }, [assignments]);

  if (!selectedChildId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyText}>Please select a child on the Dashboard first</Text>
        </View>
      </View>
    );
  }

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

  const statCards = [
    {
      key: 'total',
      label: 'Total Assignments',
      value: String(stats.total),
      subtext: 'This semester',
      icon: 'file-text' as const,
    },
    {
      key: 'dueSoon',
      label: 'Due Soon',
      value: String(stats.dueSoon),
      subtext: 'Need attention',
      icon: 'clock' as const,
    },
    {
      key: 'submitted',
      label: 'Submitted',
      value: String(stats.submitted),
      subtext: 'Completed work',
      icon: 'check-circle' as const,
    },
    {
      key: 'avgGrade',
      label: 'Average Grade',
      value: `${stats.avgGrade}%`,
      subtext: 'Graded assignments',
      icon: 'star' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          {statCards.map((card) => (
            <Card key={card.key} variant="elevated" style={styles.statCard}>
              <View style={styles.statIconTop}>
                <Icon name={card.icon} size={22} color={colors.textTertiary} />
              </View>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={styles.statSubtext}>{card.subtext}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </Card>
          ))}
        </View>

        {/* Assignments List */}
        <Text style={styles.listTitle}>Assignments</Text>
        {assignments.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No assignments found</Text>
          </Card>
        ) : (
          assignments.map((item) => {
            const className = item.class_model?.name ?? item.class ?? '—';
            const grade = item.grade ?? item.submissions?.[0]?.grade;
            const statusDisplay = getStatusDisplay(item.due_date, item.submissions);

            return (
              <Card key={item.id} style={styles.assignmentCard}>
                <Text style={styles.assignmentTitle}>{item.title}</Text>
                <Text style={styles.assignmentClass}>Class: {className}</Text>
                <Text style={styles.assignmentDue}>
                  Due: {new Date(item.due_date).toLocaleDateString()}
                </Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: statusDisplay.color }]}>
                    <Text style={styles.statusBadgeText}>{statusDisplay.text}</Text>
                  </View>
                </View>
                {(grade != null && grade !== '') && (
                  <Text style={styles.assignmentGrade}>Grade: {grade}</Text>
                )}
                <TouchableOpacity
                  style={styles.viewDetailButton}
                  onPress={() => {
                    setSelectedAssignment(item);
                    setShowDetailsModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDetailText}>View Detail</Text>
                  <Icon name="chevron-right" size={16} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      <ParentAssignmentDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAssignment(null);
        }}
        assignment={selectedAssignment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    minHeight: 110,
    ...shadows.md,
  },
  statIconTop: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  assignmentClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  assignmentDue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statusRow: {
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  assignmentGrade: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  viewDetailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  viewDetailText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['3xl'] * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 24,
  },
});
