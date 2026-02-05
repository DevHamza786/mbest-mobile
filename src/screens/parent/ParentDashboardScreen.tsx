/**
 * ParentDashboardScreen - MBEST Mobile App
 * Matches web app Parent Dashboard design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { parentService, type ParentDashboardData, type Class } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { subscriptionService } from '../../services/api/subscription';
import type { ParentTabParamList, ParentStackParamList } from '../../types/navigation';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

type NavigationPropType = CompositeNavigationProp<
  NavigationProp<ParentTabParamList>,
  StackNavigationProp<ParentStackParamList>
>;

const DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const ParentDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { selectedChildId, setSelectedChild } = useParentStore();
  const [showChildModal, setShowChildModal] = useState(false);
  const { subscription } = useSubscriptionStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: () => parentService.getDashboard(),
    enabled: !!token,
  });

  const dashboardDataRaw = (data?.data || data) as ParentDashboardData | undefined;
  const dashboardData = dashboardDataRaw;
  const children = dashboardData?.children || [];
  const effectiveChildId = selectedChildId ?? dashboardDataRaw?.active_child?.id ?? children[0]?.id;
  const { data: classesData } = useQuery({
    queryKey: ['parentChildClasses', effectiveChildId],
    queryFn: () => parentService.getChildClasses(effectiveChildId!),
    enabled: !!token && !!effectiveChildId,
  });

  const activeChildFromApi = dashboardData?.active_child || children[0];
  const activeChild = selectedChildId
    ? children.find((c) => c.id === selectedChildId) || activeChildFromApi
    : activeChildFromApi;

  useEffect(() => {
    if (activeChildFromApi && !selectedChildId) {
      setSelectedChild(activeChildFromApi);
    }
  }, [activeChildFromApi?.id, selectedChildId, setSelectedChild]);

  // Fetch subscription to get limits (moved after children is defined)
  const { data: subscriptionData } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => subscriptionService.getMySubscription(),
    enabled: !!token,
  });

  const mySubscription = subscription || subscriptionData?.data || (subscriptionData as any);
  const maxStudents = mySubscription?.limits?.student_limit ?? mySubscription?.package?.student_limit ?? null;
  const currentStudentCount = typeof mySubscription?.current_student_count === 'number' 
    ? mySubscription.current_student_count 
    : children.length;
  const canAddMoreStudents = maxStudents == null || maxStudents === 0 || currentStudentCount < maxStudents;

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
  const stats = dashboardData?.stats;
  const recentGrades = dashboardData?.recent_grades || [];
  const todaySchedule = dashboardData?.today_schedule || [];
  const classesRaw = classesData?.data;
  const classes: Class[] = Array.isArray(classesRaw)
    ? classesRaw
    : Array.isArray((classesRaw as any)?.data)
      ? (classesRaw as any).data
      : [];

  const overallGrade = stats?.overall_grade ?? 0;
  const attendanceRate = stats?.attendance_rate ?? 0;
  const completedWork = stats?.completed_work ?? 0;
  const upcomingTests = stats?.upcoming_tests ?? 0;

  const todayDayName = DAY_NAMES[new Date().getDay()];
  const todayClasses = todaySchedule.length > 0
    ? todaySchedule
    : classes.filter((cls) => {
        const scheds = cls.schedules || [];
        if (scheds.length > 0) {
          return scheds.some((s: any) =>
            String(s.day_of_week || '').toLowerCase().includes(todayDayName.toLowerCase())
          );
        }
        if (cls.schedule) {
          return String(cls.schedule).toLowerCase().includes(todayDayName.toLowerCase());
        }
        return false;
      });

  const formatSchedule = (cls: Class | any) => {
    const scheds = cls.schedules || [];
    if (scheds.length > 0) {
      return scheds.map((s: any) =>
        `${s.day_of_week || ''} ${(s.start_time || '').substring(0, 8)}-${(s.end_time || '').substring(0, 8)}`.trim()
      );
    }
    if (cls.schedule) {
      return String(cls.schedule).split('\n').filter(Boolean);
    }
    return [];
  };

  const getInstructor = (cls: Class | any) => {
    return cls.tutor?.user?.name || cls.tutor_name || cls.instructor || 'Tutor';
  };

  const getChildName = (child: { name?: string; user?: { name?: string }; student?: { user?: { name?: string } } }) => {
    return child.name || child.user?.name || child.student?.user?.name || 'Student';
  };

  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  // Show empty state if no children
  if (children.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyIconContainer}>
            <Icon name="alert-circle" size={64} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>No Child Selected</Text>
          <Text style={styles.emptyText}>
            You haven't added any students yet. Add your first student to get started.
          </Text>
          <Button
            title="+ Add Your First Student"
            onPress={() => {
              navigation.navigate('AddStudent' as never);
            }}
            variant="primary"
            style={styles.addButton}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section - Subtitle & Actions */}
      <View style={styles.headerSection}>
        <View style={styles.headerLeft}>
          <Text style={styles.subtitle}>
            Monitoring {activeChild ? getChildName(activeChild) : 'your child'}'s academic progress
          </Text>
        </View>
        <View style={styles.headerActions}>
          {children.length > 0 && (
            <TouchableOpacity
              style={styles.studentSelector}
              onPress={() => setShowChildModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.studentInitials}>
                <Text style={styles.studentInitialsText}>
                  {activeChild ? getChildName(activeChild).split(' ').map((n) => n[0]).join('').substring(0, 2) : '?'}
                </Text>
              </View>
              <Text style={styles.studentName} numberOfLines={1}>
                {activeChild ? getChildName(activeChild) : 'Select'}
              </Text>
              <Icon name="chevron-right" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {canAddMoreStudents && (
            <TouchableOpacity
              style={styles.addStudentButton}
              onPress={() => navigation.navigate('AddStudent' as never)}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={18} color={colors.textInverse} />
              <Text style={styles.addStudentButtonText}>Add Student</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <Icon name="message-circle" size={18} color={colors.textInverse} />
            <Text style={styles.messageButtonText}>Message Tutor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Child selection modal */}
      {children.length > 0 && (
        <Modal visible={showChildModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowChildModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select Child</Text>
              {children.map((child) => {
                const isActive = activeChild?.id === child.id;
                const displayName = getChildName(child);
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
                      style={[
                        styles.modalOptionText,
                        isActive && styles.modalOptionTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
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

      {/* Student Academic Overview Card */}
      <Card variant="elevated" style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <View style={styles.overviewIconContainer}>
            <Icon name="graduation-cap" size={40} color={colors.text} />
          </View>
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewName} numberOfLines={1}>
              {activeChild ? getChildName(activeChild) : 'Student'} - Academic Overview
            </Text>
            <Text style={styles.overviewDesc}>Academic overview and performance metrics</Text>
          </View>
        </View>
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Overall Grade</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, overallGrade)}%` }]} />
          </View>
          <Text style={styles.progressValue}>{overallGrade}%</Text>
        </View>
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>Attendance Rate</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, attendanceRate)}%` }]} />
          </View>
          <Text style={styles.progressValue}>{attendanceRate}%</Text>
        </View>
      </Card>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="book" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.statValue}>{stats?.enrolled_classes || 0}</Text>
          <Text style={styles.statSubtext}>This semester</Text>
          <Text style={styles.statLabel}>Enrolled Classes</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="file-text" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.statValue}>{stats?.active_assignments || 0}</Text>
          <Text style={styles.statSubtext}>Currently due</Text>
          <Text style={styles.statLabel}>Active Assignments</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="check-circle" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.statValue}>{completedWork}</Text>
          <Text style={styles.statSubtext}>This month</Text>
          <Text style={styles.statLabel}>Completed Work</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="clock" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.statValue}>{upcomingTests}</Text>
          <Text style={styles.statSubtext}>Next 2 weeks</Text>
          <Text style={styles.statLabel}>Upcoming Tests</Text>
        </Card>
      </View>

      {/* Recent Grades */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Recent Grades</Text>
            <Text style={styles.sectionSubtitle}>Latest assignment and test results</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('ParentGrades')} activeOpacity={0.7}>
            <View style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <Icon name="chevron-right" size={16} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
        {recentGrades.length > 0 ? (
          recentGrades.map((grade) => (
            <Card key={grade.id} variant="elevated" style={styles.gradeCard}>
              <Text style={styles.gradeAssignment}>{grade.assignment_name}</Text>
              {grade.class && (
                <Text style={styles.gradeClass}>{grade.class}</Text>
              )}
              <View style={styles.gradeRow}>
                <Text style={styles.gradeScore}>
                  {grade.grade}/{grade.max_points}
                </Text>
                <Text style={styles.gradePercentage}>{grade.percentage}%</Text>
              </View>
              <Text style={styles.gradeDate}>
                {new Date(grade.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </Card>
          ))
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent grades</Text>
          </Card>
        )}
      </View>

      {/* Today's Schedule */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        <Text style={styles.sectionSubtitle}>Classes scheduled for today</Text>
        {todayClasses.length > 0 ? (
          todayClasses.map((cls) => (
            <Card key={cls.id} variant="elevated" style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleClassName}>{cls.name || cls.subject || 'Class'}</Text>
              </View>
              {formatSchedule(cls).map((sched: string, i: number) => (
                <View key={i} style={styles.scheduleRow}>
                  <Icon name="clock" size={14} color={colors.textSecondary} />
                  <Text style={styles.scheduleText}>{sched}</Text>
                </View>
              ))}
              <Text style={styles.scheduleInstructor}>
                with {getInstructor(cls)}
              </Text>
            </Card>
          ))
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes scheduled for today</Text>
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
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  headerLeft: {
    marginBottom: spacing.sm,
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
    marginBottom: spacing.md,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
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
    maxWidth: 190,
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
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  childSwitcher: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  childButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  childButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  childButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  childButtonTextActive: {
    color: colors.textInverse,
  },
  overviewCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.lg,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  overviewIconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  overviewInfo: {
    flex: 1,
  },
  overviewName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  overviewDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressValue: {
    fontSize: 12,
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
    minHeight: 120,
    ...shadows.md,
  },
  statIconTop: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  statValue: {
    fontSize: 28,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    includeFontPadding: false,
    marginBottom: spacing.md,
  },
  gradeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  gradeAssignment: {
    fontSize: 16,
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
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gradeScore: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  gradePercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  gradeDate: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  scheduleCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  scheduleClassName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  viewOnlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  viewOnlyText: {
    fontSize: 11,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  scheduleText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  scheduleInstructor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing['3xl'] * 2,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptyText: {
    color: colors.textSecondary,
    ...textStyles.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  addButton: {
    minWidth: 200,
    ...shadows.md,
  },
  addStudentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  addStudentButtonText: {
    ...textStyles.button,
    color: colors.textInverse,
    fontSize: 13,
    includeFontPadding: false,
  },
  errorText: {
    color: colors.error,
    ...textStyles.body,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.textInverse,
    ...textStyles.button,
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
});
