/**
 * ParentGradesScreen - MBEST Mobile App
 * Grades - Student's academic performance overview
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  RefreshControl,
  Dimensions,
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

const getChildName = (child: { name?: string; user?: { name?: string }; student?: { user?: { name?: string } } }) => {
  return child.name || child.user?.name || child.student?.user?.name || 'Student';
};

const getLabel = (value: any): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    if (typeof value.title === 'string') return value.title;
    if (typeof value.name === 'string') return value.name;
  }
  return '';
};

/** API may send null; Number(null) is 0 — treat null/empty as missing so we can fall back. */
const parseOptionalPercent = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') {
    const t = val.trim();
    if (!t || t.toLowerCase() === 'null') return null;
  }
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

const getGradePercent = (g: any): number | null => {
  const direct = g?.percentage;
  if (typeof direct === 'number' && Number.isFinite(direct)) return direct;
  const grade = Number(g?.grade);
  const max = Number(g?.max_grade ?? g?.max_points ?? g?.assignment?.max_points ?? 0);
  if (!Number.isFinite(grade) || !Number.isFinite(max) || max <= 0) return null;
  return (grade / max) * 100;
};

const CLASS_MODAL_LIST_MAX_HEIGHT = Math.min(380, Dimensions.get('window').height * 0.5);

