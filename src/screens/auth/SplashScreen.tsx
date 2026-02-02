/**
 * SplashScreen - MBEST Mobile App
 * Shows app logo and checks authentication status
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Logo } from '../../components/common/Logo';

export const SplashScreen: React.FC = () => {
  const { loadAuth } = useAuthStore();

  useEffect(() => {
    // Load authentication state
    loadAuth();
  }, [loadAuth]);

  return (
    <View style={styles.container}>
      <Logo size="large" showTagline={true} darkBackground={false} />
      <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  loader: {
    marginTop: spacing.xl,
  },
});

