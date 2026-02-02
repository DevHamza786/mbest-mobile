/**
 * StudentClassDetailsScreen - MBEST Mobile App
 * Detailed view of a specific class
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { studentService, type ClassDetails } from '../../services/api/student';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { StudentStackParamList } from '../../types/navigation';

type ClassDetailsRouteProp = RouteProp<StudentStackParamList, 'ClassDetails'>;

export const StudentClassDetailsScreen: React.FC = () => {
  const route = useRoute<ClassDetailsRouteProp>();
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const insets = useSafeAreaInsets();
  const classId = route.params?.classId;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['studentClassDetails', classId],
    queryFn: () => studentService.getClassDetails(classId!),
    enabled: !!token && !!classId,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Header title="Class Details" showProfile={true} showBack={true} />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Error loading class details</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const classData: ClassDetails = data?.data || data;
  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  // Format dates
  const startDate = classData.start_date ? new Date(classData.start_date) : null;
  const endDate = classData.end_date ? new Date(classData.end_date) : null;
  const teacherName = classData.tutor?.user?.name || 'Tutor TBD';
  const tutorEmail = classData.tutor?.user?.email || '';
  const tutorPhone = classData.tutor?.user?.phone || '';
  const tutorBio = classData.tutor?.bio || '';
  const tutorQualifications = classData.tutor?.qualifications || '';
  const tutorDepartment = classData.tutor?.department || '';
  const tutorSpecialization = classData.tutor?.specialization || [];

  return (
    <View style={styles.container}>
      <Header title="Class Details" showProfile={true} showBack={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding }
        ]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Class Header Card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={[styles.classIconContainer, { backgroundColor: colors.primary }]}>
              <Icon name="book" size={32} color={colors.textInverse} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.className} numberOfLines={2}>
                {classData.name || 'Class'}
              </Text>
              <Text style={styles.classCode} numberOfLines={1}>
                {classData.code || ''}
              </Text>
              <Text style={styles.classSubject} numberOfLines={1}>
                {classData.category || ''} • {classData.level || ''}
              </Text>
            </View>
          </View>
          <View style={styles.headerStats}>
            <View style={styles.statItem}>
              <Icon name="users" size={16} color={colors.textInverse} />
              <Text style={styles.statText}>
                {classData.enrolled}/{classData.capacity} Students
              </Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="clock" size={16} color={colors.textInverse} />
              <Text style={styles.statText}>{classData.duration || ''}</Text>
            </View>
            {classData.credits && (
              <View style={styles.statItem}>
                <Icon name="award" size={16} color={colors.textInverse} />
                <Text style={styles.statText}>{classData.credits} Credits</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Class Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Information</Text>
          
          <Card variant="elevated" style={styles.infoCard}>
            {startDate && (
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>
                    {startDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            {endDate && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconContainer}>
                  <Icon name="calendar" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>End Date</Text>
                  <Text style={styles.infoValue}>
                    {endDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <View style={styles.infoIconContainer}>
                <Icon name="clock" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{classData.duration || 'N/A'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <View style={styles.infoIconContainer}>
                <Icon name="users" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Enrollment</Text>
                <Text style={styles.infoValue}>
                  {classData.enrolled} / {classData.capacity} students
                </Text>
              </View>
            </View>

            {classData.status && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoIconContainer}>
                  <Icon name="check-circle" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={[styles.infoValue, styles.statusText, classData.status === 'active' && styles.statusActive]}>
                    {classData.status.charAt(0).toUpperCase() + classData.status.slice(1)}
                  </Text>
                </View>
              </View>
            )}
          </Card>
        </View>

        {/* Tutor Information */}
        {classData.tutor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tutor Information</Text>
            <Card variant="elevated" style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Icon name="graduation-cap" size={20} color={colors.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{teacherName}</Text>
                </View>
              </View>

              {tutorDepartment && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="building" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>{tutorDepartment}</Text>
                  </View>
                </View>
              )}

              {tutorEmail && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="mail" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{tutorEmail}</Text>
                  </View>
                </View>
              )}

              {tutorPhone && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="phone" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{tutorPhone}</Text>
                  </View>
                </View>
              )}

              {tutorQualifications && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="award" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Qualifications</Text>
                    <Text style={styles.infoValue}>{tutorQualifications}</Text>
                  </View>
                </View>
              )}

              {tutorSpecialization.length > 0 && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoIconContainer}>
                    <Icon name="target" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Specialization</Text>
                    <View style={styles.tagsContainer}>
                      {tutorSpecialization.map((spec, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{spec}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {tutorBio && (
                <View style={[styles.infoRow, styles.infoRowBorder]}>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Bio</Text>
                    <Text style={styles.bioText}>{tutorBio}</Text>
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* Class Schedules */}
        {classData.schedules && classData.schedules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Class Schedule</Text>
            {classData.schedules.map((schedule, index) => (
              <Card key={schedule.id} variant="elevated" style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <View style={styles.scheduleDayContainer}>
                    <Icon name="calendar" size={18} color={colors.primary} />
                    <Text style={styles.scheduleDay}>{schedule.day_of_week}</Text>
                  </View>
                  <View style={styles.scheduleTimeContainer}>
                    <Icon name="clock" size={16} color={colors.textSecondary} />
                    <Text style={styles.scheduleTime}>
                      {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                    </Text>
                  </View>
                </View>
                {(schedule.room || schedule.meeting_link) && (
                  <View style={styles.scheduleDetails}>
                    {schedule.room && (
                      <View style={styles.scheduleDetailItem}>
                        <Icon name="building" size={14} color={colors.textSecondary} />
                        <Text style={styles.scheduleDetailText}>{schedule.room}</Text>
                      </View>
                    )}
                    {schedule.meeting_link && (
                      <View style={styles.scheduleDetailItem}>
                        <Icon name="link" size={14} color={colors.primary} />
                        <Text style={[styles.scheduleDetailText, styles.linkText]} numberOfLines={1}>
                          {schedule.meeting_link}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Card>
            ))}
          </View>
        )}

        {/* Assignments */}
        {classData.assignments && classData.assignments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assignments ({classData.assignments.length})</Text>
            {classData.assignments.slice(0, 5).map((assignment) => {
              const dueDate = new Date(assignment.due_date);
              const isPublished = assignment.status === 'published';
              return (
                <Card key={assignment.id} variant="elevated" style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <View style={styles.assignmentIconContainer}>
                      <Icon name="file-text" size={20} color={isPublished ? colors.primary : colors.textTertiary} />
                    </View>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentTitle} numberOfLines={2}>
                        {assignment.title}
                      </Text>
                      <View style={styles.assignmentMeta}>
                        <View style={styles.assignmentBadge}>
                          <Icon name="calendar" size={12} color={colors.textSecondary} />
                          <Text style={styles.assignmentDate}>
                            Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, isPublished ? styles.statusBadgeActive : styles.statusBadgeDraft]}>
                          <Text style={styles.statusBadgeText}>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {assignment.description && (
                    <Text style={styles.assignmentDescription} numberOfLines={2}>
                      {assignment.description}
                    </Text>
                  )}
                  <View style={styles.assignmentFooter}>
                    <View style={styles.assignmentPoints}>
                      <Icon name="star" size={14} color={colors.warning} />
                      <Text style={styles.pointsText}>{assignment.max_points} points</Text>
                    </View>
                    {assignment.allowed_file_types && assignment.allowed_file_types.length > 0 && (
                      <View style={styles.fileTypesContainer}>
                        {assignment.allowed_file_types.slice(0, 3).map((type, idx) => (
                          <View key={idx} style={styles.fileTypeTag}>
                            <Text style={styles.fileTypeText}>{type.toUpperCase()}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
            {classData.assignments.length > 5 && (
              <Text style={styles.moreText}>+ {classData.assignments.length - 5} more assignments</Text>
            )}
          </View>
        )}

        {/* Resources & Materials */}
        {(classData.resources && classData.resources.length > 0) || (classData.materials && classData.materials.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resources & Materials</Text>
            {classData.resources && classData.resources.map((resource) => (
              <Card key={resource.id} variant="elevated" style={styles.resourceCard}>
                <View style={styles.resourceHeader}>
                  <View style={styles.resourceIconContainer}>
                    <Icon 
                      name={resource.type === 'link' ? 'link' : resource.type === 'pdf' ? 'file-text' : resource.type === 'video' ? 'play-circle' : 'file-text'} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle} numberOfLines={2}>
                      {resource.title}
                    </Text>
                    <View style={styles.resourceMeta}>
                      <Text style={styles.resourceCategory}>{resource.category}</Text>
                      {resource.downloads !== undefined && (
                        <View style={styles.downloadsContainer}>
                          <Icon name="download" size={12} color={colors.textSecondary} />
                          <Text style={styles.resourceDownloads}>{resource.downloads}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                {resource.description && (
                  <Text style={styles.resourceDescription} numberOfLines={2}>
                    {resource.description}
                  </Text>
                )}
              </Card>
            ))}
          </View>
        ) : null}

        {/* Description */}
        {classData.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Card variant="elevated" style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>
                {classData.description}
              </Text>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  headerCard: {
    marginBottom: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classIconContainer: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
    ...shadows.md,
  },
  headerInfo: {
    flex: 1,
  },
  className: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textInverse,
    marginBottom: spacing.xs,
    lineHeight: 32,
    includeFontPadding: false,
  },
  classCode: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textInverse,
    opacity: 0.85,
    lineHeight: 20,
    includeFontPadding: false,
    marginBottom: spacing.xs / 2,
  },
  classSubject: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textInverse,
    opacity: 0.9,
    lineHeight: 22,
    includeFontPadding: false,
  },
  headerStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textInverse,
    opacity: 0.9,
    lineHeight: 18,
    includeFontPadding: false,
  },
  section: {
    marginBottom: spacing.xl,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    lineHeight: 28,
    includeFontPadding: false,
  },
  infoCard: {
    padding: spacing.lg,
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 16,
    includeFontPadding: false,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
    includeFontPadding: false,
  },
  descriptionCard: {
    padding: spacing.lg,
    width: '100%',
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
    includeFontPadding: false,
  },
  scheduleCard: {
    padding: spacing.lg,
    width: '100%',
  },
  scheduleText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 24,
    includeFontPadding: false,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.error,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 22,
  },
  statusText: {
    textTransform: 'capitalize',
  },
  statusActive: {
    color: colors.success,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  tag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    includeFontPadding: false,
    lineHeight: 16,
  },
  bioText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
    includeFontPadding: false,
    fontStyle: 'italic',
  },
  scheduleCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  scheduleDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  scheduleDay: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    lineHeight: 22,
  },
  scheduleTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
    lineHeight: 20,
  },
  scheduleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  scheduleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  scheduleDetailText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
    includeFontPadding: false,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  assignmentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  assignmentHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  assignmentIconContainer: {
    marginRight: spacing.sm,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 22,
    includeFontPadding: false,
  },
  assignmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  assignmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  assignmentDate: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.md,
  },
  statusBadgeActive: {
    backgroundColor: colors.successLight + '30',
  },
  statusBadgeDraft: {
    backgroundColor: colors.textTertiary + '30',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    lineHeight: 14,
    textTransform: 'capitalize',
  },
  assignmentDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
    marginBottom: spacing.sm,
  },
  assignmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  assignmentPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    lineHeight: 18,
  },
  fileTypesContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  fileTypeTag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.sm,
  },
  fileTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
    lineHeight: 14,
  },
  moreText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
    includeFontPadding: false,
    lineHeight: 20,
  },
  resourceCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    width: '100%',
  },
  resourceHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  resourceIconContainer: {
    marginRight: spacing.sm,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 22,
    includeFontPadding: false,
  },
  resourceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
    lineHeight: 16,
  },
  downloadsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs / 2,
  },
  resourceDownloads: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
    lineHeight: 16,
  },
  resourceDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
    includeFontPadding: false,
    marginTop: spacing.xs,
  },
});

