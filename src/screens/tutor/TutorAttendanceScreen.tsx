/**
 * TutorAttendanceScreen - MBEST Mobile App
 * View and track student attendance across all classes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tutorService, type AttendanceRecord } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

export const TutorAttendanceScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showStudentFilter, setShowStudentFilter] = useState(false);
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorAttendance'],
    queryFn: () => tutorService.getAttendanceRecords(),
    enabled: !!token,
  });

  // Fetch classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['tutorClasses'],
    queryFn: () => tutorService.getClasses(),
    enabled: !!token,
  });

  const handleExportRecords = () => {
    Alert.alert(
      'Export Records',
      'Attendance records will be exported to a CSV file.',
      [{ text: 'OK' }]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Attendance Records" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Attendance Records" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading attendance records</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Safely get records array
  const records = Array.isArray(data?.data) ? data.data : [];
  const classes = Array.isArray(classesData?.data) ? classesData.data : [];

  // Calculate summary statistics
  const totalRecords = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(1) : 0;

  // Get unique students
  const uniqueStudents = Array.from(
    new Set(records.map((r) => r.student_name))
  ).sort();

  // Filter records
  const filteredRecords = records.filter((record) => {
    // Search filter
    if (searchQuery) {
      const matchesSearch =
        record.student_name.toLowerCase().includes(searchQuery) ||
        (record.class_name && record.class_name.toLowerCase().includes(searchQuery));
      if (!matchesSearch) return false;
    }

    // Student filter
    if (selectedStudent !== 'all' && record.student_name !== selectedStudent) {
      return false;
    }

    // Class filter
    if (selectedClass !== 'all' && record.class_name !== selectedClass) {
      return false;
    }

    // Status filter
    if (selectedStatus !== 'all' && record.status !== selectedStatus) {
      return false;
    }

    // Date filters (simplified for now)
    // You can add proper date filtering here if needed

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return colors.success;
      case 'absent':
        return colors.error;
      case 'late':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'present':
        return colors.success + '15';
      case 'absent':
        return colors.error + '15';
      case 'late':
        return colors.warning + '15';
      default:
        return colors.borderLight;
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Attendance Records" showBack />

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.pageTitle}>Attendance Records</Text>
              <Text style={styles.pageSubtitle}>
                View and track student attendance across all your classes
              </Text>
            </View>
            <Button
              title="Export Records"
              onPress={handleExportRecords}
              variant="primary"
              size="small"
              style={styles.exportButton}
            />
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Records</Text>
            <Text style={styles.summaryValue}>{totalRecords}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: colors.success }]}>Present</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {presentCount}
            </Text>
            <Text style={styles.summarySubtext}>{attendanceRate}% attendance rate</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: colors.error }]}>Absent</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {absentCount}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={[styles.summaryLabel, { color: colors.warning }]}>Late</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {lateCount}
            </Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Filter Records</Text>
          <Text style={styles.filterSubtitle}>Search and filter attendance records</Text>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search student"
              value={searchInput}
              onChangeText={setSearchInput}
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Filter Dropdowns */}
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowStudentFilter(true)}
            >
              <Text style={styles.filterDropdownText}>
                {selectedStudent === 'all' ? 'All Students' : selectedStudent}
              </Text>
              <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowClassFilter(true)}
            >
              <Text style={styles.filterDropdownText}>
                {selectedClass === 'all' ? 'All Classes' : selectedClass}
              </Text>
              <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowStatusFilter(true)}
            >
              <Text style={styles.filterDropdownText}>
                {selectedStatus === 'all'
                  ? 'All Statuses'
                  : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </Text>
              <Icon name="chevron-down" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Clear Filters Button */}
            {(selectedStudent !== 'all' ||
              selectedClass !== 'all' ||
              selectedStatus !== 'all' ||
              searchInput) && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedStudent('all');
                  setSelectedClass('all');
                  setSelectedStatus('all');
                  setSearchInput('');
                }}
              >
                <Icon name="x" size={16} color={colors.textInverse} />
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Attendance History */}
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Attendance History</Text>
          <Text style={styles.historySubtitle}>
            Showing {filteredRecords.length} of {totalRecords} records
          </Text>

          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <View key={record.id} style={styles.recordCard}>
                {/* Card Header */}
                <View style={styles.recordHeader}>
                  <View style={styles.recordHeaderLeft}>
                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                    {record.class_name && (
                      <Text style={styles.recordClass}>{record.class_name}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackgroundColor(record.status) },
                    ]}
                  >
                    <Icon
                      name={
                        record.status === 'present'
                          ? 'check-circle'
                          : record.status === 'late'
                          ? 'clock'
                          : 'x-circle'
                      }
                      size={14}
                      color={getStatusColor(record.status)}
                    />
                    <Text
                      style={[styles.statusText, { color: getStatusColor(record.status) }]}
                    >
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Card Body */}
                <View style={styles.recordBody}>
                  <View style={styles.recordRow}>
                    <Icon name="user" size={16} color={colors.textSecondary} />
                    <Text style={styles.recordLabel}>Student Name:</Text>
                    <Text style={styles.recordValue}>{record.student_name}</Text>
                  </View>

                  {record.time && (
                    <View style={styles.recordRow}>
                      <Icon name="clock" size={16} color={colors.textSecondary} />
                      <Text style={styles.recordLabel}>Time:</Text>
                      <Text style={styles.recordValue}>{record.time}</Text>
                    </View>
                  )}

                  {record.notes && record.notes !== '-' && (
                    <View style={styles.recordRow}>
                      <Icon name="file-text" size={16} color={colors.textSecondary} />
                      <Text style={styles.recordLabel}>Notes:</Text>
                      <Text style={styles.recordValue}>{record.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {searchQuery || selectedStudent !== 'all' || selectedClass !== 'all'
                  ? 'No attendance records match your filters'
                  : 'No attendance records available'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Student Filter Modal */}
      <Modal
        visible={showStudentFilter}
        onClose={() => setShowStudentFilter(false)}
        title="Select Student"
      >
        <TouchableOpacity
          style={styles.modalOption}
          onPress={() => {
            setSelectedStudent('all');
            setShowStudentFilter(false);
          }}
        >
          <Text style={styles.modalOptionText}>All Students</Text>
          {selectedStudent === 'all' && (
            <Icon name="check" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        {uniqueStudents.map((student) => (
          <TouchableOpacity
            key={student}
            style={styles.modalOption}
            onPress={() => {
              setSelectedStudent(student);
              setShowStudentFilter(false);
            }}
          >
            <Text style={styles.modalOptionText}>{student}</Text>
            {selectedStudent === student && (
              <Icon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Class Filter Modal */}
      <Modal
        visible={showClassFilter}
        onClose={() => setShowClassFilter(false)}
        title="Select Class"
      >
        <TouchableOpacity
          style={styles.modalOption}
          onPress={() => {
            setSelectedClass('all');
            setShowClassFilter(false);
          }}
        >
          <Text style={styles.modalOptionText}>All Classes</Text>
          {selectedClass === 'all' && (
            <Icon name="check" size={20} color={colors.primary} />
          )}
        </TouchableOpacity>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls.id}
            style={styles.modalOption}
            onPress={() => {
              setSelectedClass(cls.name);
              setShowClassFilter(false);
            }}
          >
            <Text style={styles.modalOptionText}>{cls.name}</Text>
            {selectedClass === cls.name && (
              <Icon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Modal>

      {/* Status Filter Modal */}
      <Modal
        visible={showStatusFilter}
        onClose={() => setShowStatusFilter(false)}
        title="Select Status"
      >
        {['all', 'present', 'absent', 'late'].map((status) => (
          <TouchableOpacity
            key={status}
            style={styles.modalOption}
            onPress={() => {
              setSelectedStatus(status);
              setShowStatusFilter(false);
            }}
          >
            <Text style={styles.modalOptionText}>
              {status === 'all'
                ? 'All Statuses'
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            {selectedStatus === status && (
              <Icon name="check" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  exportButton: {
    minWidth: 120,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  summarySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  filterSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  filterSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    includeFontPadding: false,
    paddingVertical: spacing.xs,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  filterDropdown: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterDropdownText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    minWidth: 80,
    justifyContent: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  historySection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  historySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  recordCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  recordHeaderLeft: {
    flex: 1,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
    includeFontPadding: false,
  },
  recordClass: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
  recordBody: {
    gap: spacing.sm,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  recordLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  recordValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
    textAlign: 'center',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalOptionText: {
    fontSize: 15,
    color: colors.text,
    includeFontPadding: false,
  },
});
