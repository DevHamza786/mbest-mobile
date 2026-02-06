/**
 * TutorInvoicesScreen - MBEST Mobile App
 * Invoices management
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
import { Input } from '../../components/common/Input';

export const TutorInvoicesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorInvoices'],
    queryFn: () => tutorService.getInvoices(),
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: (data: { student_id: number; amount: number; description?: string; due_date: string }) =>
      tutorService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorInvoices'] });
      Alert.alert('Success', 'Invoice created successfully');
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const resetForm = () => {
    setShowCreateModal(false);
    setStudentId('');
    setAmount('');
    setDescription('');
    setDueDate('');
  };

  const handleSubmit = () => {
    if (!studentId || !amount || !dueDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    createMutation.mutate({
      student_id: parseInt(studentId),
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      due_date: dueDate,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Invoices" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Invoices" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading invoices</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const invoices = data?.data || [];

  return (
    <View style={styles.container}>
      <Header
        title="Invoices"
        showBack
        rightAction={
          <TouchableOpacity onPress={() => setShowCreateModal(true)}>
            <Icon name="plus" size={24} color={colors.textInverse} />
          </TouchableOpacity>
        }
        onRightActionPress={() => setShowCreateModal(true)}
      />
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        renderItem={({ item }) => (
          <Card style={styles.invoiceCard}>
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
                <Text style={styles.invoiceAmount}>£{item.amount.toFixed(2)}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.status === 'paid' && styles.statusPaid,
                  item.status === 'pending' && styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.dueDate}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
            {item.paid_at && (
              <Text style={styles.paidDate}>
                Paid: {new Date(item.paid_at).toLocaleDateString()}
              </Text>
            )}
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="file-text" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No invoices found</Text>
          </View>
        }
      />

      <Modal visible={showCreateModal} onClose={resetForm} title="Create Invoice">
        <View style={styles.modalContent}>
          <Input
            label="Student ID *"
            placeholder="Enter student ID"
            value={studentId}
            onChangeText={setStudentId}
            keyboardType="numeric"
          />
          <Input
            label="Amount *"
            placeholder="Enter amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
          <Input
            label="Description"
            placeholder="Enter description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Input
            label="Due Date *"
            placeholder="YYYY-MM-DD"
            value={dueDate}
            onChangeText={setDueDate}
          />
          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={resetForm}
              variant="outline"
              style={styles.modalButton}
            />
            <Button
              title="Create"
              onPress={handleSubmit}
              variant="primary"
              style={styles.modalButton}
              loading={createMutation.isPending}
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
  invoiceCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: colors.warning + '20',
  },
  statusPaid: {
    backgroundColor: colors.success + '20',
  },
  statusPending: {
    backgroundColor: colors.warning + '20',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
    includeFontPadding: false,
  },
  dueDate: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  paidDate: {
    fontSize: 12,
    color: colors.success,
    marginTop: spacing.xs,
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
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  modalButton: {
    flex: 1,
  },
});
