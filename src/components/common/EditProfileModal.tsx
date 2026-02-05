/**
 * EditProfileModal - Modal for editing user profile
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { authService } from '../../services/api/auth';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
}) => {
  console.log('EditProfileModal render - visible:', visible);
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (visible && user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setErrors({});
    }
  }, [visible, user]);

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; phone?: string }) =>
      authService.updateProfile(data),
    onSuccess: (response) => {
      console.log('Profile update response:', response);
      const updatedUser = response?.data || response;
      if (updatedUser && typeof updatedUser === 'object') {
        // Merge with existing user data to preserve all fields
        setUser({ ...user, ...updatedUser });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        Alert.alert('Success', 'Profile updated successfully');
        onClose();
      } else {
        Alert.alert('Error', 'Invalid response from server');
      }
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.name?.[0] ||
        error.response?.data?.errors?.phone?.[0] ||
        error.message ||
        'Failed to update profile';
      Alert.alert('Error', msg);
    },
  });

  const validate = (): boolean => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      updateMutation.mutate({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Edit Profile" maxHeight={400}>
      <View style={styles.content}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
        />
        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (errors.phone) setErrors({ ...errors, phone: undefined });
          }}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title={updateMutation.isPending ? 'Saving...' : 'Save'}
            onPress={handleSave}
            loading={updateMutation.isPending}
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
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
});
