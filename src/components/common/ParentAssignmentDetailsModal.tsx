/**
 * ParentAssignmentDetailsModal - View-only assignment details for parents
 * Clean modal layout: title, close button, content
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';

interface ParentAssignmentDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  assignment: any | null;
}

const getStatusDisplay = (dueDate: string, submissions: any[] = []) => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const isSubmitted = submissions && submissions.length > 0;
  if (isSubmitted) return { text: 'Submitted', variant: 'success' as const };
  if (diffDays < 0) return { text: 'Late', variant: 'error' as const };
  if (diffDays === 0) return { text: 'Due today', variant: 'warning' as const };
  if (diffDays === 1) return { text: 'Due tomorrow', variant: 'warning' as const };
  if (diffDays <= 3) return { text: `${diffDays} days left`, variant: 'warning' as const };
  return { text: `${diffDays} days left`, variant: 'default' as const };
};

export const ParentAssignmentDetailsModal: React.FC<ParentAssignmentDetailsModalProps> = ({
  visible,
  onClose,
  assignment,
}) => {
  if (!assignment) return null;

  const dueDate = new Date(assignment.due_date);
  const statusDisplay = getStatusDisplay(assignment.due_date, assignment.submissions);
  const className = assignment.class_model?.name ?? assignment.class ?? '—';
  const tutorName = assignment.tutor?.user?.name ?? assignment.class_model?.tutor?.user?.name ?? 'Unknown';

  const statusBg =
    statusDisplay.variant === 'error'
      ? colors.error
      : statusDisplay.variant === 'warning'
        ? colors.warning
        : statusDisplay.variant === 'success'
          ? colors.success
          : colors.textTertiary;

  return (
    <Modal visible={visible} onClose={onClose} title="Assignment Details">
      <View style={styles.content}>
        <Text style={styles.assignmentTitle}>{assignment.title}</Text>
        <Text style={styles.metaText}>
          {tutorName} • Due {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={styles.statusBadgeText}>{statusDisplay.text}</Text>
          </View>
        </View>

        {assignment.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Assignment Details</Text>
            <Text style={styles.description}>{assignment.description}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="book" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>Class: {className}</Text>
        </View>
        {assignment.max_points && (
          <View style={styles.infoRow}>
            <Icon name="target" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>Max points: {assignment.max_points}</Text>
          </View>
        )}

        {assignment.submissions?.[0]?.grade != null && (
          <View style={styles.gradeSection}>
            <Text style={styles.gradeLabel}>Grade</Text>
            <Text style={styles.gradeValue}>
              {assignment.submissions[0].grade}
              {assignment.max_points ? ` / ${assignment.max_points}` : ''}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  assignmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  description: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  gradeSection: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  gradeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  gradeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    includeFontPadding: false,
  },
  viewOnlyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
  },
  viewOnlyText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    includeFontPadding: false,
  },
  content: {
    paddingBottom: spacing.lg,
  },
});
