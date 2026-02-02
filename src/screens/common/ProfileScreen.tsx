/**
 * ProfileScreen - MBEST Mobile App
 * User profile screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();

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
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>✓</Text>
          </View>
        </View>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={[
          styles.roleBadge,
          user?.role === 'admin' && styles.roleBadgeAdmin,
          user?.role === 'tutor' && styles.roleBadgeTutor,
          user?.role === 'student' && styles.roleBadgeStudent,
          user?.role === 'parent' && styles.roleBadgeParent,
        ]}>
          <Text style={styles.roleIcon}>
            {user?.role === 'admin' ? '👑' : user?.role === 'tutor' ? '👨‍🏫' : user?.role === 'student' ? '🎓' : '👨‍👩‍👧'}
          </Text>
          <Text style={styles.roleText}>{user?.role?.toUpperCase() || 'USER'}</Text>
        </View>
      </View>

      {/* Profile Information */}
      <Card variant="elevated" style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>👤</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>📧</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <Text style={styles.infoIcon}>🎭</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'N/A'}</Text>
            </View>
          </View>
          {user?.phone && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Text style={styles.infoIcon}>📱</Text>
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Edit Profile"
          onPress={() => {
            // TODO: Navigate to edit profile
            Alert.alert('Info', 'Edit profile functionality coming soon');
          }}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Change Password"
          onPress={() => {
            // TODO: Navigate to change password
            Alert.alert('Info', 'Change password functionality coming soon');
          }}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="secondary"
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  avatarText: {
    fontSize: 56,
    fontWeight: '800',
    color: colors.textInverse,
    letterSpacing: 2,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.md,
  },
  avatarBadgeText: {
    fontSize: 20,
    color: colors.textInverse,
  },
  userName: {
    ...textStyles.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.sm,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.primary,
  },
  roleBadgeTutor: {
    backgroundColor: colors.warning,
  },
  roleBadgeStudent: {
    backgroundColor: colors.success,
  },
  roleBadgeParent: {
    backgroundColor: colors.info,
  },
  roleIcon: {
    fontSize: 16,
  },
  roleText: {
    ...textStyles.button,
    color: colors.textInverse,
    fontSize: 12,
    letterSpacing: 1,
  },
  infoCard: {
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  infoValue: {
    ...textStyles.body,
    color: colors.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 64,
  },
  actions: {
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
});

