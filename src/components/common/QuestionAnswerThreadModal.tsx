/**
 * QuestionAnswerThreadModal - Modal for viewing Q&A thread for assignments
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';
import { studentService } from '../../services/api/student';
import type { Assignment, AssignmentDetails } from '../../services/api/student';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface QuestionAnswerThreadModalProps {
  visible: boolean;
  onClose: () => void;
  assignmentId: number | null;
  assignment?: Assignment | AssignmentDetails | null;
}

interface QAItem {
  id: number;
  question: string;
  answer?: string;
  asked_by: string;
  answered_by?: string;
  asked_at: string;
  answered_at?: string;
  status: 'pending' | 'answered';
}

// Mock data for demonstration
const mockQAData: QAItem[] = [
  {
    id: 1,
    question: "Can you explain the concept of derivatives in more detail?",
    answer: "Derivatives measure the rate of change of a function with respect to a variable. They represent the slope of the tangent line at any point on the curve.",
    asked_by: "John Doe",
    answered_by: "Prof. Sarah Johnson",
    asked_at: "2025-12-30T10:00:00Z",
    answered_at: "2025-12-30T14:30:00Z",
    status: 'answered'
  },
  {
    id: 2,
    question: "What is the difference between mean, median, and mode?",
    asked_by: "Jane Smith",
    asked_at: "2025-12-31T09:15:00Z",
    status: 'pending'
  }
];

export const QuestionAnswerThreadModal: React.FC<QuestionAnswerThreadModalProps> = ({
  visible,
  onClose,
  assignmentId,
  assignment: assignmentProp,
}) => {
  const [newQuestion, setNewQuestion] = useState('');
  const { token } = useAuthStore();

  // Fetch Q&A thread data
  const { data: qaData, isLoading, refetch } = useQuery({
    queryKey: ['qaThread', assignmentId],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return studentService.getQAThread(assignmentId!);
      return mockQAData;
    },
    enabled: !!token && !!assignmentId && visible,
  });

  const qaItems = qaData || [];

  const handleAskQuestion = () => {
    if (newQuestion.trim()) {
      // TODO: Implement actual API call to submit question
      console.log('Submitting question:', newQuestion);
      setNewQuestion('');
      refetch();
    }
  };

  const assignment = assignmentProp;

  if (isLoading && !assignment) {
    return (
      <Modal visible={visible} onClose={onClose} title="Question & Answer Thread">
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </Modal>
    );
  }

  if (!assignment) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Question & Answer Thread">
      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        {/* Assignment Context */}
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Assignment:</Text>
          <Text style={styles.contextText}>
            {(assignment as any).title} • {(assignment as any).class_model?.name || 'General'}
          </Text>
        </View>

        {/* Q&A List */}
        <View style={styles.qaListContainer}>
          <Text style={styles.sectionTitle}>
            Questions ({qaItems.length})
          </Text>

          {qaItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="message-circle" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No questions yet</Text>
              <Text style={styles.emptySubtext}>Be the first to ask a question!</Text>
            </View>
          ) : (
            qaItems.map((item) => (
              <View key={item.id} style={styles.qaItem}>
                {/* Question */}
                <View style={styles.questionContainer}>
                  <View style={styles.questionHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.avatar}>
                        <Icon name="user" size={16} color={colors.textInverse} />
                      </View>
                      <View style={styles.userDetails}>
                        <Text style={styles.userName}>{item.asked_by}</Text>
                        <Text style={styles.timestamp}>{formatDate(item.asked_at)}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, item.status === 'answered' && styles.statusAnswered]}>
                      <Text style={styles.statusText}>
                        {item.status === 'answered' ? 'Answered' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.questionText}>{item.question}</Text>
                </View>

                {/* Answer */}
                {item.answer && (
                  <View style={styles.answerContainer}>
                    <View style={styles.answerHeader}>
                      <View style={styles.userInfo}>
                        <View style={[styles.avatar, styles.tutorAvatar]}>
                          <Icon name="graduation-cap" size={16} color={colors.textInverse} />
                        </View>
                        <View style={styles.userDetails}>
                          <Text style={styles.userName}>{item.answered_by}</Text>
                          <Text style={styles.timestamp}>{formatDate(item.answered_at!)}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.answerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Ask New Question */}
        <View style={styles.askQuestionContainer}>
          <Text style={styles.sectionTitle}>Ask a Question</Text>
          <TextInput
            style={styles.questionInput}
            placeholder="Type your question here..."
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
            value={newQuestion}
            onChangeText={setNewQuestion}
            textAlignVertical="top"
          />
          <Button
            title="Submit Question"
            onPress={handleAskQuestion}
            variant="primary"
            disabled={!newQuestion.trim()}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  closeButton: {
    padding: spacing.xs,
  },
  contextContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  contextLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  contextText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  qaListContainer: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    includeFontPadding: false,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textTertiary,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  qaItem: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  questionContainer: {
    marginBottom: spacing.md,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  tutorAvatar: {
    backgroundColor: colors.success,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
  },
  statusAnswered: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  answerContainer: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  askQuestionContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.lg,
  },
  questionInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  submitButton: {
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
});
