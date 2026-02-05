/**
 * AddStudentModal - Modal for parents to add new student accounts
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { Icon } from './Icon';
import { parentService } from '../../services/api/parent';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface AddStudentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  maxStudents?: number;
  currentStudentCount?: number;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  visible,
  onClose,
  onSuccess,
  maxStudents,
  currentStudentCount = 0,
}) => {
  const queryClient = useQueryClient();
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
      Alert.alert('Success', 'Student account created successfully');
      resetForm();
      onSuccess?.();
      onClose();
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
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
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
    if (maxStudents && currentStudentCount >= maxStudents) {
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
      school: school.trim() || undefined,
      grade: grade.trim() || undefined,
      phone: phone.trim() || undefined,
      date_of_birth: dateOfBirth.trim() || undefined,
      address: address.trim() || undefined,
      emergency_contact_name: emergencyContactName.trim() || undefined,
      emergency_contact_phone: emergencyContactPhone.trim() || undefined,
    });
  };


  return (
    <Modal visible={visible} onClose={onClose} title="Add Student" maxHeight={700}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>Create a new student account for your child</Text>

        {maxStudents && (
          <View style={styles.limitInfo}>
            <Text style={styles.limitText}>
              Students: {currentStudentCount} / {maxStudents}
            </Text>
          </View>
        )}

        <View style={styles.formRow}>
          <View style={styles.formColumn}>
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
              label="School"
              placeholder="Enter school name"
              value={school}
              onChangeText={(text) => {
                setSchool(text);
                if (errors.school) setErrors({ ...errors, school: '' });
              }}
              error={errors.school}
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
              label="Emergency Contact Name"
              placeholder="Emergency contact name"
              value={emergencyContactName}
              onChangeText={(text) => {
                setEmergencyContactName(text);
                if (errors.emergency_contact_name) setErrors({ ...errors, emergency_contact_name: '' });
              }}
              error={errors.emergency_contact_name}
            />
          </View>

          <View style={styles.formColumn}>
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
              label="Grade"
              placeholder="e.g., Year 10"
              value={grade}
              onChangeText={(text) => {
                setGrade(text);
                if (errors.grade) setErrors({ ...errors, grade: '' });
              }}
              error={errors.grade}
            />
            <Input
              label="Phone"
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
        </View>

        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={() => {
              resetForm();
              onClose();
            }}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={createMutation.isPending ? 'Adding...' : 'Add Student'}
            onPress={handleSubmit}
            loading={createMutation.isPending}
            variant="primary"
            style={styles.submitButton}
            disabled={maxStudents ? currentStudentCount >= maxStudents : false}
          />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
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
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  limitText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.info,
    includeFontPadding: false,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  formColumn: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
