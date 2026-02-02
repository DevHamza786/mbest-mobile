/**
 * Header Component - Reusable header for all screens
 * Responsive for Android and iOS
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../types/navigation';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { useAuthStore } from '../../store/authStore';
import { Icon } from './Icon';

interface HeaderProps {
  title: string;
  showProfile?: boolean;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  onRightActionPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showProfile = true,
  showBack = false,
  rightAction,
  onRightActionPress,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const handleProfilePress = () => {
    // Get root navigator to navigate to Profile screen
    const rootNavigation = navigation.getParent() || navigation;
    (rootNavigation as NavigationProp<RootStackParamList>).navigate('Profile');
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBackPress}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={24} color={colors.textInverse} />
            </TouchableOpacity>
          )}
          <Text style={[styles.title, showBack && styles.titleWithBack]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        <View style={styles.rightSection}>
          {rightAction && (
            <TouchableOpacity
              onPress={onRightActionPress}
              style={styles.rightActionButton}
              activeOpacity={0.7}
            >
              {rightAction}
            </TouchableOpacity>
          )}
          {showProfile && (
            <TouchableOpacity
              onPress={handleProfilePress}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              {user?.name?.charAt(0) ? (
                <Text style={styles.profileText}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              ) : (
                <Icon name="user" size={18} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    ...shadows.md,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textInverse,
    letterSpacing: 0.5,
    flex: 1,
    includeFontPadding: false,
    lineHeight: 28,
  },
  titleWithBack: {
    marginLeft: 0,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rightActionButton: {
    padding: spacing.xs,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
    lineHeight: 20,
  },
});

