/**
 * ParentBillingScreen - MBEST Mobile App
 * Billing and invoices for parent
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ParentBillingScreen: React.FC = () => {
  const { token } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentInvoices'],
    queryFn: () => parentService.getInvoices(),
    enabled: !!token,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading invoices</Text>
      </View>
    );
  }

  const invoices = data?.data || [];

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.invoiceCard}>
            <Text style={styles.invoiceNumber}>Invoice #{item.invoice_number}</Text>
            <Text style={styles.invoiceChild}>Child: {item.child_name}</Text>
            <Text style={styles.invoiceAmount}>Amount: ${item.amount.toLocaleString()}</Text>
            <Text style={styles.invoiceDue}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
            <View style={[styles.statusBadge, item.status === 'paid' && styles.statusBadgePaid]}>
              <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
            </View>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No invoices found</Text>}
      />
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
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  invoiceChild: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  invoiceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  invoiceDue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statusBadgePaid: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});

