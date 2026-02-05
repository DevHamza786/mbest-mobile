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

export const ParentGradesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChildId, selectedChild, setSelectedChild } = useParentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [showChildModal, setShowChildModal] = useState(false);

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

  const responseData = data?.data;
  const gradesRaw = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];
  const grades: any[] = Array.isArray(gradesRaw) ? gradesRaw : [];

  const stats = (responseData as any)?.stats ?? dashboardRaw?.stats ?? {};
  const overallAvg = stats.overall_average ?? stats.overall_grade ?? (grades.length > 0
    ? Math.round(grades.reduce((s: number, g: any) => s + (g.percentage ?? 0), 0) / grades.length)
    : 0);
  const highestGrade = stats.highest_grade ?? (grades.length > 0
    ? Math.max(...grades.map((g: any) => g.percentage ?? 0))
    : 0);
  const subjectsCount = stats.subjects ?? new Set(grades.map((g: any) => g.class || g.subject).filter(Boolean)).size;
  const above90Count = stats.above_90 ?? grades.filter((g: any) => (g.percentage ?? 0) >= 90).length;

  const filteredGrades = grades.filter((g: any) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const assignment = (g.assignment_name || g.assignment || '').toLowerCase();
    const cls = (g.class || g.subject || '').toLowerCase();
    return assignment.includes(q) || cls.includes(q);
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

      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="bar-chart" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Overall Average</Text>
          <Text style={[styles.statValue, { color: overallAvg >= 70 ? colors.primary : colors.error }]}>
            {overallAvg}%
          </Text>
          <Text style={styles.statSubtext}>Based on {grades.length} assessments</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="trending-up" size={22} color={colors.success} />
          </View>
          <Text style={styles.statLabel}>Highest Grade</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{highestGrade}%</Text>
          <Text style={styles.statSubtext}>Best performance</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="book" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Subjects</Text>
          <Text style={styles.statValue}>{subjectsCount}</Text>
          <Text style={styles.statSubtext}>Currently enrolled</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="target" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Above 90%</Text>
          <Text style={styles.statValue}>{above90Count}</Text>
          <Text style={styles.statSubtext}>Excellent grades</Text>
        </Card>
      </View>

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
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{subjectFilter}</Text>
            <Icon name="chevron-right" size={14} color={colors.textSecondary} />
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{categoryFilter}</Text>
            <Icon name="chevron-right" size={14} color={colors.textSecondary} />
          </View>
        </View>
      </View>

      {/* Grades List */}
      <View style={styles.gradesSection}>
        {filteredGrades.length > 0 ? (
          filteredGrades.map((item: any) => (
            <Card key={item.id} variant="elevated" style={styles.gradeCard}>
              <Text style={styles.gradeAssignment}>{item.assignment_name || item.assignment}</Text>
              <Text style={styles.gradeClass}>{item.class || item.subject || '—'}</Text>
              <View style={styles.gradeScoreRow}>
                <Text style={styles.gradeScore}>
                  {item.grade}/{item.max_points}
                </Text>
                <Text style={styles.gradePercentage}>({item.percentage}%)</Text>
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
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  gradesSection: {
    marginBottom: spacing.xl,
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
