/**
 * ForgotPasswordScreen - MBEST Mobile App
 * Password reset screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { authService } from '../../services/api/auth';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import type { AuthStackParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<AuthStackParamList>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    onSuccess: (response) => {
      Alert.alert(
        'Success',
        'Password reset link has been sent to your email address.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  const validate = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendResetLink = () => {
    if (validate()) {
      forgotPasswordMutation.mutate(email.trim());
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Gradient Background Effect */}
      <View style={styles.backgroundGradient}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔐</Text>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error}
            />

            <Button
              title="Send Reset Link"
              onPress={handleSendResetLink}
              loading={forgotPasswordMutation.isPending}
              style={styles.button}
              size="large"
            />

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')} 
              style={styles.backLink}
              activeOpacity={0.7}
            >
              <Text style={styles.backLinkText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.primary,
    opacity: 0.05,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: colors.secondary,
    opacity: 0.03,
  },
  scrollContent: {
    flexGrow: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    paddingTop: spacing['3xl'],
  },
  header: {
    marginBottom: spacing['2xl'],
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    ...textStyles.h1,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.xl,
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backLink: {
    alignItems: 'center',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  backLinkText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '700',
  },
});

