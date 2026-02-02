/**
 * StudentGradeDetailsScreen - MBEST Mobile App
 * Detailed view of a specific grade
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { studentService, type Grade } from '../../services/api/student';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { StudentStackParamList } from '../../types/navigation';

type GradeDetailsRouteProp = RouteProp<StudentStackParamList, 'GradeDetails'>;

export const StudentGradeDetailsScreen: React.FC = () => {
  const route = useRoute<GradeDetailsRouteProp>();
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();
  const gradeId = route.params?.gradeId;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['studentGradeDetails', gradeId],
    queryFn: () => studentService.getGradeDetails(gradeId!),
    enabled: !!token && !!gradeId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Header title="Grade Details" showProfile={true} showBack={true} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Error loading grade details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const gradeData: Grade = data?.data || data;
  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  // Calculate percentage
  const gradeValue = parseFloat(gradeData.grade || '0');
  const maxGrade = parseFloat(gradeData.max_grade || '100');
  const percentage = Math.round((gradeValue / maxGrade) * 100);
  const isExcellent = percentage >= 90;
  const isGood = percentage >= 70;
  const isPassing = percentage >= 60;

  return (
    <View style={styles.container}>
      <Header title="Grade Details" showProfile={true} showBack={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding }
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Grade Header Card */}
        <Card variant="default" style={[
          styles.headerCard,
          isExcellent ? styles.headerCardExcellent :
          isGood ? styles.headerCardGood :
          isPassing ? styles.headerCardPassing :
          styles.headerCardFail,
        ]}>
          <View style={styles.headerTop}>
            <View style={styles.gradeIconContainer}>
              <Icon 
                name={isExcellent ? 'trophy' : isGood ? 'award' : isPassing ? 'bar-chart' : 'file-text'} 
                size={36} 
                color={colors.textInverse} 
              />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.gradeTitle} numberOfLines={2}>
                {gradeData.assessment || gradeData.assignment?.title || 'Grade'}
              </Text>
              {gradeData.subject && (
                <View style={styles.subjectRow}>
                  <Icon name="book" size={14} color={colors.textInverse} />
                  <Text style={styles.gradeSubject} numberOfLines={1}>
                    {gradeData.subject}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.gradeScoreContainer}>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreLabel}>Score</Text>
              <Text style={styles.scoreValue}>
                {gradeValue.toFixed(1)}/{maxGrade.toFixed(1)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.percentageSection}>
              <Text style={styles.percentageLabel}>Percentage</Text>
              <Text style={styles.percentageValue}>{percentage}%</Text>
            </View>
          </View>
        </Card>

        {/* Grade Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grade Information</Text>
          
          <Card variant="elevated" style={styles.infoCard}>
            {gradeData.category && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="tag" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{gradeData.category}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <View style={styles.infoIconContainer}>
                <Icon name="calendar" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Graded Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(gradeData.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </View>

            {gradeData.class_id && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconContainer}>
                  <Icon name="book" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Class</Text>
                  <Text style={styles.infoValue}>Class #{gradeData.class_id}</Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Assignment Details */}
        {gradeData.assignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignment Details</Text>
            <Card variant="elevated" style={styles.infoCard}>
              <View style={styles.assignmentHeader}>
                <View style={styles.assignmentIconContainer}>
                  <Icon name="file-text" size={24} color={colors.primary} />
                </View>
                <View style={styles.assignmentTitleContainer}>
                  <Text style={styles.assignmentTitle} numberOfLines={2}>
                    {gradeData.assignment.title}
                  </Text>
                </View>
              </View>

              {gradeData.assignment.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{gradeData.assignment.description}</Text>
                </View>
              )}

              {gradeData.assignment.instructions && (
                <View style={styles.instructionsSection}>
                  <Text style={styles.instructionsLabel}>Instructions</Text>
                  <Text style={styles.instructionsText}>
                    {gradeData.assignment.instructions.replace(/\\n/g, '\n')}
                  </Text>
                </View>
              )}

              <View style={styles.assignmentDetailsGrid}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="calendar" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Due Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(gradeData.assignment.due_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailItem}>
                  <View style={styles.detailIconContainer}>
                    <Icon name="star" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Max Points</Text>
                    <Text style={styles.detailValue}>{gradeData.assignment.max_points}</Text>
                  </View>
                </View>
              </View>

              {gradeData.assignment.allowed_file_types && gradeData.assignment.allowed_file_types.length > 0 && (
                <View style={styles.fileTypesSection}>
                  <Text style={styles.fileTypesLabel}>Allowed File Types</Text>
                  <View style={styles.fileTypesContainer}>
                    {gradeData.assignment.allowed_file_types.map((type, idx) => (
                      <View key={idx} style={styles.fileTypeTag}>
                        <Text style={styles.fileTypeText}>{type.toUpperCase()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Notes */}
        {gradeData.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructor Feedback</Text>
            <Card variant="default" style={styles.notesCard}>
              <View style={styles.notesHeader}>
                <Icon name="message-circle" size={18} color={colors.primary} />
                <Text style={styles.notesLabel}>Feedback</Text>
              </View>
              <Text style={styles.notesText}>{gradeData.notes}</Text>
            </Card>
          </View>
        )}
      </ScrollView>
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
  headerCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerCardExcellent: {
    backgroundColor: colors.success,
  },
  headerCardGood: {
    backgroundColor: colors.info,
  },
  headerCardPassing: {
    backgroundColor: colors.warning,
  },
  headerCardFail: {
    backgroundColor: colors.error,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  gradeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  gradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.xs,
    lineHeight: 28,
    includeFontPadding: false,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  gradeSubject: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textInverse,
    opacity: 0.9,
    lineHeight: 20,
    includeFontPadding: false,
  },
  gradeScoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  scoreSection: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  percentageSection: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textInverse,
    opacity: 0.85,
    marginBottom: spacing.xs,
    lineHeight: 14,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
    lineHeight: 30,
    includeFontPadding: false,
  },
  percentageLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textInverse,
    opacity: 0.85,
    marginBottom: spacing.xs,
    lineHeight: 14,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  percentageValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textInverse,
    lineHeight: 38,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 28,
    includeFontPadding: false,
  },
  infoCard: {
    padding: spacing.md,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
    includeFontPadding: false,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
    lineHeight: 18,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  assignmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  assignmentTitleContainer: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 26,
    includeFontPadding: false,
  },
  descriptionSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsSection: {
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  instructionsText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  assignmentDetailsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  detailIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
    lineHeight: 14,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  fileTypesSection: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  fileTypesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fileTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  fileTypeTag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
  },
  fileTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
    lineHeight: 14,
  },
  notesCard: {
    padding: spacing.md,
    width: '100%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 20,
    includeFontPadding: false,
  },
  notesText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 22,
  },
});

