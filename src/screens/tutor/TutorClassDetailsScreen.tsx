/**
 * TutorClassDetailsScreen - MBEST Mobile App
 * Class details with students roster
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { TutorStackParamList } from '../../types/navigation';

type RoutePropType = RouteProp<TutorStackParamList, 'TutorClassDetails'>;

export const TutorClassDetailsScreen: React.FC = () => {
  const route = useRoute<RoutePropType>();
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const { classId } = route.params;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorClassDetails', classId],
    queryFn: () => tutorService.getClassDetails(classId),
    enabled: !!token && !!classId,
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Class Details" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Class Details" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading class details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const classData = data?.data;
  const students = classData?.students || [];

  return (
    <View style={styles.container}>
      <Header title={classData?.name || 'Class Details'} showBack />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Class Information */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="book" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Subject</Text>
              <Text style={styles.infoValue}>{classData?.subject}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="graduation-cap" size={20} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Year Level</Text>
              <Text style={styles.infoValue}>{classData?.year_level}</Text>
            </View>
          </View>
          {classData?.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{classData.description}</Text>
            </View>
          )}
        </Card>

        {/* Students Roster */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Students ({students.length})</Text>
          </View>
          {students.length > 0 ? (
            <FlatList
              data={students}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('TutorStudentDetails', { studentId: item.id })
                  }
                >
                  <Card style={styles.studentCard}>
                    <View style={styles.studentHeader}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{item.name}</Text>
                        <Text style={styles.studentEmail}>{item.email}</Text>
                      </View>
                      {item.grade_average !== undefined && (
                        <View style={styles.gradeBadge}>
                          <Text style={styles.gradeText}>{item.grade_average}%</Text>
                        </View>
                      )}
                      <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                    </View>
                  </Card>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Icon name="users" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyText}>No students enrolled</Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  descriptionContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  descriptionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  studentCard: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  studentEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  gradeBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
    includeFontPadding: false,
  },
});
