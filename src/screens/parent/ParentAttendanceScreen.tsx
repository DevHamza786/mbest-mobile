/**
 * ParentAttendanceScreen - MBEST Mobile App
 * Attendance Tracking - Monitor student's class attendance in real-time
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { parentService } from '../../services/api/parent';
import { useAuthStore } from '../../store/authStore';
import { useParentStore } from '../../store/parentStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Icon } from '../../components/common/Icon';

const getChildName = (child: { name?: string; user?: { name?: string }; student?: { user?: { name?: string } } }) => {
  return child.name || child.user?.name || child.student?.user?.name || 'Student';
};

const formatDate = (date?: string) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(date);
  }
};

const formatTime = (t?: string) => (t ? String(t).substring(0, 5) : '');

const formatTimeRange = (start?: string, end?: string) => {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || '—';
};

const toAttendanceStatus = (r: any) => String(r?.attendance_status || r?.status || '').toLowerCase();

const statusColor = (statusLower: string) =>
  statusLower === 'present'
    ? colors.success
    : statusLower === 'absent'
      ? colors.error
      : statusLower.includes('late')
        ? colors.warning
        : colors.textSecondary;

export const ParentAttendanceScreen: React.FC = () => {
  const { token } = useAuthStore();
  const { selectedChildId, selectedChild, setSelectedChild } = useParentStore();
  const [viewMode, setViewMode] = useState<'history' | 'byClass'>('history');
  const [showChildModal, setShowChildModal] = useState(false);

  const { data: dashboardData } = useQuery({
    queryKey: ['parentDashboard'],
    queryFn: () => parentService.getDashboard(),
    enabled: !!token,
  });

  const dashboardRaw = (dashboardData?.data || dashboardData) as any;
  const children = dashboardRaw?.children || [];
  const activeChildFromApi = dashboardRaw?.active_child || children[0];
  const effectiveChildId = selectedChildId ?? activeChildFromApi?.id ?? children[0]?.id;
  useEffect(() => {
    if (activeChildFromApi && !selectedChildId) {
      setSelectedChild(activeChildFromApi);
    }
  }, [activeChildFromApi?.id, selectedChildId, setSelectedChild]);
  const activeChild = selectedChildId
    ? children.find((c: any) => c.id === selectedChildId) || selectedChild || activeChildFromApi
    : selectedChild || activeChildFromApi;

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['parentChildAttendance', effectiveChildId],
    queryFn: () => parentService.getChildAttendance(effectiveChildId!),
    enabled: !!token && !!effectiveChildId,
  });

  if (!effectiveChildId) {
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
        <Text style={styles.errorText}>Error loading attendance</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // API response shape:
  // { success: true, data: { current_page, data: [...] }, stats: {...} }
  const apiPayload: any = data as any;
  const responseData = apiPayload?.data;
  const attendanceRaw = Array.isArray(responseData)
    ? responseData
    : responseData?.data ?? responseData?.records ?? responseData?.attendance ?? [];
  const records: any[] = Array.isArray(attendanceRaw) ? attendanceRaw : [];

  const stats = apiPayload?.stats ?? responseData?.stats ?? responseData?.summary ?? {};
  const dashboardStats = dashboardRaw?.stats;
  const overallRate =
    stats.overall_rate ??
    stats.attendance_rate ??
    stats.rate ??
    dashboardStats?.attendance_rate ??
    0;
  const presentCount = stats.present ?? stats.present_count ?? records.filter((r: any) => toAttendanceStatus(r) === 'present').length;
  const absentCount = stats.absent ?? stats.absent_count ?? records.filter((r: any) => toAttendanceStatus(r) === 'absent').length;
  const lateCount = stats.late ?? stats.late_arrivals ?? stats.late_count ?? records.filter((r: any) => toAttendanceStatus(r).includes('late')).length;
  const totalSessions = stats.total_sessions ?? stats.total ?? records.length;

  const displayRecords =
    viewMode === 'byClass'
      ? [...records].sort((a, b) => {
          const clsA = a.class_model?.name || a.class_name || a.class?.name || a.class || '';
          const clsB = b.class_model?.name || b.class_name || b.class?.name || b.class || '';
          return clsA.localeCompare(clsB);
        })
      : records;

  const groupedByClass = (() => {
    const map = new Map<
      string,
      {
        className: string;
        items: any[];
        present: number;
        absent: number;
        late: number;
        total: number;
        rate: number;
      }
    >();
    for (const r of records) {
      const className = r.class_model?.name || r.class_name || r.class?.name || r.class || 'Class';
      const key = String(r.class_id || className);
      const entry =
        map.get(key) || ({ className, items: [], present: 0, absent: 0, late: 0, total: 0, rate: 0 } as any);
      entry.items.push(r);
      const st = toAttendanceStatus(r);
      entry.total += 1;
      if (st === 'present') entry.present += 1;
      else if (st === 'absent') entry.absent += 1;
      else if (st.includes('late')) entry.late += 1;
      map.set(key, entry);
    }
    for (const e of map.values()) {
      e.rate = e.total > 0 ? Math.round((e.present / e.total) * 100) : 0;
    }
    return Array.from(map.values()).sort((a, b) => b.rate - a.rate);
  })();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      showsVerticalScrollIndicator={false}
    >

      {/* Child selection modal */}
      {children.length > 1 && (
        <Modal visible={showChildModal} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => setShowChildModal(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Select Child</Text>
              {children.map((child: any) => {
                const isActive = activeChild?.id === child.id;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedChild(child);
                      setShowChildModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}
                      numberOfLines={1}
                    >
                      {getChildName(child)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowChildModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}

      {/* Summary Stats Cards */}
      <View style={styles.statsGrid}>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="trending-up" size={22} color={colors.textTertiary} />
          </View>
          <Text style={styles.statLabel}>Overall Rate</Text>
          <Text style={styles.statValue}>{overallRate}%</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, overallRate)}%` }]} />
          </View>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="check-circle" size={22} color={colors.success} />
          </View>
          <Text style={styles.statLabel}>Present</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>{presentCount}</Text>
          <Text style={styles.statSubtext}>Classes attended</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="alert-circle" size={22} color={colors.error} />
          </View>
          <Text style={styles.statLabel}>Absent</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>{absentCount}</Text>
          <Text style={styles.statSubtext}>Classes missed</Text>
        </Card>
        <Card variant="elevated" style={styles.statCard}>
          <View style={styles.statIconTop}>
            <Icon name="clock" size={22} color={colors.warning} />
          </View>
          <Text style={styles.statLabel}>Late Arrivals</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>{lateCount}</Text>
          <Text style={styles.statSubtext}>Times late</Text>
        </Card>
      </View>

      {/* Attendance Records Section */}
      <View style={styles.recordsSection}>
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'history' && styles.tabActive]}
            onPress={() => setViewMode('history')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, viewMode === 'history' && styles.tabTextActive]}>
              Attendance History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, viewMode === 'byClass' && styles.tabActive]}
            onPress={() => setViewMode('byClass')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, viewMode === 'byClass' && styles.tabTextActive]}>
              By Class
            </Text>
          </TouchableOpacity>
        </View>
        {viewMode === 'history' ? (
          <>
            <Text style={styles.sectionTitle}>Attendance Records</Text>
            <Text style={styles.sectionSubtitle}>
              Complete attendance history for {activeChild ? getChildName(activeChild) : 'student'} across all classes
            </Text>

            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colClass]}>Class</Text>
                <Text style={[styles.tableHeaderCell, styles.colDateTime]}>Date & Time</Text>
                <Text style={[styles.tableHeaderCell, styles.colMode]}>Mode</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                <Text style={[styles.tableHeaderCell, styles.colMarkedBy]}>Marked By</Text>
              </View>

              {/* Table Rows */}
              {displayRecords.length > 0 ? (
                displayRecords.map((item: any) => {
                  const stLower = toAttendanceStatus(item);
                  const st = item.attendance_status || item.status || '—';
                  const markedBy =
                    item.teacher?.user?.name ||
                    item.marked_by ||
                    item.tutor?.user?.name ||
                    item.instructor ||
                    '—';
                  const mode =
                    item.location_type === 'onsite'
                      ? 'offline'
                      : item.location_type === 'online'
                        ? 'online'
                        : item.mode || item.attendance_mode || '—';
                  return (
                    <View key={item.id || `${item.date}-${item.class_id}`} style={styles.tableRow}>
                      <Text style={[styles.tableCell, styles.colClass]} numberOfLines={1}>
                        {item.subject || item.class_model?.name || item.class_name || item.class?.name || '—'}
                      </Text>
                      <Text style={[styles.tableCell, styles.colDateTime]} numberOfLines={2}>
                        {formatDate(item.date)}{'\n'}{formatTimeRange(item.start_time, item.end_time)}
                      </Text>
                      <View style={styles.colMode}>
                        <View style={styles.modePill}>
                          <Text style={styles.modePillText}>{mode}</Text>
                        </View>
                      </View>
                      <View style={[styles.colStatus, styles.statusCell]}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor(stLower) }]}>
                          <Text style={styles.statusBadgeText}>{String(st).toLowerCase()}</Text>
                        </View>
                      </View>
                      <Text style={[styles.tableCell, styles.colMarkedBy]} numberOfLines={1}>
                        {markedBy}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.tableEmptyState}>
                  <Icon name="calendar" size={48} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                  <Text style={styles.emptyText}>No attendance records found</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View>
            {groupedByClass.length > 0 ? (
              groupedByClass.map((g) => (
                <Card key={g.className} variant="elevated" style={styles.byClassCard}>
                  <Text style={styles.byClassTitle}>{g.className}</Text>
                  <Text style={styles.byClassSubtitle}>
                    {g.total} total sessions • {g.rate}% attendance rate
                  </Text>
                  <View style={styles.bigProgressBg}>
                    <View style={[styles.bigProgressFill, { width: `${Math.min(100, g.rate)}%` }]} />
                  </View>
                  <View style={styles.byClassStatsRow}>
                    <View style={[styles.byClassStatBox, styles.presentBox]}>
                      <Text style={styles.byClassStatValue}>{g.present}</Text>
                      <Text style={styles.byClassStatLabel}>Present</Text>
                    </View>
                    <View style={[styles.byClassStatBox, styles.absentBox]}>
                      <Text style={styles.byClassStatValue}>{g.absent}</Text>
                      <Text style={styles.byClassStatLabel}>Absent</Text>
                    </View>
                    <View style={[styles.byClassStatBox, styles.lateBox]}>
                      <Text style={styles.byClassStatValue}>{g.late}</Text>
                      <Text style={styles.byClassStatLabel}>Late</Text>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card variant="outlined" style={styles.emptyCard}>
                <Icon name="calendar" size={48} color={colors.textTertiary} style={{ opacity: 0.5, marginBottom: spacing.md }} />
                <Text style={styles.emptyText}>No attendance records found</Text>
              </Card>
            )}
          </View>
        )}
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
    paddingBottom: spacing['3xl'],
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flex: 1,
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
  },
  studentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    maxWidth: 160,
  },
  studentInitials: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInitialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  studentName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
    ...shadows.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  modalOption: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  modalOptionActive: {
    backgroundColor: colors.primary,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  modalOptionTextActive: {
    color: colors.textInverse,
  },
  modalCancel: {
    padding: spacing.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '47%',
    padding: spacing.lg,
    minHeight: 110,
    ...shadows.md,
  },
  statIconTop: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  statSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  recordsSection: {
    marginTop: spacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  tabTextActive: {
    color: colors.textInverse,
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
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tableContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  tableEmptyState: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tableCell: {
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
  },
  colClass: { flex: 1.2, minWidth: 0 },
  colDateTime: { flex: 1.2, minWidth: 0 },
  colMode: { flex: 0.8, minWidth: 0 },
  colStatus: { flex: 0.9, minWidth: 0 },
  colMarkedBy: { flex: 1, minWidth: 0 },
  statusCell: {
    justifyContent: 'center',
  },
  modePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.info + '25',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.info,
    textTransform: 'lowercase',
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  byClassCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  byClassTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  byClassSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  bigProgressBg: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  bigProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  byClassStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  byClassStatBox: {
    flex: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  presentBox: {
    backgroundColor: colors.success + '1A',
  },
  absentBox: {
    backgroundColor: colors.error + '1A',
  },
  lateBox: {
    backgroundColor: colors.warning + '1A',
  },
  byClassStatValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    includeFontPadding: false,
  },
  byClassStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    includeFontPadding: false,
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
  },
  retryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
