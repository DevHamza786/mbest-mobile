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
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { ParentTabParamList, ParentStackParamList } from '../../types/navigation';
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';

type NavProp = CompositeNavigationProp<
  NavigationProp<ParentTabParamList>,
  StackNavigationProp<ParentStackParamList>
>;

const getChildName = (child: { name?: string; user?: { name?: string }; student?: { user?: { name?: string } } }) => {
  return child.name || child.user?.name || child.student?.user?.name || 'Student';
};

export const ParentBillingScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const { selectedChild, selectedChildId } = useParentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'approved' | 'pending'>('all');

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
    queryKey: ['parentPayments'],
    queryFn: () => parentService.getPayments(),
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
  const paymentsRaw = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];
  const payments: any[] = Array.isArray(paymentsRaw) ? paymentsRaw : [];

  const totalApproved = payments
    .filter((p: any) => String(p.status || '').toLowerCase() === 'approved')
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const pendingAmount = payments
    .filter((p: any) => String(p.status || '').toLowerCase() === 'pending')
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);
  const rejectedAmount = payments
    .filter((p: any) => String(p.status || '').toLowerCase() === 'rejected')
    .reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

  const filteredPayments = payments
    .filter((p: any) => {
      const status = String(p.status || '').toLowerCase();
      if (invoiceFilter === 'all') return true;
      return status === invoiceFilter;
    })
    .filter((p: any) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      const pkg = (p.package?.name || '').toString().toLowerCase();
      const status = (p.status || '').toString().toLowerCase();
      const notes = (p.admin_notes || '').toString().toLowerCase();
      return (
        pkg.includes(q) ||
        status.includes(q) ||
        notes.includes(q) ||
        String(p.amount || '').includes(q)
      );
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
          <Text style={styles.statLabel}>Total Approved</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            ${totalApproved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {payments.filter((p: any) => String(p.status || '').toLowerCase() === 'approved').length} payments
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Pending Payments</Text>
          <Text style={[styles.statValue, { color: colors.info }]}>
            ${pendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {payments.filter((p: any) => String(p.status || '').toLowerCase() === 'pending').length} payments
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Rejected Amount</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            ${rejectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.statSubtext}>
            {payments.filter((p: any) => String(p.status || '').toLowerCase() === 'rejected').length} rejected payments
          </Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <Text style={styles.statLabel}>Total Payments</Text>
          <Text style={styles.statValue}>{payments.length}</Text>
          <Text style={styles.statSubtext}>All time</Text>
        </Card>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search payments..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, invoiceFilter === 'all' && styles.filterChipActive]}
            activeOpacity={0.8}
            onPress={() => setInvoiceFilter('all')}
          >
            <Text style={[styles.filterChipText, invoiceFilter === 'all' && styles.filterChipTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, invoiceFilter === 'approved' && styles.filterChipActive]}
            activeOpacity={0.8}
            onPress={() => setInvoiceFilter('approved')}
          >
            <Text style={[styles.filterChipText, invoiceFilter === 'approved' && styles.filterChipTextActive]}>Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, invoiceFilter === 'pending' && styles.filterChipActive]}
            activeOpacity={0.8}
            onPress={() => setInvoiceFilter('pending')}
          >
            <Text style={[styles.filterChipText, invoiceFilter === 'pending' && styles.filterChipTextActive]}>Pending</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Upgrade Plan Button */}
      <View style={styles.upgradeButtonContainer}>
        <Button title="Upgrade Plan" onPress={() => navigation.navigate('UpgradePackage')} />
      </View>

      {/* Invoice History */}
      <View style={styles.invoiceSection}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        <Text style={styles.sectionSubtitle}>View your uploaded payment slips and status</Text>

        {filteredPayments.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colInvoice]}>Package</Text>
                <Text style={[styles.tableHeaderCell, styles.colPeriod]}>Notes</Text>
                <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Approved By</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Approved At</Text>
              </View>
              {filteredPayments.map((item: any) => {
                const status = item.status || '—';
                const statusLower = String(status).toLowerCase();
                const statusColor =
                  statusLower === 'approved' ? colors.success
                  : statusLower === 'rejected' ? colors.error
                  : colors.warning;
                const adminNotes = String(item.admin_notes || '').trim();
                const packageName = item.package?.name || `#${item.package_id ?? '—'}`;
                return (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colInvoice]} numberOfLines={1}>
                      {packageName}
                    </Text>
                    <Text style={[styles.tableCell, styles.colPeriod]} numberOfLines={1}>
                      {adminNotes || '—'}
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
                      {item.approver?.name || (item.approved_by ? `#${item.approved_by}` : '—')}
                    </Text>
                    <Text style={[styles.tableCell, styles.colDate]} numberOfLines={1}>
                      {item.approved_at
                        ? new Date(item.approved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Icon name="credit-card" size={80} color={colors.textTertiary} style={{ opacity: 0.4, marginBottom: spacing.lg }} />
            <Text style={styles.emptyTitle}>No Payments Found</Text>
            <Text style={styles.emptyText}>No payment slips have been uploaded yet.</Text>
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  upgradeButtonContainer: {
    marginBottom: spacing.lg,
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
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  filterChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
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
    minWidth: 480,
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
  colInvoice: { flex: 0.3, minWidth: 0 },
  colPeriod: { flex: 0.2, minWidth: 0 },
  colAmount: { flex: 0.2, minWidth: 0 },
  colStatus: { flex: 0.2, minWidth: 0 },
  colDate: { flex: 0.3, minWidth: 0 },
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
