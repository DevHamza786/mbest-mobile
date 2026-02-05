/**
 * SignUpScreen - MBEST Mobile App
 * User registration screen
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
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Logo } from '../../components/common/Logo';
import type { AuthStackParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<AuthStackParamList>;

export const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { login } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'tutor' | 'parent'>('tutor');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signUpMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role: string;
    }) => authService.register(data),
    onSuccess: (response) => {
      console.log('SignUp Success Response:', response);
      if (response && response.data) {
        const user = response.data.user || response.data;
        const token = response.data.token || response.token;
        if (user && token) {
          login(user, token);
          Alert.alert('Success', 'Account created successfully!');
        }
      }
    },
    onError: (error: any) => {
      console.error('SignUp Error:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = () => {
    if (validate()) {
      signUpMutation.mutate({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirmPassword,
        role,
      });
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
          {/* Logo/Header Section */}
          <View style={styles.header}>
            <Logo size="medium" showTagline={false} />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up as a tutor or parent to get started</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              secureTextEntry
              error={errors.confirmPassword}
            />

            {/* Role Picker - Only tutor and parent can sign up on mobile */}
            <View style={styles.roleContainer}>
              <Text style={styles.label}>I am a:</Text>
              <View style={styles.roleButtons}>
                {(['tutor', 'parent'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.roleButton, role === r && styles.roleButtonActive]}
                    onPress={() => setRole(r)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.roleIcon}>
                      {r === 'tutor' ? '👨‍🏫' : '👨‍👩‍👧'}
                    </Text>
                    <Text style={[styles.roleButtonText, role === r && styles.roleButtonTextActive]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>
                I agree to the Terms & Conditions
              </Text>
            </TouchableOpacity>
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={signUpMutation.isPending}
              style={styles.signUpButton}
              size="large"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
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
  title: {
    ...textStyles.h1,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.xl,
    marginBottom: spacing.lg,
  },
  roleContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.background,
    ...shadows.sm,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.md,
  },
  roleIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  roleButtonText: {
    ...textStyles.button,
    color: colors.text,
    fontSize: 14,
  },
  roleButtonTextActive: {
    color: colors.textInverse,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...textStyles.body,
    color: colors.text,
    flex: 1,
    fontWeight: '500',
  },
  errorText: {
    color: colors.error,
    ...textStyles.small,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  signUpButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  loginText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '700',
  },
});

