/**
 * ParentClassesScreen - MBEST Mobile App
 * Matches web app Classes design with class details modal
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { parentService, type Class } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';

const getChildName = (child: { name?: string; user?: { name?: string }; student?: { user?: { name?: string } } } | null) => {
  if (!child) return 'your child';
  return child.name || child.user?.name || child.student?.user?.name || 'Student';
};

const formatScheduleTime = (time: string) => time?.substring(0, 5) || '';

const formatScheduleLine = (sched: { day_of_week: string; start_time: string; end_time: string }) =>
  `${sched.day_of_week}: ${formatScheduleTime(sched.start_time)}-${formatScheduleTime(sched.end_time)}`;

export const ParentClassesScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChildId, selectedChild } = useParentStore();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['parentChildClasses', selectedChildId],
    queryFn: () => parentService.getChildClasses(selectedChildId!),
    enabled: !!token && !!selectedChildId,
  });

  const responseData = data?.data;
  const classes: Class[] = Array.isArray(responseData)
    ? responseData
    : Array.isArray((responseData as any)?.data)
      ? (responseData as any).data
      : [];

  const { data: classDetailsData, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['parentClassDetails', selectedChildId, selectedClassId],
    queryFn: () => parentService.getClassDetails(selectedChildId!, selectedClassId!),
    enabled: !!token && !!selectedChildId && !!selectedClassId && showDetailsModal,
  });

  const classDetails = classDetailsData?.data || (classDetailsData as any)?.data;
  const selectedClass: Class | null = classDetails
    ? (classDetails as Class)
    : classes.find((c) => c.id === selectedClassId) || null;

  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.tutor?.user?.name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
    );
  }, [classes, searchQuery]);

  const totalClasses = classes.length;
  const activeClasses = classes.filter((c) => c.status === 'active').length;

  if (!selectedChildId) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyText}>Please select a child on the Dashboard first</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error loading classes</Text>
      </View>
    );
  }

  const bottomPadding = Math.max(insets.bottom, 60) + spacing.lg;

  const openClassDetails = (cls: Class) => {
    setSelectedClassId(cls.id);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedClassId(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >

      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryIconRight}>
            <Icon name="book" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.summaryValue}>{totalClasses}</Text>
          <Text style={styles.summarySubtext}>Enrolled this semester</Text>
          <Text style={styles.summaryLabel}>Total Classes</Text>
        </Card>
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryIconRight}>
            <Icon name="calendar" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.summaryValue}>{activeClasses}</Text>
          <Text style={styles.summarySubtext}>Currently ongoing</Text>
          <Text style={styles.summaryLabel}>Active Classes</Text>
        </Card>
        <Card variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryIconRight}>
            <Icon name="eye" size={24} color={colors.textTertiary} />
          </View>
          <Text style={styles.summaryValue}>0</Text>
          <Text style={styles.summarySubtext}>Classes in session</Text>
          <Text style={styles.summaryLabel}>Live Now</Text>
        </Card>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Icon name="search" size={18} color={colors.textTertiary} />
          <TextInput
            style={styles.searchTextInput}
            placeholder="Search classes or tutors..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Class Cards */}
      <View style={styles.classesGrid}>
        {filteredClasses.map((cls) => (
          <Card key={cls.id} variant="elevated" style={styles.classCard}>
            <View style={styles.classCardHeader}>
              <View style={styles.classIconSmall}>
                <Icon name="book" size={20} color={colors.secondary} />
              </View>
              <View style={styles.classCardTitleRow}>
                <Text style={styles.classCardName} numberOfLines={1}>
                  {cls.name}
                </Text>
                <View style={[styles.statusBadge, cls.status === 'active' && styles.statusBadgeActive]}>
                  <Text style={styles.statusBadgeText}>{cls.status || 'active'}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.classTutor}>
              with {cls.tutor?.user?.name || cls.tutor_name || 'Tutor'}
            </Text>
            {cls.schedules?.map((sched, i) => (
              <View key={i} style={styles.scheduleRow}>
                <Icon name="clock" size={12} color={colors.textSecondary} />
                <Text style={styles.scheduleText}>{formatScheduleLine(sched)}</Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => openClassDetails(cls)}
              activeOpacity={0.7}
            >
              <Icon name="eye" size={16} color={colors.textInverse} />
              <Text style={styles.viewDetailsButtonText}>View Class Details</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {filteredClasses.length === 0 && (
        <Card variant="outlined" style={styles.emptyCard}>
          <Text style={styles.emptyText}>No classes found</Text>
        </Card>
      )}

      {/* Class Details Modal */}
      <Modal visible={showDetailsModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={closeDetailsModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {isLoadingDetails ? (
              <LoadingSpinner />
            ) : selectedClass ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} numberOfLines={1}>
                    {selectedClass.name}
                  </Text>
                  <TouchableOpacity onPress={closeDetailsModal} style={styles.closeButton}>
                    <Icon name="x" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={[styles.statusBadge, styles.statusBadgeModal, selectedClass.status === 'active' && styles.statusBadgeActive]}>
                  <Text style={styles.statusBadgeText}>{selectedClass.status || 'active'}</Text>
                </View>
                <Text style={styles.modalSubtitle}>
                  Class details and information for {selectedClass.name}
                </Text>

                <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                  {/* Instructor */}
                  <Card variant="outlined" style={styles.detailCard}>
                    <Icon name="user" size={20} color={colors.primary} />
                    <View style={styles.detailCardContent}>
                      <Text style={styles.detailLabel}>Instructor</Text>
                      <Text style={styles.detailValue}>
                        {selectedClass.tutor?.user?.name || selectedClass.tutor_name || 'Tutor'}
                      </Text>
                    </View>
                  </Card>

                  {/* Schedule */}
                  <Card variant="outlined" style={styles.detailCard}>
                    <Icon name="clock" size={20} color={colors.primary} />
                    <View style={styles.detailCardContent}>
                      <Text style={styles.detailLabel}>Schedule</Text>
                      {selectedClass.schedules?.map((s, i) => (
                        <Text key={i} style={styles.detailValue}>
                          {formatScheduleLine(s)}
                        </Text>
                      ))}
                      <Text style={styles.detailSubtext}>
                        Duration: {selectedClass.duration || 'N/A'}
                      </Text>
                    </View>
                  </Card>

                  {/* Enrollment */}
                  <Card variant="outlined" style={styles.detailCard}>
                    <Icon name="users" size={20} color={colors.primary} />
                    <View style={styles.detailCardContent}>
                      <Text style={styles.detailLabel}>Enrollment</Text>
                      <Text style={styles.detailValue}>
                        {selectedClass.enrolled || 0} / {selectedClass.capacity || 0} Students enrolled
                      </Text>
                    </View>
                  </Card>

                  {/* Course Description */}
                  <Card variant="outlined" style={styles.detailCard}>
                    <Icon name="graduation-cap" size={20} color={colors.primary} />
                    <View style={styles.detailCardContent}>
                      <Text style={styles.detailLabel}>Course Description</Text>
                      <Text style={styles.detailValue}>
                        {selectedClass.description || 'No description available'}
                      </Text>
                    </View>
                  </Card>

                  {/* Course Materials */}
                  <View style={styles.materialsSection}>
                    <View style={styles.materialsHeader}>
                      <Icon name="file-text" size={20} color={colors.primary} />
                      <Text style={styles.materialsTitle}>Course Materials</Text>
                    </View>
                    {(selectedClass.materials?.length || selectedClass.resources?.length) ? (
                      (selectedClass.materials || selectedClass.resources || []).map((material: any) => {
                        const type = (material.type || 'document').toUpperCase();
                        const isVideo = type === 'VIDEO';
                        const isLink = type === 'LINK';
                        return (
                          <TouchableOpacity
                            key={material.id}
                            style={styles.materialItem}
                            activeOpacity={0.7}
                          >
                            <Icon
                              name={isVideo ? 'play-circle' : isLink ? 'link' : 'file-text'}
                              size={22}
                              color={colors.textSecondary}
                            />
                            <Text style={styles.materialTitle} numberOfLines={2}>
                              {material.title || 'Untitled'}
                            </Text>
                            <View style={styles.materialBadge}>
                              <Text style={styles.materialBadgeText}>{type}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <Text style={styles.noMaterialsText}>No course materials available</Text>
                    )}
                  </View>

                  {/* Contact Instructor */}
                  <TouchableOpacity style={styles.contactButton} activeOpacity={0.7}>
                    <Icon name="message-circle" size={20} color={colors.textInverse} />
                    <Text style={styles.contactButtonText}>Contact Instructor</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <View style={styles.modalError}>
                <Text style={styles.errorText}>Unable to load class details</Text>
                <TouchableOpacity onPress={closeDetailsModal} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
    flexGrow: 1,
  },
  headerSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
    marginBottom: spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.md,
    minHeight: 100,
  },
  summaryIconRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  summarySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: spacing.xs,
    includeFontPadding: false,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    includeFontPadding: false,
  },
  classesGrid: {
    gap: spacing.md,
  },
  classCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  classIconSmall: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  classCardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  classCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.textTertiary,
  },
  statusBadgeActive: {
    backgroundColor: colors.secondary,
  },
  statusBadgeModal: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  classTutor: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  scheduleText: {
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  viewOnlyText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing['3xl'] * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 24,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginVertical: spacing.lg,
    includeFontPadding: false,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  modalScroll: {
    maxHeight: 400,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  detailCardContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  detailSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  materialsSection: {
    marginBottom: spacing.lg,
  },
  materialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  materialsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  materialTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    includeFontPadding: false,
  },
  materialBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
  },
  materialBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  noMaterialsText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
    includeFontPadding: false,
  },
  parentAccessWarning: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  warningText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  modalError: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
});
