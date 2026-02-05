/**
 * ProfileScreen - MBEST Mobile App
 * Modern profile screen matching app theme (Green header, Blue banner)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { EditProfileModal } from '../../components/common/EditProfileModal';
import { ChangePasswordModal } from '../../components/common/ChangePasswordModal';

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  React.useEffect(() => {
    console.log('ProfileScreen - showEditModal changed:', showEditModal);
  }, [showEditModal]);

  React.useEffect(() => {
    console.log('ProfileScreen - showChangePasswordModal changed:', showChangePasswordModal);
  }, [showChangePasswordModal]);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin':
        return colors.primary;
      case 'tutor':
        return colors.warning;
      case 'student':
        return colors.success;
      case 'parent':
        return colors.info;
      default:
        return colors.secondary;
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'admin':
        return 'crown';
      case 'tutor':
        return 'graduation-cap';
      case 'student':
        return 'book';
      case 'parent':
        return 'users';
      default:
        return 'user';
    }
  };

  return (
    <View style={styles.container}>
      {/* Green Header Bar */}
      <View style={[styles.headerBar, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Icon name="arrow-left" size={24} color={colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Blue User Information Banner */}
        <View style={styles.userBanner}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            <View style={styles.editAvatarBadge}>
              <Icon name="edit" size={12} color={colors.textInverse} />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.roleBadge}>
            <Icon name={getRoleIcon()} size={14} color={colors.info} />
            <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>

        {/* White Card with Action Buttons */}
        <View style={styles.actionCard}>
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Edit Profile button clicked');
                console.log('Current showEditModal:', showEditModal);
                setShowEditModal(true);
                console.log('After setShowEditModal(true)');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: hexToRgba(colors.primaryLight, 0.2) }]}>
                <Icon name="edit" size={28} color={colors.primary} />
              </View>
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Change Password button clicked');
                console.log('Current showChangePasswordModal:', showChangePasswordModal);
                setShowChangePasswordModal(true);
                console.log('After setShowChangePasswordModal(true)');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: hexToRgba(colors.warningLight, 0.2) }]}>
                <Icon name="lock" size={28} color={colors.warning} />
              </View>
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBox, { backgroundColor: hexToRgba(colors.errorLight, 0.2) }]}>
                <Icon name="log-out" size={28} color={colors.error} />
              </View>
              <Text style={styles.actionButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Information Section */}
          <View style={styles.profileInfoSection}>
            <View style={styles.sectionHeader}>
              <Icon name="user" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.infoIcon, { backgroundColor: hexToRgba(colors.primaryLight, 0.2) }]}>
                <Icon name="user" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: hexToRgba(colors.info, 0.2) }]}>
                <Icon name="mail" size={18} color={colors.info} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.infoIcon, { backgroundColor: hexToRgba(colors.success, 0.2) }]}>
                <Icon name="phone" size={18} color={colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Not set'}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: hexToRgba(getRoleColor(), 0.2) }]}>
                <Icon name={getRoleIcon()} size={18} color={getRoleColor()} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={showEditModal}
        onClose={() => {
          console.log('EditProfileModal onClose called');
          setShowEditModal(false);
        }}
      />
      <ChangePasswordModal
        visible={showChangePasswordModal}
        onClose={() => {
          console.log('ChangePasswordModal onClose called');
          setShowChangePasswordModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  headerBar: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing['3xl'],
  },
  userBanner: {
    backgroundColor: colors.info,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadows.xl,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    includeFontPadding: false,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
    ...shadows.md,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textInverse,
    opacity: 0.95,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.info + '40',
    ...shadows.sm,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.info,
    letterSpacing: 1,
    includeFontPadding: false,
  },
  actionCard: {
    backgroundColor: colors.surface,
    marginTop: -spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconBox: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    includeFontPadding: false,
  },
  profileInfoSection: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs / 2,
    includeFontPadding: false,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
});
