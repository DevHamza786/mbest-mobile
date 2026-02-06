/**
 * TutorDashboardScreen - MBEST Mobile App
 * Tutor dashboard with statistics and upcoming sessions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { StackNavigationProp as RNStackNavigationProp } from '@react-navigation/stack';
import { tutorService, type TutorDashboardData, type Assignment } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import type { TutorStackParamList, TutorTabParamList } from '../../types/navigation';

type TabNavigationProp = BottomTabNavigationProp<TutorTabParamList>;
type StackNavProp = RNStackNavigationProp<TutorStackParamList>;
type NavigationPropType = CompositeNavigationProp<TabNavigationProp, StackNavProp>;

export const TutorDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const insets = useSafeAreaInsets();

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard, error: dashboardError, refetch: refetchDashboard, isRefetching: isRefetchingDashboard } = useQuery({
    queryKey: ['tutorDashboard'],
    queryFn: () => tutorService.getDashboard(),
    enabled: !!token,
  });

  // Fetch assignments for overview (matching web app: per_page=5)
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['tutorAssignments', 'dashboard'],
    queryFn: () => tutorService.getAssignments(),
    enabled: !!token,
  });

  // Fetch classes for today's classes
  const { data: classesData } = useQuery({
    queryKey: ['tutorClasses', 'dashboard'],
    queryFn: () => tutorService.getClasses(),
    enabled: !!token,
  });

  const isLoading = isLoadingDashboard || isLoadingAssignments;
  const error = dashboardError;
  const refetch = refetchDashboard;
  const isRefetching = isRefetchingDashboard;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Dashboard" showProfile />
        <Text style={styles.errorText}>Error loading dashboard</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Handle different API response structures
  const dashboardDataRaw = dashboardData?.data || dashboardData;
  const dashboardDataParsed: TutorDashboardData | undefined = dashboardDataRaw as TutorDashboardData | undefined;
  
  // Get assignments for overview (limit to 5 like web app)
  const assignmentsRaw = assignmentsData?.data || assignmentsData;
  const assignmentsArray = Array.isArray(assignmentsRaw) 
    ? assignmentsRaw
    : Array.isArray((assignmentsRaw as any)?.data)
      ? (assignmentsRaw as any).data
      : [];
  const assignments: Assignment[] = assignmentsArray.slice(0, 5);
  
  // Debug logging
  if (__DEV__ && assignmentsArray.length > 0) {
    console.log('Assignments for Overview:', JSON.stringify(assignmentsArray[0], null, 2));
  }
  
  // Get today's classes
  const classesRaw = classesData?.data || [];
  const allClasses = Array.isArray(classesRaw) ? classesRaw : [];
  const today = new Date();
  const todayClasses = dashboardDataParsed?.todays_classes_list || [];
  
  // Debug logging (remove in production)
  if (__DEV__) {
    console.log('Tutor Dashboard Data:', JSON.stringify(dashboardDataRaw, null, 2));
    console.log('Assignments Data:', JSON.stringify(assignmentsRaw, null, 2));
  }

  const QuickActionsMenu = () => (
    <Modal
      visible={showQuickActions}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQuickActions(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowQuickActions(false)}
      >
        <View style={styles.quickActionsMenu}>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorSessions');
            }}
            activeOpacity={0.7}
          >
            <Icon name="calendar" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorClasses');
            }}
            activeOpacity={0.7}
          >
            <Icon name="book" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorStudents');
            }}
            activeOpacity={0.7}
          >
            <Icon name="users" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Students</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorAssignments');
            }}
            activeOpacity={0.7}
          >
            <Icon name="file-text" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Assignments</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorLessonRequests');
            }}
            activeOpacity={0.7}
          >
            <Icon name="bell" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Lesson Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => {
              setShowQuickActions(false);
              navigation.navigate('TutorAvailability');
            }}
            activeOpacity={0.7}
          >
            <Icon name="clock" size={24} color={colors.text} />
            <Text style={styles.quickActionText}>Availability</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Calculate safe bottom padding (tab bar height + safe area)
  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  return (
    <View style={styles.container}>
      <Header
        title="Tutor Dashboard"
        showProfile={true}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowQuickActions(true)}
              activeOpacity={0.7}
              style={styles.quickActionsButton}
            >
              <Icon name="zap" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        }
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding }
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
      >
        {/* Statistics Cards - Matching Web App */}
        <View style={styles.statsGrid}>
          <Card variant="elevated" style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Icon name="users" size={25} color={colors.textInverse} />
                <Text style={styles.statValue} numberOfLines={1}>
                  {dashboardDataParsed?.total_students || 0}
                </Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Total Students
              </Text>
              <Text style={styles.statSubLabel}>Across all classes</Text>
            </View>
          </Card>

          <Card variant="elevated" style={[styles.statCard, styles.statCardSuccess]}>
            <View style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Icon name="book" size={20} color={colors.textInverse} />
                <Text style={styles.statValue} numberOfLines={1}>
                  {dashboardDataParsed?.total_classes || 0}
                </Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Active Classes
              </Text>
              <Text style={styles.statSubLabel}>This semester</Text>
            </View>
          </Card>

          <Card variant="elevated" style={[styles.statCard, styles.statCardWarning]}>
            <View style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Icon name="file-text" size={20} color={colors.textInverse} />
                <Text style={styles.statValue} numberOfLines={1}>
                  {dashboardDataParsed?.pending_assignments || 0}
                </Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Pending Assignments
              </Text>
              <Text style={styles.statSubLabel}>To review</Text>
            </View>
          </Card>

          <Card variant="elevated" style={[styles.statCard, styles.statCardInfo]}>
            <View style={styles.statCardContent}>
              <View style={styles.statHeader}>
                <Icon name="calendar" size={20} color={colors.textInverse} />
                <Text style={styles.statValue} numberOfLines={1}>
                  {dashboardDataParsed?.todays_classes || 0}
                </Text>
              </View>
              <Text style={styles.statLabel} numberOfLines={2}>
                Today's Classes
              </Text>
              <Text style={styles.statSubLabel}>Scheduled</Text>
            </View>
          </Card>
        </View>

        {/* Today's Classes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Classes</Text>
          <Text style={styles.sectionSubtitle}>Your scheduled classes for today</Text>
          {todayClasses.length > 0 ? (
            todayClasses.map((session: any) => {
              const sessionId = session.id || session.session_id;
              const sessionDate = session.date ? new Date(session.date) : new Date();
              const startTime = session.start_time?.substring(0, 5) || '';
              const endTime = session.end_time?.substring(0, 5) || '';
              const students = session.students || [];
              const studentsList = Array.isArray(students) 
                ? students.map((s: any) => s.name || s || '').filter(Boolean).join(', ')
                : typeof students === 'string' ? students : '';
              
              return (
                <TouchableOpacity
                  key={sessionId || Math.random()}
                  onPress={() => sessionId && navigation.navigate('TutorSessionDetails', { sessionId })}
                  activeOpacity={0.7}
                >
                  <Card variant="elevated" style={styles.sessionCard}>
                    <View style={styles.sessionCardHeader}>
                      <View style={styles.sessionIconContainer}>
                        <Icon name="book" size={20} color={colors.textInverse} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionSubject} numberOfLines={1}>
                          {session.subject || session.title || 'Session'}
                        </Text>
                        <Text style={styles.sessionDate}>
                          {startTime && endTime ? `${startTime} - ${endTime}` : sessionDate.toLocaleDateString()}
                        </Text>
                      </View>
                      {sessionId && (
                        <Icon name="chevron-right" size={20} color={colors.textTertiary} />
                      )}
                    </View>
                    {studentsList && (
                      <View style={styles.sessionStudentsContainer}>
                        <Icon name="users" size={14} color={colors.textSecondary} />
                        <Text style={styles.sessionStudents} numberOfLines={1}>
                          {studentsList}
                        </Text>
                      </View>
                    )}
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Icon name="calendar" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No upcoming classes today</Text>
            </Card>
          )}
        </View>

        {/* Assignment Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Assignment Overview</Text>
              <Text style={styles.sectionSubtitle}>Track student submissions and grading</Text>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('TutorAssignments')}
              activeOpacity={0.7}
            >
              <View style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All</Text>
                <Icon name="chevron-right" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </View>
          {assignments.length > 0 ? (
            assignments.map((assignment) => {
              // Get submission count from API data structure
              const submissionCount = assignment.submissions_count || assignment.submission_count || assignment.submitted_count || 0;
              const totalStudents = assignment.total_students ? parseInt(String(assignment.total_students)) : 0;
              const displayCount = totalStudents > 0 ? `${submissionCount}/${totalStudents}` : `${submissionCount} submitted`;
              
              // Get class name from nested class_model or direct property
              const courseName = assignment.class_model?.name || assignment.class_name || assignment.class || 'N/A';
              
              // Status handling
              const isPublished = assignment.status === 'published' || assignment.status === 'active';
              const isArchived = assignment.status === 'archived';
              
              return (
                <TouchableOpacity
                  key={assignment.id}
                  onPress={() => navigation.navigate('TutorAssignmentDetails', { assignmentId: assignment.id })}
                  activeOpacity={0.7}
                >
                  <Card variant="elevated" style={styles.assignmentCard}>
                    <View style={styles.assignmentCardHeader}>
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentTitle} numberOfLines={2}>
                          {assignment.title}
                        </Text>
                        <Text style={styles.assignmentCourse}>{courseName}</Text>
                      </View>
                    </View>
                    <View style={styles.assignmentFooter}>
                      <View style={styles.submissionStatusContainer}>
                        <View style={styles.submissionBadge}>
                          <Text style={styles.submissionBadgeText}>
                            {displayCount}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, isPublished ? styles.statusPublished : isArchived ? styles.statusArchived : styles.statusPublished]}>
                          <Text style={[styles.statusText, isPublished && styles.statusTextPublished, isArchived && styles.statusTextArchived]}>
                            {assignment.status || 'published'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          navigation.navigate('TutorAssignmentDetails', { assignmentId: assignment.id });
                        }}
                        style={styles.reviewButtonTouchable}
                      >
                        <Text style={styles.reviewButtonText}>Review</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Card variant="outlined" style={styles.emptyCard}>
              <Icon name="file-text" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No assignments available</Text>
            </Card>
          )}
        </View>
      </ScrollView>
      <QuickActionsMenu />
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
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  quickActionsButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
    paddingRight: spacing.lg,
  },
  quickActionsMenu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.sm,
    minWidth: 200,
    ...shadows.xl,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    padding: spacing.sm,
    minHeight: 80,
    maxWidth: '60%',
  },
  statCardPrimary: {
    backgroundColor: colors.primary,
  },
  statCardWarning: {
    backgroundColor: colors.warning,
  },
  statCardSuccess: {
    backgroundColor: colors.success,
  },
  statCardInfo: {
    backgroundColor: colors.info,
  },
  statCardContent: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    width: '100%',
  },
  statHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs / 2,
    width: '100%',
  },
  statValue: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.textInverse,
    lineHeight: 22,
    includeFontPadding: false,
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 14,
    includeFontPadding: false,
    maxWidth: '100%',
  },
  statSubLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
    marginTop: spacing.xs / 2,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
    includeFontPadding: false,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
    marginBottom: spacing.md,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  sessionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    minHeight: 90,
    width: '100%',
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
    lineHeight: 22,
    includeFontPadding: false,
    flex: 1,
  },
  sessionDate: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 16,
    includeFontPadding: false,
  },
  sessionStudentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sessionStudents: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 16,
    includeFontPadding: false,
    flex: 1,
  },
  assignmentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  assignmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  assignmentCourse: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  submissionStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submissionBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
  },
  submissionBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    includeFontPadding: false,
  },
  submissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  submissionText: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  reviewButtonTouchable: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  statusPublished: {
    backgroundColor: colors.info,
  },
  statusArchived: {
    backgroundColor: colors.success + '40',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textInverse,
    textTransform: 'capitalize',
    includeFontPadding: false,
  },
  statusTextPublished: {
    color: colors.textInverse,
  },
  statusTextArchived: {
    color: colors.success,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
    includeFontPadding: false,
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
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
    includeFontPadding: false,
  },
});

