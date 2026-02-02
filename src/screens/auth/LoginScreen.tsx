/**
 * LoginScreen - MBEST Mobile App
 * Authentication screen for user login
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
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/api/auth';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Logo } from '../../components/common/Logo';
import type { AuthStackParamList } from '../../types/navigation';

type NavigationPropType = NavigationProp<AuthStackParamList>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const login = useAuthStore((state) => state.login);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      authService.login(data),
    onSuccess: (response) => {
      console.log('Login Success Response:', response);
      
      // Handle different response structures
      if (response && response.data) {
        // Check if response has user and token
        const user = response.data.user || response.data;
        const token = response.data.token;
        
        if (user && token) {
          login(user, token);
          // Navigation will be handled automatically by AppNavigator based on user role
          return;
        }
      }
      
      // If response structure is different, try to extract data
      if (response.success === false) {
        Alert.alert('Error', response.message || 'Login failed');
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    },
    onError: (error: any) => {
      console.error('Login Error:', error);
      
      // Better error message handling
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = 
          error.response.data?.message || 
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Network Error. Please check your connection and try again.';
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
    },
  });

  // Validation
  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = () => {
    if (validate()) {
      loginMutation.mutate({ email: email.trim(), password });
    }
  };

  // Handle navigation to Sign Up
  const handleSignUp = () => {
    navigation.navigate('SignUp');
  };

  // Handle navigation to Forgot Password
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
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
            <View style={styles.logoWrapper}>
              <Logo size="large" showTagline={false} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              secureTextEntry
              error={errors.password}
            />

            {/* Remember Me & Forgot Password */}
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Remember Me</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loginMutation.isPending}
              style={styles.loginButton}
              size="medium"
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={handleSignUp} activeOpacity={0.7}>
                <Text style={styles.signUpLink}>Sign Up</Text>
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
    height: '40%',
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.5,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    zIndex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? spacing['2xl'] : spacing['2xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  logoWrapper: {
    marginTop: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
    includeFontPadding: false,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    ...shadows.xl,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    width: '50%',
    height: 40,
    alignSelf: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  signUpText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingTop: 0,
  },
  signUpLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
});