export const ParentGradesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChildId, selectedChild, setSelectedChild } = useParentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [showChildModal, setShowChildModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: () => parentService.getDashboard(),
    enabled: !!token,
  });

  const dashboardRaw = (dashboardData?.data || dashboardData) as any;
  const children = dashboardRaw?.children || [];
  const activeChildFromApi = dashboardRaw?.active_child || children[0];
  const effectiveChildId = selectedChildId ?? activeChildFromApi?.id ?? children[0]?.id;

  useEffect(() => {
    if (activeChildFromApi && !selectedChildId) {
      setSelectedChild(activeChildFromApi);
    }
  }, [activeChildFromApi?.id, selectedChildId, setSelectedChild]);

  const activeChild = selectedChildId
    ? children.find((c: any) => c.id === selectedChildId) || selectedChild || activeChildFromApi
    : selectedChild || activeChildFromApi;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['parentChildGrades', effectiveChildId],
    queryFn: () => parentService.getChildGrades(effectiveChildId!),
    enabled: !!token && !!effectiveChildId,
  });

  if (!effectiveChildId) {
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
        <Text style={styles.errorText}>Error loading grades</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const apiPayload = data as any;
  const responseData = apiPayload?.data;
  const gradesRaw = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];
  const grades: any[] = Array.isArray(gradesRaw) ? gradesRaw : [];

  const stats =
    (responseData && typeof responseData === 'object' && !Array.isArray(responseData)
      ? (responseData as any).stats
      : undefined) ??
    apiPayload?.stats ??
    {};

  const gradePercents = grades.map(getGradePercent).filter((p): p is number => p !== null);
  const avgFromGrades =
    gradePercents.length > 0
      ? Number((gradePercents.reduce((a, b) => a + b, 0) / gradePercents.length).toFixed(2))
      : null;

  const overallFromApi = parseOptionalPercent(stats.overall_average ?? stats.overall_grade);
  const overallAvg =
    overallFromApi !== null
      ? Number(overallFromApi.toFixed(2))
      : avgFromGrades !== null
        ? avgFromGrades
        : 0;

  const highestFromApi = parseOptionalPercent(stats.highest_grade);
  const lowestFromApi = parseOptionalPercent(stats.lowest_grade);
  const highestFromGrades = gradePercents.length > 0 ? Math.max(...gradePercents) : null;
  const lowestFromGrades = gradePercents.length > 0 ? Math.min(...gradePercents) : null;

  const highestGrade =
    highestFromApi !== null
      ? Number(highestFromApi.toFixed(2))
      : highestFromGrades !== null
        ? Number(highestFromGrades.toFixed(2))
        : null;

  const lowestGrade =
    lowestFromApi !== null
      ? Number(lowestFromApi.toFixed(2))
      : lowestFromGrades !== null
        ? Number(lowestFromGrades.toFixed(2))
        : null;

  const averageBySubject = (stats.average_by_subject ?? {}) as Record<string, any>;
  const totalGradesCount = Number(stats.total_grades);
  const totalGrades =
    Number.isFinite(totalGradesCount) && totalGradesCount >= 0 ? totalGradesCount : grades.length;

  const classOptions = Array.from(
    new Set(
      grades
        .map((g: any) => g.class_model?.name || g.class_name || g.class?.name || g.class || '')
        .filter(Boolean)
    )
  );

  const filteredGrades = grades
    .filter((g: any) => {
      if (classFilter === 'All Classes') return true;
      const cls = String(g.class_model?.name || g.class_name || g.class?.name || g.class || '');
      return cls === classFilter;
    })
    .filter((g: any) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      const assignmentLabel = getLabel(
        g.assessment ??
          g.assignment?.title ??
          g.assignment_name ??
          g.title ??
          g.assignment
      );
      const clsLabel = getLabel(
        g.class_model?.name ??
          g.class_name ??
          g.class?.name ??
          g.class ??
          g.subject_name ??
          g.subject?.name ??
          g.subject
      );
      return assignmentLabel.toLowerCase().includes(q) || clsLabel.toLowerCase().includes(q);
    });

  const handleExportPdf = () => {
    // TODO: Implement PDF export
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >

      {/* Child selection modal */}
      {children.length > 1 && (
        <Modal visible={showChildModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowChildModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select Child</Text>
              {children.map((child: any) => {
                const isActive = activeChild?.id === child.id;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedChild(child);
                      setShowChildModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}
                      numberOfLines={1}
                    >
                      {getChildName(child)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowChildModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* API stats: overall_average, total_grades, highest_grade, lowest_grade */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="bar-chart" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Overall Average</Text>
          <Text style={[styles.statValue, { color: overallAvg >= 70 ? colors.primary : colors.error }]}>
            {overallAvg.toFixed(2)}%
          </Text>
          <Text style={styles.statSubtext}>Across all graded work</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="book" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Total Grades</Text>
          <Text style={styles.statValue}>{totalGrades}</Text>
          <Text style={styles.statSubtext}>Records on file</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="trending-up" size={22} color={colors.success} />
          </View>
          <Text style={styles.statLabel}>Highest Grade</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {highestGrade !== null ? `${highestGrade.toFixed(2)}%` : '—'}
          </Text>
          <Text style={styles.statSubtext}>Best score</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="trending-down" size={22} color={colors.error} />
          </View>
          <Text style={styles.statLabel}>Lowest Grade</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {lowestGrade !== null ? `${lowestGrade.toFixed(2)}%` : '—'}
          </Text>
          <Text style={styles.statSubtext}>Lowest score</Text>
        </Card>
      </View>

      {Object.keys(averageBySubject || {}).length > 0 && (
        <Card variant="elevated" style={styles.averageBySubjectCard}>
          <Text style={styles.averageBySubjectTitle}>Average by Subject</Text>
          {Object.entries(averageBySubject).map(([subject, avg]) => (
            <View key={subject} style={styles.averageBySubjectRow}>
              <Text style={styles.averageBySubjectSubject} numberOfLines={1}>{subject}</Text>
              <Text style={styles.averageBySubjectValue}>
                {Number(avg).toFixed(2)}%
              </Text>
            </View>
          ))}
        </Card>
      )}

      {/* Search and Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search assessments or subjects..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator
            style={styles.filterChipScroll}
            contentContainerStyle={styles.filterChipScrollContent}
            nestedScrollEnabled
          >
            <TouchableOpacity
              style={styles.filterChip}
              activeOpacity={0.7}
              onPress={() => setShowClassModal(true)}
            >
              <Text style={styles.filterChipText} numberOfLines={1}>
                {classFilter}
              </Text>
              <Icon name="chevron-right" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Class filter modal */}
      <Modal visible={showClassModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowClassModal(false)}>
          <Pressable style={[styles.modalContent, styles.classFilterModal]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Select Class</Text>
            <ScrollView
              style={[styles.classFilterListScroll, { maxHeight: CLASS_MODAL_LIST_MAX_HEIGHT }]}
              contentContainerStyle={styles.classFilterListContent}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <TouchableOpacity
                style={[styles.modalOption, classFilter === 'All Classes' && styles.modalOptionActive]}
                onPress={() => {
                  setClassFilter('All Classes');
                  setShowClassModal(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalOptionText, classFilter === 'All Classes' && styles.modalOptionTextActive]}>
                  All Classes
                </Text>
              </TouchableOpacity>
              {classOptions.map((cls) => {
                const isActive = classFilter === cls;
                return (
                  <TouchableOpacity
                    key={cls}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => {
                      setClassFilter(cls);
                      setShowClassModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]} numberOfLines={2}>
                      {cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowClassModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Grades List */}
      <View style={styles.gradesSection}>
        {filteredGrades.length > 0 ? (
          filteredGrades.map((item: any) => (
            <Card key={item.id} variant="elevated" style={styles.gradeCard}>
              <Text style={styles.gradeAssignment}>
                {getLabel(item.assessment ?? item.assignment?.title ?? item.assignment_name ?? item.title ?? item.assignment) || '—'}
              </Text>
              <Text style={styles.gradeClass}>
                {getLabel(item.class_model?.name ?? item.class_name ?? item.class?.name ?? item.class ?? item.subject_name ?? item.subject?.name ?? item.subject) || '—'}
              </Text>
              <View style={styles.gradeScoreRow}>
                <Text style={styles.gradeScore}>
                  {item.grade}/{item.max_grade ?? item.max_points ?? item.assignment?.max_points ?? '—'}
                </Text>
                <Text style={styles.gradePercentage}>
                  ({typeof item.percentage === 'number'
                    ? item.percentage
                    : Number(item.max_grade ?? item.assignment?.max_points ?? item.max_points)
                      ? Math.round((Number(item.grade) / Number(item.max_grade ?? item.assignment?.max_points ?? item.max_points)) * 100)
                      : 0}%)
                </Text>
              </View>
              <Text style={styles.gradeDate}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Card>
          ))
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Icon name="bar-chart" size={80} color={colors.textTertiary} style={{ opacity: 0.4, marginBottom: spacing.lg }} />
            <Text style={styles.emptyTitle}>No Grades Found</Text>
            <Text style={styles.emptyText}>
              {activeChild ? getChildName(activeChild) : 'Student'} has no grades recorded yet.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerLeft: {
    marginBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    maxWidth: 160,
  },
  studentInitials: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInitialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
    ...shadows.xl,
  },
  classFilterModal: {
    maxHeight: '85%',
  },
  classFilterListScroll: {
    flexGrow: 0,
  },
  classFilterListContent: {
    paddingBottom: spacing.xs,
  },
  filterChipScroll: {
    flexGrow: 0,
    maxWidth: '100%',
  },
  filterChipScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  modalOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  modalOptionActive: {
    backgroundColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  modalOptionTextActive: {
    color: colors.textInverse,
  },
  modalCancel: {
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    includeFontPadding: false,
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
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  searchRow: {
    marginBottom: spacing.lg,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    flexShrink: 0,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  gradesSection: {
    marginBottom: spacing.xl,
  },
  averageBySubjectCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  averageBySubjectTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  averageBySubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  averageBySubjectSubject: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    marginRight: spacing.md,
  },
  averageBySubjectValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    includeFontPadding: false,
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
    includeFontPadding: false,
  },
  gradeClass: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  gradeScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  gradeScore: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    includeFontPadding: false,
  },
  gradePercentage: {
    fontSize: 16,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  gradeDate: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
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
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
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
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
