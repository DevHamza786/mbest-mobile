/**
 * ProfileHeaderButton - Profile button for top header (used in Tutor/Parent navigators)
 * Matches the Student header's profile button style
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { borderRadius } from '../../constants/spacing';
import { Icon } from './Icon';

export const ProfileHeaderButton: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const handlePress = () => {
    // Navigate to root Profile - go up to find RootStack (handles nested navigators)
    let nav: any = navigation;
    while (nav?.getParent?.()) {
      nav = nav.getParent();
    }
    (nav as NavigationProp<RootStackParamList>).navigate('Profile');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={styles.button}
      activeOpacity={0.7}
    >
      {user?.name?.charAt(0) ? (
        <Text style={styles.text}>{user.name.charAt(0).toUpperCase()}</Text>
      ) : (
        <Icon name="user" size={18} color={colors.textInverse} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
    lineHeight: 20,
  },
});
