/**
 * AdminUsersScreen - MBEST Mobile App
 * User management screen for admin
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { adminService, type User } from '../../services/api/admin';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminUsersScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'tutor' | 'parent'>('all');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminService.getUsers(),
    enabled: !!token,
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      Alert.alert('Success', 'User deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading users</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const users = data?.data || [];
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteUserMutation.mutate(user.id),
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role.toUpperCase()}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.filters}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
        <View style={styles.roleFilters}>
          {(['all', 'student', 'tutor', 'parent'] as const).map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.roleFilterButton, roleFilter === role && styles.roleFilterButtonActive]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[styles.roleFilterText, roleFilter === role && styles.roleFilterTextActive]}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No users found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    marginBottom: spacing.md,
  },
  roleFilters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleFilterButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleFilterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleFilterText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  roleFilterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
});

