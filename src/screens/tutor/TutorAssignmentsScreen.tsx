/**
 * TutorAssignmentsScreen - MBEST Mobile App
 * Assignments management with create functionality
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal as RNModal,
  Alert,
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
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import type { TutorStackParamList } from '../../types/navigation';
import type { Assignment } from '../../services/api/tutor';

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

export const TutorAssignmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationPropType>();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'grading'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch assignments
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['tutorAssignments', searchQuery],
    queryFn: () => tutorService.getAssignments({ search: searchQuery } as any),
    enabled: !!token,
  });

  // Fetch classes for dropdown
  const { data: classesData } = useQuery({
    queryKey: ['tutorClasses'],
    queryFn: () => tutorService.getClasses(),
    enabled: !!token,
  });

  const assignmentsRaw = data?.data?.data || data?.data || data || [];
  const assignments: Assignment[] = Array.isArray(assignmentsRaw) ? assignmentsRaw : [];

  const classesRaw = classesData?.data?.data || classesData?.data || [];
  const classes = Array.isArray(classesRaw) ? classesRaw : [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status?.toLowerCase() === 'published').length;
    const drafts = assignments.filter((a) => a.status?.toLowerCase() === 'draft').length;
    
    // Pending grading: assignments with submissions that need grading
    const pendingGrading = assignments.reduce((count, a) => {
      const submitted = parseInt(String(a.submitted_count || a.submissions_count || 0));
      const total = parseInt(String(a.total_students || a.total_submissions || 0));
      return count + (submitted > 0 ? submitted : 0);
    }, 0);

    return { total, published, drafts, pendingGrading };
  }, [assignments]);

  // Filter assignments
  const filteredAssignments = useMemo(() => {
    let filtered = assignments;

    // Filter by tab
    if (selectedTab === 'grading') {
      filtered = filtered.filter((a) => {
        const submitted = parseInt(String(a.submitted_count || a.submissions_count || 0));
        return submitted > 0;
      });
    }

    // Filter by class
    if (selectedClassFilter !== 'all') {
      const classId = parseInt(selectedClassFilter);
      filtered = filtered.filter((a) => {
        const aClassId = typeof a.class_id === 'string' ? parseInt(a.class_id) : a.class_id;
        return aClassId === classId;
      });
    }

    // Filter by status
    if (selectedStatusFilter !== 'all') {
      filtered = filtered.filter((a) => a.status?.toLowerCase() === selectedStatusFilter);
    }

    return filtered;
  }, [assignments, selectedTab, selectedClassFilter, selectedStatusFilter]);

  const handleCreateAssignment = () => {
    setSelectedAssignment(null);
    setShowCreateModal(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowCreateModal(true);
    setActiveMenuId(null);
  };

  const toggleMenu = (assignmentId: number) => {
    setActiveMenuId(activeMenuId === assignmentId ? null : assignmentId);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Header title="Assignments" showProfile />
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header title="Assignments" showProfile />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading assignments</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Assignments"
        showProfile
        rightAction={
          <TouchableOpacity onPress={handleCreateAssignment} style={styles.createButton} activeOpacity={0.7}>
            <Icon name="plus" size={16} color={colors.textInverse} />
            <Text style={styles.createButtonText}>Create Assignment</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => {
          setShowClassFilter(false);
          setShowStatusFilter(false);
          setActiveMenuId(null);
        }}
      >
        {/* Subtitle */}
        <Text style={styles.subtitle}>Create, manage, and grade assignments for your classes</Text>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <SummaryCard label="Total Assignments" value={summaryStats.total} icon="file-text" />
          <SummaryCard label="Published" value={summaryStats.published} color={colors.success} icon="check-circle" />
          <SummaryCard label="Drafts" value={summaryStats.drafts} color={colors.warning} icon="edit" />
          <SummaryCard label="Pending Grading" value={summaryStats.pendingGrading} color={colors.primary} icon="clock" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All Assignments
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'grading' && styles.tabActive]}
            onPress={() => setSelectedTab('grading')}
          >
            <Text style={[styles.tabText, selectedTab === 'grading' && styles.tabTextActive]}>
              Need Grading
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search assignments..."
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
                  {selectedStatusFilter === 'all' ? 'All Status' : selectedStatusFilter.charAt(0).toUpperCase() + selectedStatusFilter.slice(1)}
                </Text>
                <Icon name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              {showStatusFilter && (
                <ScrollView
                  style={styles.filterDropdown}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={false}
                >
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
                      setSelectedStatusFilter('published');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>Published</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedStatusFilter('draft');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>Draft</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterDropdownItem}
                    onPress={() => {
                      setSelectedStatusFilter('archived');
                      setShowStatusFilter(false);
                    }}
                  >
                    <Text style={styles.filterDropdownText}>Archived</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </View>

        {/* Assignments List */}
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => {
            const className = assignment.class_name || assignment.class_model?.name || assignment.class || 'Unknown Class';
            const submittedCount = parseInt(String(assignment.submitted_count || assignment.submissions_count || 0));
            const totalStudents = parseInt(String(assignment.total_students || assignment.total_submissions || 0));
            const maxPoints = assignment.max_points || 100;
            const statusColor = assignment.status === 'published' ? colors.success : assignment.status === 'draft' ? colors.warning : colors.textSecondary;
            const statusBg = assignment.status === 'published' ? colors.success + '20' : assignment.status === 'draft' ? colors.warning + '20' : colors.background;
            const canEdit = assignment.status?.toLowerCase() === 'draft' || assignment.status?.toLowerCase() === 'archived';
            const isMenuOpen = activeMenuId === assignment.id;

            return (
              <Card key={assignment.id} style={styles.assignmentCard}>
                <View style={styles.assignmentHeader}>
                  <View style={styles.assignmentTitleContainer}>
                    <Text style={styles.assignmentTitle} numberOfLines={2}>
                      {assignment.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {assignment.status || 'draft'}
                      </Text>
                    </View>
                  </View>
                  {canEdit && (
                    <View>
                      <TouchableOpacity 
                        style={styles.moreButton}
                        onPress={() => toggleMenu(assignment.id)}
                      >
                        <Icon name="more-vertical" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                      {isMenuOpen && (
                        <View style={styles.actionMenu}>
                          <TouchableOpacity
                            style={styles.actionMenuItem}
                            onPress={() => handleEditAssignment(assignment)}
                          >
                            <Icon name="edit" size={16} color={colors.text} />
                            <Text style={styles.actionMenuText}>Edit</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {assignment.description && (
                  <Text style={styles.assignmentDescription} numberOfLines={2}>
                    {assignment.description}
                  </Text>
                )}

                <View style={styles.assignmentMeta}>
                  <View style={styles.metaItem}>
                    <Icon name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>
                      Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="users" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{submittedCount}/{totalStudents} submitted</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="award" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{maxPoints} points</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="book" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText} numberOfLines={1}>{className}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewSubmissionsButton}
                  onPress={() => navigation.navigate('TutorAssignmentDetails', { assignmentId: assignment.id })}
                >
                  <Icon name="eye" size={16} color={colors.text} />
                  <Text style={styles.viewSubmissionsText}>View Submissions ({submittedCount})</Text>
                </TouchableOpacity>
              </Card>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="file-text" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyText}>No assignments found</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          visible={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          classes={classes}
        />
      )}
    </View>
  );
};

// Create Assignment Modal Component
interface CreateAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  classes: Array<{ id: number; name: string; subject?: string }>;
}

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  visible,
  onClose,
  assignment,
  classes,
}) => {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxPoints, setMaxPoints] = useState('100');
  const [submissionType, setSubmissionType] = useState('file');
  const [status, setStatus] = useState('draft');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSubmissionTypeDropdown, setShowSubmissionTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title || '');
      setSelectedClass(assignment.class_id?.toString() || '');
      setDescription(assignment.description || '');
      setInstructions(assignment.instructions || '');
      setDueDate(assignment.due_date || '');
      setMaxPoints(assignment.max_points?.toString() || '100');
      setSubmissionType(assignment.submission_type || 'file');
      setStatus(assignment.status || 'draft');
    } else {
      resetForm();
    }
  }, [assignment]);

  const resetForm = () => {
    setTitle('');
    setSelectedClass('');
    setDescription('');
    setInstructions('');
    setDueDate('');
    setMaxPoints('100');
    setSubmissionType('file');
    setStatus('draft');
    setErrors({});
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      assignment 
        ? tutorService.updateAssignment(assignment.id, data)
        : tutorService.createAssignment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutorAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['tutorDashboard'] });
      Alert.alert('Success', assignment ? 'Assignment updated successfully' : 'Assignment created successfully');
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save assignment');
    },
  });

  const validate = (): boolean => {
    const newErrors: any = {};

    if (!title.trim()) newErrors.title = 'Title is required';
    if (!selectedClass) newErrors.class = 'Class is required';
    if (!dueDate.trim()) newErrors.dueDate = 'Due date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const data = {
      title: title.trim(),
      class_id: parseInt(selectedClass),
      description: description.trim() || undefined,
      instructions: instructions.trim() || undefined,
      due_date: dueDate,
      max_points: parseInt(maxPoints) || 100,
      submission_type: submissionType,
      status: status,
    };

    createMutation.mutate(data);
  };

  const getClassName = () => {
    const classItem = classes.find((c) => c.id.toString() === selectedClass);
    return classItem ? classItem.name : 'Select class';
  };

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.modalHeaderLeft}>
            <Icon name="file-text" size={20} color={colors.text} />
            <Text style={styles.modalTitle}>
              {assignment ? 'Edit Assignment' : 'Create New Assignment'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.formScrollView}
          contentContainerStyle={styles.formContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.formSubtitle}>Create a new assignment for your students</Text>

          <Input
            label="Assignment Title *"
            placeholder="e.g., React Component Architecture"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />

          {/* Class Dropdown */}
          <Text style={styles.inputLabel}>Class *</Text>
          <TouchableOpacity
            style={[styles.dropdown, errors.class && styles.dropdownError]}
            onPress={() => {
              setShowClassDropdown(!showClassDropdown);
              setShowSubmissionTypeDropdown(false);
              setShowStatusDropdown(false);
            }}
          >
            <Text style={[styles.dropdownText, !selectedClass && styles.dropdownPlaceholder]}>
              {getClassName()}
            </Text>
            <Icon name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {errors.class && <Text style={styles.errorText}>{errors.class}</Text>}
          {showClassDropdown && (
            <View style={styles.dropdownList}>
              {classes.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={[
                    styles.dropdownListItem,
                    selectedClass === classItem.id.toString() && styles.dropdownListItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedClass(classItem.id.toString());
                    setShowClassDropdown(false);
                    setErrors({ ...errors, class: undefined });
                  }}
                >
                  {selectedClass === classItem.id.toString() && (
                    <Icon name="check" size={16} color={colors.success} />
                  )}
                  <Text
                    style={[
                      styles.dropdownListItemText,
                      selectedClass === classItem.id.toString() && styles.dropdownListItemTextSelected,
                    ]}
                  >
                    {classItem.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Brief description of the assignment"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
          />

          <Text style={styles.inputLabel}>Detailed Instructions</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Provide detailed instructions for students..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textTertiary}
            textAlignVertical="top"
          />

          <View style={styles.rowInputs}>
            <View style={styles.halfInput}>
              <Input
                label="Due Date *"
                placeholder="mm/dd/yyyy"
                value={dueDate}
                onChangeText={setDueDate}
                error={errors.dueDate}
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Max Points"
                placeholder="100"
                value={maxPoints}
                onChangeText={setMaxPoints}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Submission Type Dropdown */}
          <Text style={styles.inputLabel}>Submission Type</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowSubmissionTypeDropdown(!showSubmissionTypeDropdown);
              setShowClassDropdown(false);
              setShowStatusDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>{submissionType === 'file' ? 'File Upload' : submissionType === 'text' ? 'Text Response' : 'Link/URL'}</Text>
            <Icon name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showSubmissionTypeDropdown && (
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={[styles.dropdownListItem, submissionType === 'file' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setSubmissionType('file');
                  setShowSubmissionTypeDropdown(false);
                }}
              >
                {submissionType === 'file' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, submissionType === 'file' && styles.dropdownListItemTextSelected]}>
                  File Upload
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownListItem, submissionType === 'text' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setSubmissionType('text');
                  setShowSubmissionTypeDropdown(false);
                }}
              >
                {submissionType === 'text' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, submissionType === 'text' && styles.dropdownListItemTextSelected]}>
                  Text Response
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownListItem, submissionType === 'link' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setSubmissionType('link');
                  setShowSubmissionTypeDropdown(false);
                }}
              >
                {submissionType === 'link' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, submissionType === 'link' && styles.dropdownListItemTextSelected]}>
                  Link/URL
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Status Dropdown */}
          <Text style={styles.inputLabel}>Status</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowClassDropdown(false);
              setShowSubmissionTypeDropdown(false);
            }}
          >
            <Text style={styles.dropdownText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            <Icon name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          {showStatusDropdown && (
            <View style={styles.dropdownList}>
              <TouchableOpacity
                style={[styles.dropdownListItem, status === 'draft' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setStatus('draft');
                  setShowStatusDropdown(false);
                }}
              >
                {status === 'draft' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, status === 'draft' && styles.dropdownListItemTextSelected]}>
                  Draft
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownListItem, status === 'published' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setStatus('published');
                  setShowStatusDropdown(false);
                }}
              >
                {status === 'published' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, status === 'published' && styles.dropdownListItemTextSelected]}>
                  Published
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dropdownListItem, status === 'archived' && styles.dropdownListItemSelected]}
                onPress={() => {
                  setStatus('archived');
                  setShowStatusDropdown(false);
                }}
              >
                {status === 'archived' && <Icon name="check" size={16} color={colors.success} />}
                <Text style={[styles.dropdownListItemText, status === 'archived' && styles.dropdownListItemTextSelected]}>
                  Archived
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formActions}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="outline"
              style={styles.cancelButton}
            />
            <Button
              title={createMutation.isPending ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
              onPress={handleSubmit}
              loading={createMutation.isPending}
              variant="primary"
              style={styles.submitButton}
            />
          </View>
        </ScrollView>
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6', // Bright blue
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textInverse,
    includeFontPadding: false,
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  tabTextActive: {
    color: colors.primary,
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
  filterButtonContainer: {
    flex: 1,
    position: 'relative',
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
  assignmentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  assignmentTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  assignmentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'lowercase',
    includeFontPadding: false,
  },
  moreButton: {
    padding: spacing.xs,
  },
  actionMenu: {
    position: 'absolute',
    top: 30,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 120,
    ...shadows.md,
    zIndex: 1000,
    elevation: 5,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionMenuText: {
    fontSize: 14,
    color: colors.text,
    includeFontPadding: false,
  },
  assignmentDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    includeFontPadding: false,
  },
  assignmentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: '45%',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  viewSubmissionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  viewSubmissionsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    includeFontPadding: false,
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
  },
  retryButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  // Create Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    includeFontPadding: false,
  },
  closeButton: {
    padding: spacing.xs,
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    includeFontPadding: false,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  dropdownError: {
    borderColor: colors.error,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  dropdownPlaceholder: {
    color: colors.textTertiary,
  },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
    maxHeight: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  dropdownListItemSelected: {
    backgroundColor: colors.success + '10',
  },
  dropdownListItemText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    includeFontPadding: false,
  },
  dropdownListItemTextSelected: {
    fontWeight: '600',
    color: colors.success,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.md,
    minHeight: 80,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});
