/**
 * TutorStudentDetailsScreen - MBEST Mobile App
 * Student details with grades and assignments
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
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { TutorStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<TutorStackParamList, 'TutorStudentDetails'>;

export const TutorStudentDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { token } = useAuthStore();
  const { studentId } = route.params;
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'assignments'>('overview');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorStudentDetails', studentId],
    queryFn: () => tutorService.getStudentDetails(studentId),
    enabled: !!token && !!studentId,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Student Details" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Student Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading student details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const student = data?.data;

  return (
    <View style={styles.container}>
      <Header title={student?.name || 'Student Details'} showBack />
      
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text
            style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}
          >
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grades' && styles.tabActive]}
          onPress={() => setActiveTab('grades')}
        >
          <Text
            style={[styles.tabText, activeTab === 'grades' && styles.tabTextActive]}
          >
            Grades
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'assignments' && styles.tabActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <Text
            style={[styles.tabText, activeTab === 'assignments' && styles.tabTextActive]}
          >
            Assignments
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {activeTab === 'overview' && (
          <>
            <Card style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Icon name="user" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{student?.name}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Icon name="mail" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{student?.email}</Text>
                </View>
              </View>
              {student?.class && (
                <View style={styles.infoRow}>
                  <Icon name="book" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Class</Text>
                    <Text style={styles.infoValue}>{student.class}</Text>
                  </View>
                </View>
              )}
              {student?.grade_average !== undefined && (
                <View style={styles.infoRow}>
                  <Icon name="star" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Grade Average</Text>
                    <Text style={styles.infoValue}>{student.grade_average}%</Text>
                  </View>
                </View>
              )}
            </Card>
          </>
        )}

        {activeTab === 'grades' && (
          <View>
            {student?.grades && student.grades.length > 0 ? (
              student.grades.map((grade) => (
                <Card key={grade.id} style={styles.gradeCard}>
                  <View style={styles.gradeHeader}>
                    <Text style={styles.gradeTitle}>{grade.assignment_title}</Text>
                    <View style={styles.gradeBadge}>
                      <Text style={styles.gradeValue}>
                        {grade.grade}/{grade.max_grade} ({grade.percentage}%)
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.gradeDate}>
                    {new Date(grade.date).toLocaleDateString()}
                  </Text>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Icon name="star" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No grades available</Text>
              </Card>
            )}
          </View>
        )}

        {activeTab === 'assignments' && (
          <View>
            {student?.assignments && student.assignments.length > 0 ? (
              student.assignments.map((assignment) => (
                <Card key={assignment.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        assignment.status === 'submitted' && styles.statusSubmitted,
                        assignment.status === 'graded' && styles.statusGraded,
                      ]}
                    >
                      <Text style={styles.statusText}>{assignment.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.assignmentDue}>
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </Text>
                </Card>
              ))
            ) : (
              <Card style={styles.emptyCard}>
                <Icon name="file-text" size={32} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No assignments available</Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  gradeCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  gradeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  gradeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  gradeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  gradeDate: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  assignmentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  assignmentDue: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: colors.warning + '20',
  },
  statusSubmitted: {
    backgroundColor: colors.info + '20',
  },
  statusGraded: {
    backgroundColor: colors.success + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
    includeFontPadding: false,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
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
