/**
 * AdminClassesScreen - MBEST Mobile App
 * Class management screen for admin
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
import { adminService, type Class } from '../../services/api/admin';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminClassesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['adminClasses'],
    queryFn: () => adminService.getClasses(),
    enabled: !!token,
  });

  const deleteClassMutation = useMutation({
    mutationFn: (id: number) => adminService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminClasses'] });
      Alert.alert('Success', 'Class deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete class');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading classes</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const classes = data?.data || [];
  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cls.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (cls: Class) => {
    Alert.alert(
      'Delete Class',
      `Are you sure you want to delete ${cls.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteClassMutation.mutate(cls.id),
        },
      ]
    );
  };

  const renderClass = ({ item }: { item: Class }) => (
    <Card style={styles.classCard}>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classSubject}>{item.subject}</Text>
        <View style={styles.classDetails}>
          <Text style={styles.classDetail}>Tutor: {item.tutor_name}</Text>
          <Text style={styles.classDetail}>Students: {item.student_count}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'active' && styles.statusBadgeActive]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
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
      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search classes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        renderItem={renderClass}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No classes found</Text>
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
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    padding: spacing.md,
  },
  classCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  classSubject: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  classDetails: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  classDetail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  statusBadgeActive: {
    backgroundColor: colors.success,
  },
  statusText: {
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

