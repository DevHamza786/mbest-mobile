/**
 * ChangePasswordModal - Modal for changing user password
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { authService } from '../../services/api/auth';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }>({});

  const changePasswordMutation = useMutation({
    mutationFn: (data: {
      current_password: string;
      password: string;
      password_confirmation: string;
    }) => authService.changePassword(data),
    onSuccess: () => {
      Alert.alert('Success', 'Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
      onClose();
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.current_password?.[0] ||
        error.response?.data?.errors?.password?.[0] ||
        error.message ||
        'Failed to change password';
      Alert.alert('Error', msg);
    },
  });

  const validate = (): boolean => {
    const newErrors: {
      current_password?: string;
      password?: string;
      password_confirmation?: string;
    } = {};

    if (!currentPassword) {
      newErrors.current_password = 'Current password is required';
    }
    if (!newPassword) {
      newErrors.password = 'New password is required';
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (newPassword !== confirmPassword) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    if (currentPassword === newPassword) {
      newErrors.password = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = () => {
    if (validate()) {
      changePasswordMutation.mutate({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Change Password" maxHeight={450}>
      <View style={styles.content}>
        <Input
          label="Current Password"
          placeholder="Enter your current password"
          value={currentPassword}
          onChangeText={(text) => {
            setCurrentPassword(text);
            if (errors.current_password) setErrors({ ...errors, current_password: undefined });
          }}
          secureTextEntry
          error={errors.current_password}
        />
        <Input
          label="New Password"
          placeholder="Enter your new password"
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errors.password) setErrors({ ...errors, password: undefined });
          }}
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirm New Password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.password_confirmation) setErrors({ ...errors, password_confirmation: undefined });
          }}
          secureTextEntry
          error={errors.password_confirmation}
        />
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={changePasswordMutation.isPending ? 'Changing...' : 'Update'}
            onPress={handleChangePassword}
            loading={changePasswordMutation.isPending}
            variant="primary"
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
