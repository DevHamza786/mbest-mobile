/**
 * SubscriptionPackagesScreen - List subscription packages for parent
 * Parent selects a package to proceed to payment
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService, type SubscriptionPackage } from '../../services/api/subscription';
import { useAuthStore } from '../../store/authStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';
import { Logo } from '../../components/common/Logo';
import type { SubscriptionStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<SubscriptionStackParamList, 'SubscriptionPackages'>;

export const SubscriptionPackagesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();
  const { setSelectedPackage } = useSubscriptionStore();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['subscriptionPackages'],
    queryFn: () => subscriptionService.getPackages(),
    enabled: !!token,
  });

  const packages: SubscriptionPackage[] = Array.isArray(data?.data)
    ? data.data
    : [];

  const packagesFiltered = packages.filter((p) => p.is_active !== false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading packages</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSelectPackage = (pkg: SubscriptionPackage) => {
    setSelectedPackage(pkg);
    navigation.navigate('SubscriptionPayment');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Logo size="medium" showTagline={false} />
        <Text style={styles.title}>Choose a Subscription</Text>
        <Text style={styles.subtitle}>
          Select a subscription package to access the parent portal
        </Text>
      </View>

      {packagesFiltered.length === 0 ? (
        <Card variant="outlined" style={styles.emptyCard}>
          <Icon name="credit-card" size={64} color={colors.textTertiary} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyText}>No packages available at the moment</Text>
        </Card>
      ) : (
        packagesFiltered.map((pkg) => (
          <Card key={pkg.id} variant="elevated" style={styles.packageCard}>
            <View style={styles.packageHeader}>
              <Text style={styles.packageName}>{pkg.name}</Text>
              <Text style={styles.packagePrice}>${pkg.price}</Text>
            </View>
            <Text style={styles.packageDesc}>{pkg.description}</Text>
            {pkg.classes && pkg.classes.length > 0 && (
              <View style={styles.classesRow}>
                <Icon name="book" size={16} color={colors.textSecondary} />
                <Text style={styles.classesText}>
                  {pkg.classes.map((c) => c.name).join(', ')}
                </Text>
              </View>
            )}
            <View style={styles.featuresRow}>
              <Text style={styles.featureText}>
                Up to {pkg.student_limit} student{pkg.student_limit !== 1 ? 's' : ''}
              </Text>
              {pkg.allows_one_on_one && (
                <Text style={styles.featureText}>• 1:1 sessions</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => handleSelectPackage(pkg)}
              activeOpacity={0.7}
            >
              <Text style={styles.selectButtonText}>Select</Text>
              <Icon name="chevron-right" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </Card>
        ))
      )}
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
    includeFontPadding: false,
  },
  packageCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  packageName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  packagePrice: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    includeFontPadding: false,
  },
  packageDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
    includeFontPadding: false,
  },
  classesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  classesText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    includeFontPadding: false,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  featureText: {
    fontSize: 13,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
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
