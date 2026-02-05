/**
 * SubscriptionPendingScreen - Waiting for admin approval
 * Parent sees this after submitting payment slip
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../../services/api/subscription';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { Logo } from '../../components/common/Logo';

interface SubscriptionPendingScreenProps {
  onApproved?: () => void;
}

export const SubscriptionPendingScreen: React.FC<SubscriptionPendingScreenProps> = ({
  onApproved,
}) => {
  const { token } = useAuthStore();
  const { setSubscription } = useSubscriptionStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => subscriptionService.getMySubscription(),
    enabled: !!token,
    refetchInterval: 30000,
  });

  const subscription = data?.data ?? (data as any);

  useEffect(() => {
    if (subscription?.status === 'active') {
      setSubscription(subscription);
      onApproved?.();
    }
  }, [subscription?.status, setSubscription, onApproved]);

  if (isLoading && !data) {
    return <LoadingSpinner />;
  }

  const status = subscription?.status ?? null;
  const pendingPayment = subscription?.pending_payment;
  const pkg = subscription?.package ?? pendingPayment?.package;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Logo size="medium" showTagline={false} />
        <Text style={styles.title}>Waiting for Approval</Text>
        <Text style={styles.subtitle}>
          Your payment has been submitted. Our team will review it shortly.
        </Text>
      </View>

      <Card variant="elevated" style={styles.statusCard}>
        <View style={styles.statusIconRow}>
          <Icon name="clock" size={48} color={colors.warning} />
        </View>
        <Text style={styles.statusTitle}>Payment Under Review</Text>
        <Text style={styles.statusDesc}>
          You will be notified once your subscription is approved. This usually takes 1-2 business days.
        </Text>
        {pkg && (
          <View style={styles.packageInfo}>
            <Text style={styles.packageLabel}>Selected Package:</Text>
            <Text style={styles.packageName}>{pkg.name} - ${pkg.price}</Text>
          </View>
        )}
        {pendingPayment?.payment_slip_url && (
          <Text style={styles.slipNote}>Payment slip uploaded successfully</Text>
        )}
      </Card>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => refetch()}
          disabled={isRefetching}
        >
          <Icon name="clock" size={20} color={colors.primary} />
          <Text style={styles.refreshButtonText}>
            {isRefetching ? 'Checking...' : 'Check Status'}
          </Text>
        </TouchableOpacity>
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
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    includeFontPadding: false,
  },
  statusCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  statusIconRow: {
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    includeFontPadding: false,
  },
  statusDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  packageInfo: {
    alignSelf: 'stretch',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  packageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  slipNote: {
    fontSize: 13,
    color: colors.success,
    includeFontPadding: false,
  },
  actions: {
    alignItems: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  logoutSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  logoutButton: {
    borderColor: colors.error,
  },
});
