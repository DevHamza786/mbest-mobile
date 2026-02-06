/**
 * TutorLessonRequestsScreen - MBEST Mobile App
 * Review and manage incoming lesson requests from families
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
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { tutorService, type LessonRequest } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/spacing';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import { Modal } from '../../components/common/Modal';

export const TutorLessonRequestsScreen: React.FC = () => {
  const { token } = useAuthStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LessonRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Debounced search - hits API 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.toLowerCase());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorLessonRequests'],
    queryFn: () => tutorService.getLessonRequests(),
    enabled: !!token,
  });

  const handleShowDetails = (request: LessonRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Lesson Requests" showBack />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Lesson Requests" showBack />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading lesson requests</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const requests = data?.data || [];
  
  // Filter requests based on search
  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      request.student_name.toLowerCase().includes(searchLower) ||
      request.parent_name.toLowerCase().includes(searchLower) ||
      request.lesson_type.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'declined':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'approved':
        return colors.success + '15';
      case 'pending':
        return colors.warning + '15';
      case 'declined':
        return colors.error + '15';
      default:
        return colors.borderLight;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatRequestedAt = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Lesson Requests" showBack />
      
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Lesson Requests</Text>
        <Text style={styles.pageSubtitle}>
          Review and manage incoming lesson requests from families
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search courses, assignments, or resources..."
          value={searchInput}
          onChangeText={setSearchInput}
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Incoming Requests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Incoming Requests</Text>
            <Text style={styles.sectionSubtitle}>
              Review details and respond to lesson requests
            </Text>
          </View>

          {/* Cards */}
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                {/* Header: Student Name and Status */}
                <View style={styles.cardHeader}>
                  <Text style={styles.studentName}>{request.student_name}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusBackgroundColor(request.status) },
                    ]}
                  >
                    <Icon
                      name={request.status === 'approved' ? 'check-circle' : 'clock'}
                      size={14}
                      color={getStatusColor(request.status)}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) },
                      ]}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Parent */}
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Parent:</Text>
                  <Text style={styles.cardValue}>{request.parent_name}</Text>
                </View>

                {/* Lesson Type */}
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Lesson Type:</Text>
                  <Text style={styles.cardValue}>{request.lesson_type}</Text>
                </View>

                {/* Preferred Date and Time */}
                <View style={styles.cardRowGroup}>
                  <View style={styles.cardRowHalf}>
                    <View style={styles.cardIconLabel}>
                      <Icon name="calendar" size={14} color={colors.textSecondary} />
                      <Text style={styles.cardLabel}>Preferred Date</Text>
                    </View>
                    <Text style={styles.cardValue}>
                      {formatDate(request.preferred_date)}
                    </Text>
                  </View>
                  <View style={styles.cardRowHalf}>
                    <View style={styles.cardIconLabel}>
                      <Icon name="clock" size={14} color={colors.textSecondary} />
                      <Text style={styles.cardLabel}>Time</Text>
                    </View>
                    <Text style={styles.cardValue}>{request.preferred_time}</Text>
                  </View>
                </View>

                {/* Duration */}
                <View style={styles.cardRow}>
                  <Text style={styles.cardLabel}>Duration:</Text>
                  <Text style={styles.cardValue}>{request.duration}</Text>
                </View>

                {/* Actions Button */}
                <TouchableOpacity
                  style={styles.detailsButtonFull}
                  onPress={() => handleShowDetails(request)}
                >
                  <Icon name="info" size={18} color={colors.text} />
                  <Text style={styles.detailsButtonTextFull}>Details</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No lesson requests match your search'
                  : 'No lesson requests available'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Details Modal */}
      {selectedRequest && (
        <Modal
          visible={showDetailsModal}
          onClose={handleCloseDetails}
          title="Lesson Request Details"
          subtitle="Review the complete information and respond to this request"
        >
          <View style={styles.detailsContent}>
            {/* Student Info */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Icon name="user" size={16} color={colors.text} />
                <Text style={styles.detailLabelText}>Student</Text>
              </View>
              <Text style={styles.detailValue}>{selectedRequest.student_name}</Text>
            </View>

            {/* Parent Info */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Icon name="user" size={16} color={colors.text} />
                <Text style={styles.detailLabelText}>Parent</Text>
              </View>
              <Text style={styles.detailValue}>{selectedRequest.parent_name}</Text>
            </View>

            {/* Lesson Type */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>Lesson Type</Text>
              </View>
              <Text style={styles.detailValue}>{selectedRequest.lesson_type}</Text>
            </View>

            {/* Date, Time, Duration Row */}
            <View style={styles.detailRowGroup}>
              <View style={styles.detailRowThird}>
                <View style={styles.detailLabel}>
                  <Icon name="calendar" size={16} color={colors.text} />
                  <Text style={styles.detailLabelText}>Preferred Date</Text>
                </View>
                <Text style={styles.detailValue}>
                  {formatDate(selectedRequest.preferred_date)}
                </Text>
              </View>

              <View style={styles.detailRowThird}>
                <View style={styles.detailLabel}>
                  <Icon name="clock" size={16} color={colors.text} />
                  <Text style={styles.detailLabelText}>Time</Text>
                </View>
                <Text style={styles.detailValue}>{selectedRequest.preferred_time}</Text>
              </View>

              <View style={styles.detailRowThird}>
                <View style={styles.detailLabel}>
                  <Text style={styles.detailLabelText}>Duration</Text>
                </View>
                <Text style={styles.detailValue}>{selectedRequest.duration}</Text>
              </View>
            </View>

            {/* Message from Parent */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>Message from Parent</Text>
              </View>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{selectedRequest.message}</Text>
              </View>
            </View>

            {/* Requested At */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>Requested At</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatRequestedAt(selectedRequest.requested_at)}
              </Text>
            </View>

            {/* Status */}
            <View style={styles.detailRow}>
              <View style={styles.detailLabel}>
                <Text style={styles.detailLabelText}>Status</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBackgroundColor(selectedRequest.status) },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(selectedRequest.status) },
                  ]}
                >
                  {selectedRequest.status.charAt(0).toUpperCase() +
                    selectedRequest.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 15,
    color: colors.text,
    includeFontPadding: false,
    paddingVertical: spacing.xs,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardRowGroup: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRowHalf: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
    marginTop: 2,
  },
  cardIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    includeFontPadding: false,
  },
  detailsButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  },
  detailsButtonTextFull: {
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
  detailsContent: {
    gap: spacing.md,
  },
  detailRow: {
    gap: spacing.xs,
  },
  detailRowGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  detailRowThird: {
    flex: 1,
    gap: spacing.xs,
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailLabelText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  detailValue: {
    fontSize: 15,
    color: colors.text,
    includeFontPadding: false,
  },
  messageBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    includeFontPadding: false,
  },
});
