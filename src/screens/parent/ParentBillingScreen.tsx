/**
 * ParentBillingScreen - MBEST Mobile App
 * Billing & Payments - Manage invoices and payment history
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

export const ParentBillingScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChild, selectedChildId } = useParentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState('All Invoices');

  const { data: dashboardData } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: () => parentService.getDashboard(),
    enabled: !!token,
  });

  const dashboardRaw = (dashboardData?.data || dashboardData) as any;
  const children = dashboardRaw?.children || [];
  const activeChildFromApi = dashboardRaw?.active_child || children[0];
  const activeChild = selectedChildId
    ? children.find((c: any) => c.id === selectedChildId) || selectedChild || activeChildFromApi
    : selectedChild || activeChildFromApi;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
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
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const responseData = data?.data;
  const invoicesRaw = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];
  const invoices: any[] = Array.isArray(invoicesRaw) ? invoicesRaw : [];

  const stats = (responseData as any)?.stats ?? {};
  const totalPaid = stats.total_paid ?? invoices
    .filter((i: any) => String(i.status || '').toLowerCase() === 'paid')
    .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const pendingAmount = stats.pending ?? invoices
    .filter((i: any) => String(i.status || '').toLowerCase() === 'pending')
    .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const overdueAmount = stats.overdue ?? invoices
    .filter((i: any) => {
      const status = String(i.status || '').toLowerCase();
      const due = new Date(i.due_date || 0);
      return status === 'overdue' || (status === 'pending' && due < new Date());
    })
    .reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);

  const filteredInvoices = invoices.filter((i: any) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    const num = (i.invoice_number || '').toString().toLowerCase();
    const child = (i.child_name || '').toLowerCase();
    return num.includes(q) || child.includes(q);
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >

      {/* Summary Cards */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Total Paid</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {invoices.filter((i: any) => String(i.status || '').toLowerCase() === 'paid').length} invoices
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Payments</Text>
          <Text style={[styles.statValue, { color: colors.info }]}>
            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {invoices.filter((i: any) => String(i.status || '').toLowerCase() === 'pending').length} invoices
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Overdue Amount</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            ${overdueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {invoices.filter((i: any) => {
              const s = String(i.status || '').toLowerCase();
              const due = new Date(i.due_date || 0);
              return s === 'overdue' || (s === 'pending' && due < new Date());
            }).length} overdue invoices
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Total Invoices</Text>
          <Text style={styles.statValue}>{invoices.length}</Text>
          <Text style={styles.statSubtext}>All time</Text>
        </Card>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search invoices..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterChip} activeOpacity={0.7}>
          <Text style={styles.filterChipText}>{invoiceFilter}</Text>
          <Icon name="chevron-right" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Invoice History */}
      <View style={styles.invoiceSection}>
        <Text style={styles.sectionTitle}>Invoice History</Text>
        <Text style={styles.sectionSubtitle}>View and manage your billing history</Text>

        {filteredInvoices.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.colInvoice]}>Invoice #</Text>
              <Text style={[styles.tableHeaderCell, styles.colPeriod]}>Period</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
              <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Issued On</Text>
              <Text style={[styles.tableHeaderCell, styles.colDate]}>Due Date</Text>
            </View>
            {filteredInvoices.map((item: any) => {
              const status = item.status || '—';
              const statusLower = String(status).toLowerCase();
              const statusColor =
                statusLower === 'paid' ? colors.success
                : statusLower === 'overdue' ? colors.error
                : colors.warning;
              return (
                <View key={item.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.colInvoice]} numberOfLines={1}>
                    {item.invoice_number || '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colPeriod]} numberOfLines={1}>
                    {item.period || item.child_name || '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colAmount]} numberOfLines={1}>
                    ${Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={[styles.colStatus, styles.statusCell]}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={styles.statusBadgeText}>{status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.colDate]} numberOfLines={1}>
                    {item.issued_at || item.created_at
                      ? new Date(item.issued_at || item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </Text>
                  <Text style={[styles.tableCell, styles.colDate]} numberOfLines={1}>
                    {item.due_date
                      ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Icon name="credit-card" size={80} color={colors.textTertiary} style={{ opacity: 0.4, marginBottom: spacing.lg }} />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptyText}>No invoices have been generated yet.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
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
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: 22,
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
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
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
  invoiceSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  table: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
  },
  colInvoice: { flex: 0.9, minWidth: 0 },
  colPeriod: { flex: 1, minWidth: 0 },
  colAmount: { flex: 0.8, minWidth: 0 },
  colStatus: { flex: 0.8, minWidth: 0 },
  colDate: { flex: 0.9, minWidth: 0 },
  statusCell: {
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
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
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
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
