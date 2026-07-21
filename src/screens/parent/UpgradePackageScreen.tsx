/**
 * UpgradePackageScreen - Parent picks a new package while already subscribed.
 * Their current plan stays active until this request is approved.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService, type SubscriptionPackage } from '../../services/api/subscription';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import type { ParentStackParamList } from '../../types/navigation';

type NavProp = StackNavigationProp<ParentStackParamList, 'UpgradePackage'>;

export const UpgradePackageScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { token } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['subscriptionPackages'],
    queryFn: () => subscriptionService.getPackages(),
    enabled: !!token,
  });

  const packages: SubscriptionPackage[] = Array.isArray(data?.data) ? data.data : [];
  const activePackages = packages.filter((p) => p.is_active !== false);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
    >
      <Text style={styles.subtitle}>
        Your current plan and students stay active while an upgrade request is reviewed.
      </Text>
      {activePackages.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          onPress={() =>
            navigation.navigate('UpgradePayment', {
              packageId: pkg.id,
              packageName: pkg.name,
              packagePrice: pkg.price,
            })
          }
        >
          <Card style={styles.packageCard}>
            <Text style={styles.packageName}>{pkg.name}</Text>
            <Text style={styles.packageDescription}>{pkg.description}</Text>
            <Text style={styles.packagePrice}>
              ${pkg.price} · up to {pkg.student_limit} student{pkg.student_limit === 1 ? '' : 's'}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  packageCard: { marginBottom: spacing.md, padding: spacing.md, ...shadows.sm },
  packageName: { fontSize: 16, fontWeight: '700', color: colors.text },
  packageDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  packagePrice: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: spacing.sm },
});
