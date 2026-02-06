/**
 * TutorAssignmentDetailsScreen - MBEST Mobile App
 * Student submissions with grading functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Linking,
  Modal as RNModal,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import type { TutorStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<TutorStackParamList, 'TutorAssignmentDetails'>;

interface Submission {
  id: number;
  assignment_id: string | number;
  student_id: string | number;
  submitted_at?: string;
  status: string;
  grade?: string | number | null;
  feedback?: string | null;
  graded_at?: string | null;
  text_submission?: string | null;
  file_url?: string | null;
  link_submission?: string | null;
  student?: {
    id: number;
    user_id?: string | number;
    enrollment_id?: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
}

export const TutorAssignmentDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const { assignmentId } = route.params;
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [grade, setGrade] = useState('');
  const [maxGrade, setMaxGrade] = useState('');
  const [feedback, setFeedback] = useState('');

  // Fetch assignment details and submissions
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorAssignmentDetails', assignmentId],
    queryFn: () => tutorService.getAssignmentDetails(assignmentId),
    enabled: !!token && !!assignmentId,
  });

  // Fetch submissions separately
  const { data: submissionsData } = useQuery({
    queryKey: ['tutorAssignmentSubmissions', assignmentId],
    queryFn: () => tutorService.getAssignmentSubmissions(assignmentId),
    enabled: !!token && !!assignmentId,
  });

  const gradeMutation = useMutation({
    mutationFn: (data: { 
      grade: number; 
      max_grade: number; 
      feedback?: string; 
      assessment?: string;
      class_id?: number;
      subject?: string;
    }) => tutorService.gradeSubmission(gradingSubmission!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorAssignmentDetails', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['tutorAssignmentSubmissions', assignmentId] });
      queryClient.invalidateQueries({ queryKey: ['tutorAssignments'] });
      Alert.alert('Success', 'Submission graded successfully');
      resetGradingForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to grade submission');
    },
  });

  const resetGradingForm = () => {
    setGradingSubmission(null);
    setShowGradingModal(false);
    setGrade('');
    setMaxGrade('');
    setFeedback('');
  };

  const handleGrade = (submission: Submission) => {
    setGradingSubmission(submission);
    setMaxGrade(data?.data?.max_points?.toString() || '100');
    setShowGradingModal(true);
  };

  const handleSubmitGrade = () => {
    if (!grade || !maxGrade) {
      Alert.alert('Error', 'Please enter grade and max grade');
      return;
    }
    const gradeNum = parseFloat(grade);
    const maxGradeNum = parseFloat(maxGrade);
    if (isNaN(gradeNum) || isNaN(maxGradeNum) || gradeNum < 0 || gradeNum > maxGradeNum) {
      Alert.alert('Error', 'Invalid grade values');
      return;
    }
    
    // Extract class_id from assignment
    const classId = assignment?.class_id 
      ? (typeof assignment.class_id === 'string' ? parseInt(assignment.class_id) : assignment.class_id)
      : undefined;
    
    // Get subject from class_model or assignment
    const subject = assignment?.class_model?.name 
      || assignment?.class_model?.category 
      || assignment?.class_name 
      || 'General';
    
    const gradeData = {
      grade: gradeNum,
      max_grade: maxGradeNum,
      feedback: feedback.trim() || undefined,
      assessment: assignment?.title || 'Assignment',
      class_id: classId,
      subject: subject,
    };
    
    console.log('Submitting grade data:', gradeData);
    console.log('Assignment details:', {
      id: assignment?.id,
      title: assignment?.title,
      class_id: assignment?.class_id,
      class_model: assignment?.class_model,
    });
    
    gradeMutation.mutate(gradeData);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Student Submissions" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Student Submissions" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading submissions</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const assignment = data?.data;
  const submissionsRaw = submissionsData?.data || assignment?.submissions || [];
  const submissions: Submission[] = Array.isArray(submissionsRaw) ? submissionsRaw : [];

  const getStudentName = (submission: Submission) => {
    return submission.student?.user?.name || 'Unknown Student';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const gradedCount = submissions.filter((s) => s.status?.toLowerCase() === 'graded').length;

  return (
    <View style={styles.container}>
      <Header title={assignment?.title || 'Assignment Details'} showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Assignment Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>{assignment?.title || 'Assignment'}</Text>
          {assignment?.description && (
            <Text style={styles.description}>{assignment.description}</Text>
          )}

          {/* Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={16} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>{formatDate(assignment?.due_date)}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="award" size={16} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Max Points</Text>
                <Text style={styles.detailValue}>{assignment?.max_points || 100} points</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="users" size={16} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Submissions</Text>
                <Text style={styles.detailValue}>
                  {submissions.length} / {submissions.length}
                </Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Icon name="check-circle" size={16} color={colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Graded</Text>
                <Text style={styles.detailValue}>
                  {gradedCount} / {submissions.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Class Info */}
          {assignment?.class_model?.name && (
            <View style={styles.classInfo}>
              <Text style={styles.classLabel}>Class</Text>
              <Text style={styles.className}>
                {assignment.class_model.name}
                {assignment.class_model.code && ` (${assignment.class_model.code})`}
              </Text>
            </View>
          )}

          {/* Instructions */}
          {assignment?.instructions && (
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsLabel}>Instructions</Text>
              <Text style={styles.instructionsText}>{assignment.instructions}</Text>
            </View>
          )}
        </View>

        {/* Student Submissions Section */}
        <View style={styles.submissionsSection}>
          <Text style={styles.submissionsSectionTitle}>Student Submissions</Text>
          <Text style={styles.submissionsSectionSubtitle}>
            Review and grade student submissions for this assignment
          </Text>

          {/* Submissions List */}
          {submissions.length > 0 ? (
          submissions.map((submission) => {
            const studentName = getStudentName(submission);
            const isGraded = submission.status?.toLowerCase() === 'graded';
            const isSubmitted = submission.status?.toLowerCase() === 'submitted';
            
            const statusColor = isGraded ? colors.success : isSubmitted ? colors.info : colors.textSecondary;
            const statusBg = isGraded ? colors.success + '20' : isSubmitted ? colors.info + '20' : colors.background;

            return (
              <Card key={submission.id} style={styles.submissionCard}>
                <View style={styles.submissionHeader}>
                  <Text style={styles.studentName}>{studentName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {submission.status || 'pending'}
                    </Text>
                  </View>
                </View>

                {submission.submitted_at && (
                  <View style={styles.submittedInfo}>
                    <Icon name="clock" size={14} color={colors.textSecondary} />
                    <Text style={styles.submittedText}>
                      Submitted: {formatDateTime(submission.submitted_at)}
                    </Text>
                  </View>
                )}

                {/* Show submission content based on type */}
                {submission.text_submission && (
                  <View style={styles.submissionContent}>
                    <Text style={styles.submissionContentLabel}>Text Submission</Text>
                    <View style={styles.textSubmissionBox}>
                      <Text style={styles.textSubmissionText}>{submission.text_submission}</Text>
                    </View>
                  </View>
                )}

                {submission.file_url && (
                  <View style={styles.submissionContent}>
                    <Text style={styles.submissionContentLabel}>File Submission</Text>
                    <TouchableOpacity
                      style={styles.fileLink}
                      onPress={() => Linking.openURL(submission.file_url!)}
                    >
                      <Icon name="download" size={16} color={colors.primary} />
                      <Text style={styles.fileLinkText}>Download Submission</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {submission.link_submission && (
                  <View style={styles.submissionContent}>
                    <Text style={styles.submissionContentLabel}>Link Submission</Text>
                    <TouchableOpacity
                      style={styles.linkButton}
                      onPress={() => Linking.openURL(submission.link_submission!)}
                    >
                      <Icon name="link" size={16} color={colors.primary} />
                      <Text style={styles.linkButtonText} numberOfLines={1}>
                        {submission.link_submission}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show grade if graded */}
                {isGraded && submission.grade !== null && (
                  <View style={styles.gradeInfo}>
                    <Text style={styles.gradeLabel}>Grade:</Text>
                    <Text style={styles.gradeValue}>{submission.grade}%</Text>
                  </View>
                )}

                {/* Show feedback if available */}
                {submission.feedback && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>Feedback:</Text>
                    <Text style={styles.feedbackText}>{submission.feedback}</Text>
                  </View>
                )}

                {/* Grade button - only show if not graded */}
                {!isGraded && (
                  <TouchableOpacity
                    style={styles.gradeButton}
                    onPress={() => handleGrade(submission)}
                  >
                    <Text style={styles.gradeButtonText}>Grade Submission</Text>
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="file-text" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No submissions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <RNModal
        visible={showGradingModal}
        transparent
        animationType="fade"
        onRequestClose={resetGradingForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.gradingModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Grade Submission</Text>
              <TouchableOpacity onPress={resetGradingForm} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {gradingSubmission && (
                <View style={styles.studentInfo}>
                  <Text style={styles.studentInfoText}>
                    Grading submission for: {getStudentName(gradingSubmission)}
                  </Text>
                </View>
              )}

              <View style={styles.gradeInputRow}>
                <View style={styles.gradeInputHalf}>
                  <Input
                    label="Grade *"
                    placeholder="Enter grade"
                    value={grade}
                    onChangeText={setGrade}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.gradeInputHalf}>
                  <Input
                    label="Max Grade *"
                    placeholder="100"
                    value={maxGrade}
                    onChangeText={setMaxGrade}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Feedback (Optional)</Text>
              <TextInput
                style={styles.feedbackTextInput}
                placeholder="Enter feedback for the student..."
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                placeholderTextColor={colors.textTertiary}
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  onPress={resetGradingForm}
                  variant="outline"
                  style={styles.modalButton}
                />
                <Button
                  title={gradeMutation.isPending ? 'Submitting...' : 'Submit Grade'}
                  onPress={handleSubmitGrade}
                  variant="primary"
                  style={styles.modalButton}
                  loading={gradeMutation.isPending}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  // Assignment Details Section
  detailsSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    width: '48%',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  classInfo: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  classLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  instructionsSection: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  // Submissions Section
  submissionsSection: {
    padding: spacing.md,
  },
  submissionsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  submissionsSectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  submissionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    includeFontPadding: false,
  },
  submittedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  submittedText: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  submissionContent: {
    marginBottom: spacing.md,
  },
  submissionContentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  textSubmissionBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textSubmissionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  fileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  fileLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  linkButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  gradeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  gradeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  gradeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.success,
    includeFontPadding: false,
  },
  feedbackContainer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.sm,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    includeFontPadding: false,
  },
  gradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  gradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
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
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  // Grading Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradingModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    padding: spacing.lg,
  },
  studentInfo: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  studentInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  gradeInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gradeInputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  feedbackTextInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
  },
});
