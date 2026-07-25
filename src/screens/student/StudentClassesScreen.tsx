/**
 * StudentClassesScreen - MBEST Mobile App
 * Classes list for student
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { studentService } from '../../services/api/student';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';

import { Modal as RNModal, TouchableWithoutFeedback } from 'react-native';
import { Input } from '../../components/common/Input';

export const StudentClassesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [classCode, setClassCode] = React.useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['studentClasses'],
    queryFn: () => studentService.getClasses(),
    enabled: !!token,
  });

  const enrollMutation = useMutation({
    mutationFn: (id: number) => studentService.enrollInClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentClasses'] });
      Alert.alert('Success', 'Enrolled in class successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to enroll');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => studentService.joinClassByCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentClasses'] });
      setShowJoinModal(false);
      setClassCode('');
      Alert.alert('Success', 'Joined class successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to join class. Please check the code.');
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Error loading classes</Text>
          <Button title="Retry" onPress={() => refetch()} variant="primary" style={styles.retryButton} />
        </View>
      </View>
    );
  }

  // Handle nested API response structures (data.data.data for paginated responses)
  const rawClasses = (data as any)?.data?.data || (data as any)?.data || (Array.isArray(data) ? data : []) || [];
  const classes = Array.isArray(rawClasses) ? rawClasses : [];

  return (
    <View style={styles.container}>
      <Header title="Classes" showProfile={true} />
      <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button
          title="+ Join Class with Code"
          onPress={() => setShowJoinModal(true)}
          variant="outline"
          size="small"
        />
      </View>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={[
          styles.listContent,
          classes.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card variant="elevated" style={styles.classCard}>
            <View style={styles.classCardHeader}>
              <View style={styles.classIconContainer}>
                <Icon name="book" size={28} color={colors.textInverse} />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className} numberOfLines={1}>
                  {item.name || 'Unnamed Class'}
                </Text>
                <Text style={styles.classSubject} numberOfLines={1}>
                  {item.category || item.subject || 'General'}
                </Text>
                {item.level && (
                  <Text style={styles.classLevel} numberOfLines={1}>
                    {item.level} • {item.code || ''}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.classDetails}>
              <View style={styles.detailRow}>
                <Icon name="user" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.tutor?.user?.name || item.tutor_name || 'Tutor TBD'}
                </Text>
              </View>
              {(item.start_date || item.schedule || item.schedules?.length > 0) && (
                <View style={styles.detailRow}>
                  <Icon name="calendar" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.schedules?.length > 0 
                      ? `${item.schedules.map((s: any) => s.day_of_week).join(', ')} (${item.schedules[0].start_time} - ${item.schedules[0].end_time})`
                      : item.start_date 
                      ? new Date(item.start_date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : item.schedule || 'Schedule TBD'}
                  </Text>
                </View>
              )}
              {item.enrolled && item.capacity && (
                <View style={styles.detailRow}>
                  <Icon name="users" size={16} color={colors.textSecondary} style={styles.detailIcon} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.enrolled}/{item.capacity} enrolled
                  </Text>
                </View>
              )}
            </View>

            <Button
              title="Enrolled"
              onPress={() => {}}
              disabled
              variant="secondary"
              size="medium"
              style={styles.enrollButton}
            />
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="book" size={72} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Classes Available</Text>
            <Text style={styles.emptyText}>
              There are no enrolled classes at the moment.{'\n'}
              Use "+ Join Class with Code" above to join a class.
            </Text>
          </View>
        }
      />

      <RNModal visible={showJoinModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View style={{ width: '100%', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: spacing.sm, color: colors.textPrimary }}>Join a Class</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md }}>Enter your class code or ID to enroll.</Text>
            
            <Input
              label="Class Code / ID"
              placeholder="e.g. MATH101 or 12"
              value={classCode}
              onChangeText={setClassCode}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md }}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setShowJoinModal(false)}
              />
              <Button
                title="Join Class"
                loading={joinMutation.isPending}
                onPress={() => joinMutation.mutate(classCode.trim())}
                disabled={!classCode.trim()}
              />
            </View>
          </View>
        </View>
      </RNModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  classCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  classIconContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    ...shadows.sm,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    ...textStyles.h4,
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  classSubject: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
    marginBottom: spacing.xs,
  },
  classLevel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    lineHeight: 16,
    includeFontPadding: false,
  },
  classDetails: {
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailIcon: {
    marginRight: spacing.sm,
  },
  detailText: {
    ...textStyles.body,
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  enrollButton: {
    marginTop: spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  errorText: {
    ...textStyles.h4,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.xl,
    includeFontPadding: false,
  },
  retryButton: {
    minWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptyText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    includeFontPadding: false,
  },
});

