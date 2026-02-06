/**
 * TutorQuestionsScreen - MBEST Mobile App
 * Questions from students
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const TutorQuestionsScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorQuestions'],
    queryFn: () => tutorService.getQuestions({ answered: false }),
    enabled: !!token,
  });

  const replyMutation = useMutation({
    mutationFn: (data: { id: number; answer: string }) =>
      tutorService.replyToQuestion(data.id, data.answer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorQuestions'] });
      Alert.alert('Success', 'Answer submitted successfully');
      setSelectedQuestion(null);
      setAnswer('');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to submit answer');
    },
  });

  const handleReply = (questionId: number) => {
    setSelectedQuestion(questionId);
    setAnswer('');
  };

  const handleSubmitAnswer = () => {
    if (!answer.trim()) {
      Alert.alert('Error', 'Please enter an answer');
      return;
    }
    if (selectedQuestion) {
      replyMutation.mutate({ id: selectedQuestion, answer: answer.trim() });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Questions" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Questions" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading questions</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const questions = data?.data || [];

  return (
    <View style={styles.container}>
      <Header title="Questions" showBack />
      <FlatList
        data={questions}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.questionInfo}>
                <Text style={styles.studentName}>{item.student_name}</Text>
                <Text style={styles.questionDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <View style={styles.questionContainer}>
              <Text style={styles.questionLabel}>Question:</Text>
              <Text style={styles.questionText}>{item.question}</Text>
            </View>
            {item.answer && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerLabel}>Your Answer:</Text>
                <Text style={styles.answerText}>{item.answer}</Text>
                {item.answered_at && (
                  <Text style={styles.answeredDate}>
                    Answered: {new Date(item.answered_at).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
            {!item.answer && (
              <Button
                title="Reply"
                onPress={() => handleReply(item.id)}
                variant="primary"
                style={styles.replyButton}
              />
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="help-circle" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No unanswered questions</Text>
          </View>
        }
      />

      <Modal
        visible={selectedQuestion !== null}
        onClose={() => {
          setSelectedQuestion(null);
          setAnswer('');
        }}
        title="Reply to Question"
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalLabel}>Your Answer:</Text>
          <TextInput
            style={styles.answerInput}
            placeholder="Enter your answer..."
            value={answer}
            onChangeText={setAnswer}
            multiline
            numberOfLines={6}
            placeholderTextColor={colors.textTertiary}
          />
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setSelectedQuestion(null);
                setAnswer('');
              }}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Submit"
              onPress={handleSubmitAnswer}
              variant="primary"
              style={styles.modalButton}
              loading={replyMutation.isPending}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
  },
  questionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  questionHeader: {
    marginBottom: spacing.sm,
  },
  questionInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  questionDate: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  questionContainer: {
    marginBottom: spacing.md,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  questionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  answerContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  answerText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  answeredDate: {
    fontSize: 12,
    color: colors.success,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  replyButton: {
    marginTop: spacing.md,
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
  modalContent: {
    padding: spacing.md,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
