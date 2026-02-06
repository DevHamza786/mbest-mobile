/**
 * TutorStudentsScreen - MBEST Mobile App
 * My Students page with summary cards, filters, and student list
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  FlatList,
  Modal as RNModal,
  Alert,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { tutorService } from '../../services/api/tutor';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/spacing';
import { Card } from '../../components/common/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Header } from '../../components/common/Header';
import { Icon } from '../../components/common/Icon';
import type { TutorStackParamList } from '../../types/navigation';
import type { Student } from '../../services/api/tutor';

type NavigationPropType = NavigationProp<TutorStackParamList>;

interface SummaryCardProps {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, color = colors.text, icon }) => (
  <Card style={styles.summaryCard}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <View style={styles.summaryValueContainer}>
      {icon && <Icon name={icon as any} size={20} color={color} style={styles.summaryIcon} />}
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  </Card>
);

export const TutorStudentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);

  // Debounced search - hits API 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch students
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorStudents', searchQuery],
    queryFn: () => tutorService.getStudents({ search: searchQuery }),
    enabled: !!token,
  });

  // Fetch classes for filter
  const { data: classesData } = useQuery({
    queryKey: ['tutorClasses'],
    queryFn: () => tutorService.getClasses(),
    enabled: !!token,
  });

  // Fetch student details for progress/assignments
  const { data: studentDetailsData } = useQuery({
    queryKey: ['tutorStudentDetails', selectedStudent?.id],
    queryFn: () => tutorService.getStudentDetails(selectedStudent!.id),
    enabled: !!selectedStudent && (showProgressModal || showAssignmentsModal),
  });

  // Fetch student grades for progress
  const { data: studentGradesData } = useQuery({
    queryKey: ['tutorStudentGrades', selectedStudent?.id],
    queryFn: () => tutorService.getStudentGrades(selectedStudent!.id),
    enabled: !!selectedStudent && showProgressModal,
  });

  // Fetch student assignments
  const { data: studentAssignmentsData } = useQuery({
    queryKey: ['tutorStudentAssignments', selectedStudent?.id],
    queryFn: () => tutorService.getStudentAssignments(selectedStudent!.id),
    enabled: !!selectedStudent && showAssignmentsModal,
  });

  // Handle paginated API response structure
  const studentsRaw = data?.data?.data || data?.data || data || [];
  const students: Student[] = Array.isArray(studentsRaw) ? studentsRaw : [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter((s) => {
      // Check multiple possible fields for active status
      return !!(s.user?.email_verified_at || s.user?.is_active);
    }).length;
    
    // Calculate average grade
    const grades = students
      .map((s) => {
        const grade = s.overall_grade || s.grade_average;
        if (typeof grade === 'string') {
          const num = parseFloat(grade);
          return isNaN(num) ? null : num;
        }
        return grade || null;
      })
      .filter((g): g is number => g !== null);
    const averageGrade = grades.length > 0 
      ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 100) / 100
      : 0;

    // Need attention: students with low grades or overdue assignments
    const needAttention = students.filter((s) => {
      const grade = s.overall_grade || s.grade_average;
      let gradeNum: number | null = null;
      if (typeof grade === 'string') {
        gradeNum = parseFloat(grade);
        if (isNaN(gradeNum)) gradeNum = null;
      } else {
        gradeNum = grade || null;
      }
      return gradeNum !== null && gradeNum < 70;
    }).length;

    return {
      total: totalStudents,
      active: activeStudents,
      needAttention,
      averageGrade: averageGrade.toFixed(0),
    };
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by class
    if (selectedClassFilter !== 'all') {
      const classId = parseInt(selectedClassFilter);
      filtered = filtered.filter((s) => {
        // Handle both string and number IDs
        const studentClassId = typeof s.class_id === 'string' ? parseInt(s.class_id) : s.class_id;
        if (studentClassId === classId) return true;
        if (s.classes?.some((c) => {
          const cId = typeof c.id === 'string' ? parseInt(c.id) : c.id;
          return cId === classId;
        })) return true;
        return false;
      });
    }

    // Filter by status - check both email_verified_at and is_active fields
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter((s) => {
        // Check multiple possible fields for active status
        const isActive = !!(s.user?.email_verified_at || s.user?.is_active);
        return selectedStatusFilter === 'active' ? isActive : !isActive;
      });
    }

    return filtered;
  }, [students, selectedClassFilter, selectedStatusFilter]);

  // Handle paginated API response for classes
  const classesRaw = classesData?.data?.data || classesData?.data || [];
  const classes = Array.isArray(classesRaw) ? classesRaw : [];

  const handleActionsPress = (student: Student) => {
    setSelectedStudent(student);
    setShowActionsMenu(true);
  };

  const handleViewProgress = () => {
    setShowActionsMenu(false);
    setShowProgressModal(true);
  };

  const handleViewAssignments = () => {
    setShowActionsMenu(false);
    setShowAssignmentsModal(true);
  };

  const getStudentName = (student: Student) => {
    return student.user?.name || student.name || 'Unknown Student';
  };

  const getStudentEmail = (student: Student) => {
    return student.user?.email || student.email || '';
  };

  const getStudentPhone = (student: Student) => {
    return student.user?.phone || student.phone || '';
  };

  const getStudentGrade = (student: Student) => {
    const grade = student.overall_grade || student.grade_average;
    if (typeof grade === 'string') {
      const num = parseFloat(grade);
      return isNaN(num) ? null : num;
    }
    return grade || null;
  };

  const getInitials = (name: string) => {
    const parts = name.split(/[\s,]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="My Students" showProfile />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="My Students" showProfile />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading students</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="My Students" showProfile />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setShowClassFilter(false);
          setShowStatusFilter(false);
        }}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>Monitor student progress and manage your class roster</Text>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <SummaryCard label="Total Students" value={summaryStats.total} />
          <SummaryCard label="Active Students" value={summaryStats.active} color={colors.success} />
          <SummaryCard label="Need Attention" value={summaryStats.needAttention} color={colors.warning} />
          <SummaryCard label="Average Grade" value={`${summaryStats.averageGrade}%`} color={colors.warning} />
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students by name, email, or ID..."
              value={searchInput}
              onChangeText={setSearchInput}
              placeholderTextColor={colors.textTertiary}
            />
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={() => setSearchInput('')}>
                <Icon name="x" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setShowClassFilter(!showClassFilter);
                  setShowStatusFilter(false);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {selectedClassFilter === 'all' ? 'All Classes' : classes.find((c) => c.id.toString() === selectedClassFilter)?.name || 'All Classes'}
                </Text>
                <Icon name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showClassFilter && (
                <ScrollView
                  style={styles.filterDropdown}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedClassFilter('all');
                      setShowClassFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>All Classes</Text>
                  </TouchableOpacity>
                  {classes.map((classItem) => (
                    <TouchableOpacity
                      key={classItem.id}
                      style={styles.filterDropdownItem}
                      onPress={() => {
                        setSelectedClassFilter(classItem.id.toString());
                        setShowClassFilter(false);
                      }}
                    >
                      <Text style={styles.filterDropdownText}>{classItem.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {
                  setShowStatusFilter(!showStatusFilter);
                  setShowClassFilter(false);
                }}
              >
                <Text style={styles.filterButtonText}>
                  {selectedStatusFilter === 'all' ? 'All Status' : selectedStatusFilter === 'active' ? 'Active' : 'Inactive'}
                </Text>
                <Icon name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showStatusFilter && (
                <View style={styles.filterDropdown}>
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedStatusFilter('all');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>All Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedStatusFilter('active');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>Active</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedStatusFilter('inactive');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>Inactive</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Students List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Assigned Students ({filteredStudents.length})</Text>
          <Text style={styles.listSubtitle}>
            Manage your class roster. Showing {filteredStudents.length} of {students.length} students.
          </Text>
        </View>

        {/* Students List - Mobile-friendly card layout */}
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => {
            const name = getStudentName(student);
            const email = getStudentEmail(student);
            const phone = getStudentPhone(student);
            const grade = getStudentGrade(student);
            // Check multiple possible fields for active status - must match filter logic
            const isActive = !!(student.user?.email_verified_at || student.user?.is_active);
            const initials = getInitials(name);

            return (
              <Card key={student.id} style={styles.studentCard}>
                <View style={styles.studentCardHeader}>
                  <View style={styles.studentCardLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{name}</Text>
                      {student.enrollment_id && (
                        <Text style={styles.enrollmentId}>{student.enrollment_id}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleActionsPress(student)}
                    style={styles.actionsButton}
                  >
                    <Icon name="more-vertical" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.studentCardDetails}>
                  <View style={styles.detailRow}>
                    <Icon name="mail" size={14} color={colors.textSecondary} />
                    <Text style={styles.detailText} numberOfLines={1}>{email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={14} color={colors.textSecondary} />
                    <Text style={styles.detailText}>{phone || 'Not provided'}</Text>
                  </View>
                  {student.emergency_contact_phone && (
                    <View style={styles.detailRow}>
                      <Icon name="phone" size={14} color={colors.textSecondary} />
                      <Text style={styles.detailText}>{student.emergency_contact_phone}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>Child</Text>
                    </View>
                    <View style={[styles.statusBadge, isActive && styles.statusBadgeActive]}>
                      <Text style={[styles.statusBadgeText, isActive && styles.statusBadgeTextActive]}>
                        {isActive ? 'active' : 'inactive'}
                      </Text>
                    </View>
                    {grade !== null && (
                      <Text style={[styles.gradeText, grade < 70 && styles.gradeTextLow]}>
                        {grade}%
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="users" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        )}
      </ScrollView>

      {/* Actions Menu Modal */}
      <RNModal
        visible={showActionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsMenu(false)}
        >
          <View style={styles.actionsMenu}>
            <Text style={styles.actionsMenuTitle}>Actions</Text>
            <TouchableOpacity style={styles.actionsMenuItemPrimary} onPress={handleViewProgress}>
              <Icon name="trending-up" size={18} color={colors.textInverse} />
              <Text style={styles.actionsMenuItemTextPrimary}>View Progress</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionsMenuItem} onPress={handleViewAssignments}>
              <Icon name="file-text" size={18} color={colors.text} />
              <Text style={styles.actionsMenuItemText}>View Assignments</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </RNModal>

      {/* Progress Report Modal */}
      {selectedStudent && (
        <ProgressReportModal
          visible={showProgressModal}
          onClose={() => {
            setShowProgressModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          grades={studentGradesData?.data?.data || studentGradesData?.data || []}
          stats={studentGradesData?.data?.stats || studentGradesData?.stats}
        />
      )}

      {/* Assignments Modal */}
      {selectedStudent && (
        <StudentAssignmentsModal
          visible={showAssignmentsModal}
          onClose={() => {
            setShowAssignmentsModal(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          assignments={studentAssignmentsData?.data?.data || studentAssignmentsData?.data || []}
        />
      )}

    </View>
  );
};

// Progress Report Modal Component
interface ProgressReportModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student;
  stats?: {
    average_grade: string | number;
    total_grades: number;
    highest_grade: string | number;
    lowest_grade: string | number;
  };
  grades: Array<{
    id: number;
    assessment?: string;
    assignment_title?: string;
    grade?: number;
    max_grade?: number;
    percentage?: number;
    date?: string;
    created_at?: string;
    subject?: string;
    category?: string;
    class_model?: {
      id: number;
      name: string;
      code?: string;
    };
    assignment?: {
      id: number;
      title: string;
    };
  }>;
}

const ProgressReportModal: React.FC<ProgressReportModalProps> = ({ visible, onClose, student, grades, stats }) => {
  const name = student.user?.name || student.name || 'Unknown Student';

  // Simple parser for grade values (converts strings to rounded numbers)
  const parseGrade = (value: any): number => {
    if (typeof value === 'number') return Math.round(value);
    if (typeof value === 'string') return Math.round(parseFloat(value) || 0);
    return 0;
  };

  // Use stats from API directly
  const averageGrade = stats ? parseGrade(stats.average_grade) : 0;
  const totalGrades = stats ? stats.total_grades : grades.length;
  const highestGrade = stats ? parseGrade(stats.highest_grade) : 0;
  const lowestGrade = stats ? parseGrade(stats.lowest_grade) : 0;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.progressModal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Text style={styles.modalTitle}>Progress Report - {name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Summary Cards */}
            <View style={styles.progressSummaryContainer}>
              <View style={styles.progressCard}>
                <Icon name="graduation-cap" size={24} color={colors.warning} />
                <Text style={styles.progressCardLabel}>Average Grade</Text>
                <Text style={[styles.progressCardValue, { color: colors.warning }]}>
                  {averageGrade}%
                </Text>
              </View>
              <View style={styles.progressCard}>
                <Icon name="trending-up" size={24} color={colors.text} />
                <Text style={styles.progressCardLabel}>Total Grades</Text>
                <Text style={styles.progressCardValue}>{totalGrades}</Text>
              </View>
              <View style={styles.progressCard}>
                <Icon name="trending-up" size={24} color={colors.success} />
                <Text style={styles.progressCardLabel}>Highest Grade</Text>
                <Text style={[styles.progressCardValue, { color: colors.success }]}>
                  {highestGrade}%
                </Text>
              </View>
              <View style={styles.progressCard}>
                <Icon name="alert-circle" size={24} color={colors.error} />
                <Text style={styles.progressCardLabel}>Lowest Grade</Text>
                <Text style={[styles.progressCardValue, { color: colors.error }]}>
                  {lowestGrade}%
                </Text>
              </View>
            </View>

            {/* Grade History */}
            <Text style={styles.sectionTitle}>Grade History</Text>
            <View style={styles.gradeHistoryTable}>
              <View style={styles.gradeHistoryHeader}>
                <Text style={[styles.gradeHistoryHeaderText, { flex: 2 }]}>Assignment</Text>
                <Text style={[styles.gradeHistoryHeaderText, { flex: 1 }]}>Subject</Text>
                <Text style={[styles.gradeHistoryHeaderText, { flex: 0.8, textAlign: 'center' }]}>Grade</Text>
                <Text style={[styles.gradeHistoryHeaderText, { flex: 1, textAlign: 'right' }]}>Date</Text>
              </View>
              {grades.length > 0 ? (
                grades.map((grade) => {
                  
                  const assignmentName = grade.assessment || grade.assignment_title || grade.assignment?.title || 'Assignment';
                  const subject = grade.subject || grade.category || 'General';
                  const dateStr = grade.date || grade.created_at || '';
                  
                  return (
                    <View key={grade.id} style={styles.gradeHistoryRow}>
                      <Text style={[styles.gradeHistoryCell, { flex: 2 }]} numberOfLines={2}>{assignmentName}</Text>
                      <Text style={[styles.gradeHistoryCell, { flex: 1 }]} numberOfLines={1}>{subject}</Text>
                      <View style={{ flex: 0.8, alignItems: 'center' }}>
                        <View style={styles.gradeBadgeSmall}>
                          <Text style={styles.gradeBadgeText}>{grade.grade}</Text>
                        </View>
                      </View>
                      <Text style={[styles.gradeHistoryCell, { flex: 1, textAlign: 'right' }]}>
                        {dateStr ? new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyGrades}>
                  <Text style={styles.emptyGradesText}>No grades available</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
};

// Student Assignments Modal Component
interface StudentAssignmentsModalProps {
  visible: boolean;
  onClose: () => void;
  student: Student;
  assignments: Array<{
    id: number;
    title: string;
    due_date: string;
    status: string;
    submission_id?: number;
    class_name?: string;
    class_model?: { name: string };
    submission?: {
      id: number;
      status: string;
      grade?: string | number;
      feedback?: string;
      submitted_at?: string;
    };
  }>;
}

const StudentAssignmentsModal: React.FC<StudentAssignmentsModalProps> = ({
  visible,
  onClose,
  student,
  assignments,
}) => {
  const name = student.user?.name || student.name || 'Unknown Student';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.assignmentsModal}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <Icon name="file-text" size={20} color={colors.text} />
              <Text style={styles.modalTitle}>Assignments - {name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalContent} 
            contentContainerStyle={styles.assignmentsScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.assignmentsTitle}>All Assignments ({assignments.length})</Text>

            {assignments.length > 0 ? (
              assignments.map((assignment) => {
                const overdue = isOverdue(assignment.due_date) && !assignment.submission;
                const className = assignment.class_name || assignment.class_model?.name || '-';
                
                // Determine display status
                let displayStatus = assignment.status || 'pending';
                let statusColor = colors.textSecondary;
                let statusBgColor = colors.background;
                
                if (assignment.submission) {
                  displayStatus = assignment.submission.status;
                  if (displayStatus === 'graded') {
                    statusColor = colors.success;
                    statusBgColor = colors.success + '20';
                  } else if (displayStatus === 'submitted') {
                    statusColor = colors.primary;
                    statusBgColor = colors.primary + '20';
                  }
                } else if (overdue) {
                  displayStatus = 'overdue';
                  statusColor = colors.error;
                  statusBgColor = colors.error + '20';
                }
                
                // Get grade from submission
                const grade = assignment.submission?.grade 
                  ? `${Math.round(parseFloat(String(assignment.submission.grade)))}%`
                  : 'N/A';

                return (
                  <View key={assignment.id} style={styles.assignmentCard}>
                    <Text style={styles.assignmentTitle} numberOfLines={2}>
                      {assignment.title}
                    </Text>
                    <View style={styles.assignmentSingleRow}>
                      <View style={styles.assignmentDateContainer}>
                        <Icon name="calendar" size={14} color={colors.textSecondary} />
                        <Text style={styles.assignmentDate}>{formatDate(assignment.due_date)}</Text>
                      </View>
                      <View style={styles.assignmentStatusContainer}>
                        <Text style={styles.assignmentLabel}>Status:</Text>
                        <View style={[styles.statusBadgeAssignment, { backgroundColor: statusBgColor }]}>
                          <Text style={[styles.statusBadgeAssignmentText, { color: statusColor }]}>
                            {displayStatus}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.assignmentGradeContainer}>
                        <Text style={styles.assignmentLabel}>Grade:</Text>
                        <Text style={[styles.assignmentGrade, grade !== 'N/A' && { fontWeight: '700', color: colors.text }]}>
                          {grade}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="file-text" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyText}>No assignments found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </RNModal>
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
  scrollContent: {
    padding: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  summaryIcon: {
    marginRight: spacing.xs,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    includeFontPadding: false,
  },
  filtersContainer: {
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.md,
    zIndex: 100,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  filterButtonText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: spacing.xs,
    includeFontPadding: false,
  },
  filterButtonContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 100,
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 200,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterDropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterDropdownText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  listHeader: {
    marginBottom: spacing.md,
    zIndex: -1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  listSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  studentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  studentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  studentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  studentCardDetails: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    includeFontPadding: false,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs / 2,
    includeFontPadding: false,
  },
  enrollmentId: {
    fontSize: 11,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  typeBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadge: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: spacing.xs,
  },
  statusBadgeActive: {
    backgroundColor: colors.success + '20',
    borderColor: colors.success,
  },
  statusBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadgeTextActive: {
    color: colors.success,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  gradeTextLow: {
    color: colors.warning,
  },
  actionsButton: {
    padding: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.md,
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
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    minWidth: 200,
    maxWidth: '80%',
    alignSelf: 'center',
    ...shadows.lg,
  },
  actionsMenuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  actionsMenuItemPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  actionsMenuItemTextPrimary: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
  },
  actionsMenuItemText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  actionsMenuItemTextDanger: {
    fontSize: 14,
    color: colors.error,
    includeFontPadding: false,
  },
  // Progress Modal
  progressModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  closeButton: {
    padding: spacing.xs,
  },
  modalContent: {
    padding: spacing.md,
  },
  progressSummaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  progressCard: {
    width: '48%',
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  progressCardLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    includeFontPadding: false,
  },
  progressCardValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
    includeFontPadding: false,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  gradeHistoryTable: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  gradeHistoryHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  gradeHistoryHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  gradeHistoryRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    alignItems: 'center',
  },
  gradeHistoryCell: {
    fontSize: 13,
    color: colors.text,
    includeFontPadding: false,
  },
  gradeBadgeSmall: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  gradeBadgeText: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '700',
    includeFontPadding: false,
  },
  emptyGrades: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyGradesText: {
    fontSize: 14,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  // Assignments Modal
  assignmentsModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '90%',
    maxHeight: '80%',
    ...shadows.xl,
  },
  assignmentsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  assignmentsScrollContent: {
    paddingBottom: spacing.xl,
  },
  assignmentCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  assignmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    includeFontPadding: false,
  },
  assignmentSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  assignmentDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  assignmentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignmentGradeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  assignmentLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  assignmentValue: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    includeFontPadding: false,
  },
  assignmentDate: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  assignmentGrade: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  statusBadgeAssignment: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeAssignmentText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
    includeFontPadding: false,
  },
  statusBadgeOverdue: {
    backgroundColor: colors.error + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeOverdueText: {
    fontSize: 11,
    color: colors.error,
    fontWeight: '600',
    includeFontPadding: false,
  },
});
