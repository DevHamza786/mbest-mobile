/**
 * AddStudentScreen - Full page screen for parents to add new student accounts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { parentService } from '../../services/api/parent';
import { subscriptionService } from '../../services/api/subscription';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { useAuthStore } from '../../store/authStore';

export const AddStudentScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const { subscription } = useSubscriptionStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch subscription to get limits
  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['mySubscription'],
    queryFn: () => subscriptionService.getMySubscription(),
    enabled: !!token,
  });

  const mySubscription = subscription || subscriptionData?.data || (subscriptionData as any);
  const maxStudents = mySubscription?.limits?.student_limit ?? mySubscription?.package?.student_limit ?? null;
  const currentStudentCount = typeof mySubscription?.current_student_count === 'number' 
    ? mySubscription.current_student_count 
    : 0;

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      school?: string;
      grade?: string;
      phone?: string;
      date_of_birth?: string;
      address?: string;
      emergency_contact_name?: string;
      emergency_contact_phone?: string;
    }) => parentService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parentDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mySubscription'] });
      Alert.alert('Success', 'Student account created successfully', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            navigation.goBack();
          },
        },
      ]);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      if (errorData?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(errorData.errors).forEach((key) => {
          fieldErrors[key] = errorData.errors[key][0];
        });
        setErrors(fieldErrors);
      } else {
        const msg = errorData?.message || error.message || 'Failed to create student account';
        Alert.alert('Error', msg);
      }
    },
  });

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPasswordConfirmation('');
    setSchool('');
    setGrade('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setEmergencyContactName('');
    setEmergencyContactPhone('');
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Full name is required';
    }
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== passwordConfirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    if (!school.trim()) {
      newErrors.school = 'School is required';
    }
    if (!grade.trim()) {
      newErrors.grade = 'Grade is required';
    }
    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    if (emergencyContactPhone && !/^[\d\s\-\+\(\)]+$/.test(emergencyContactPhone)) {
      newErrors.emergency_contact_phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Check student limit
    if (maxStudents != null && maxStudents > 0 && currentStudentCount >= maxStudents) {
      Alert.alert(
        'Limit Reached',
        `You have reached the maximum number of students (${maxStudents}) allowed by your subscription package.`
      );
      return;
    }

    if (!validate()) {
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      password,
      password_confirmation: passwordConfirmation,
      school: school.trim(),
      grade: grade.trim(),
      phone: phone.trim(),
      date_of_birth: dateOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      emergency_contact_name: emergencyContactName.trim() || undefined,
      emergency_contact_phone: emergencyContactPhone.trim() || undefined,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: typeof insets.top === 'number' ? insets.top : 0 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Student</Text>
        <View style={styles.backButton} /> {/* Placeholder for alignment */}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(typeof insets.bottom === 'number' ? insets.bottom : 0, spacing.xl) }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>Create a new student account for your child</Text>

          {maxStudents != null && maxStudents > 0 && (
            <View style={styles.limitInfo}>
              <Text style={styles.limitText}>
                Students: {currentStudentCount} / {maxStudents}
              </Text>
            </View>
          )}

          <View style={styles.formContainer}>
            <Input
              label="Full Name *"
              placeholder="Enter student's full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
            />
            <Input
              label="Email *"
              placeholder="Enter email"
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
              label="Password *"
              placeholder="Enter password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirm Password *"
              placeholder="Confirm password"
              value={passwordConfirmation}
              onChangeText={(text) => {
                setPasswordConfirmation(text);
                if (errors.password_confirmation) setErrors({ ...errors, password_confirmation: '' });
              }}
              secureTextEntry
              error={errors.password_confirmation}
            />
            <Input
              label="School *"
              placeholder="Enter school name"
              value={school}
              onChangeText={(text) => {
                setSchool(text);
                if (errors.school) setErrors({ ...errors, school: '' });
              }}
              error={errors.school}
            />
            <Input
              label="Grade *"
              placeholder="e.g., Year 10"
              value={grade}
              onChangeText={(text) => {
                setGrade(text);
                if (errors.grade) setErrors({ ...errors, grade: '' });
              }}
              error={errors.grade}
            />
            <Input
              label="Phone *"
              placeholder="Enter phone number"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Input
              label="Date of Birth"
              placeholder="mm/dd/yyyy"
              value={dateOfBirth}
              onChangeText={(text) => {
                setDateOfBirth(text);
                if (errors.date_of_birth) setErrors({ ...errors, date_of_birth: '' });
              }}
              error={errors.date_of_birth}
            />
            <Input
              label="Address"
              placeholder="Enter address"
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (errors.address) setErrors({ ...errors, address: '' });
              }}
              error={errors.address}
            />
            <Input
              label="Emergency Contact Name"
              placeholder="Emergency contact name"
              value={emergencyContactName}
              onChangeText={(text) => {
                setEmergencyContactName(text);
                if (errors.emergency_contact_name) setErrors({ ...errors, emergency_contact_name: '' });
              }}
              error={errors.emergency_contact_name}
            />
            <Input
              label="Emergency Contact Phone"
              placeholder="Emergency contact phone"
              value={emergencyContactPhone}
              onChangeText={(text) => {
                setEmergencyContactPhone(text);
                if (errors.emergency_contact_phone) setErrors({ ...errors, emergency_contact_phone: '' });
              }}
              keyboardType="phone-pad"
              error={errors.emergency_contact_phone}
            />
          </View>

          <View style={styles.actions}>
            <Button
              title={createMutation.isPending ? 'Adding...' : 'Add Student'}
              onPress={handleSubmit}
              loading={createMutation.isPending}
              variant="primary"
              style={styles.submitButton}
              disabled={maxStudents != null && maxStudents > 0 ? currentStudentCount >= maxStudents : false}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textInverse,
    flex: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  limitInfo: {
    backgroundColor: colors.info + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  limitText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
    includeFontPadding: false,
  },
  formContainer: {
    marginBottom: spacing.lg,
  },
  actions: {
    marginTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  submitButton: {
    width: '100%',
  },
});
