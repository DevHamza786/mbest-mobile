import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface TutorDashboardData {
  total_students?: number;
  active_classes?: number;
  pending_assignments?: number;
  todays_classes?: number;
  upcoming_classes?: number;
  unread_messages?: number;
  todays_classes_list?: Array<{
    id: number;
    class_id?: number;
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    year_level?: string;
    location?: string;
    session_type?: string;
    students?: Array<{ id: number; name: string }> | string[];
  }>;
  upcoming_sessions?: Array<{
    id: number;
    date: string;
    time: string;
    subject: string;
    students: string[];
  }>;
}

export interface Class {
  id: number;
  name: string;
  subject: string;
  year_level: string;
  tutor_name?: string;
  student_count?: number;
  description?: string;
}

export interface ClassDetails extends Class {
  students: Array<{
    id: number;
    name: string;
    email: string;
    grade_average?: number;
  }>;
}

export interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  year_level?: string;
  location: string;
  session_type: string;
  status?: string;
  notes?: string;
  lesson_note?: string | null;
  attendance_marked?: boolean;
  ready_for_invoicing?: boolean;
  homework_resources?: string | null;
  topics_taught?: string | null;
  student_notes?: any[];
  color?: string;
  students: Array<{
    id: number;
    name?: string;
    user_id?: number | string;
    parent_id?: number | string | null;
    enrollment_id?: string;
    grade?: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  class_id?: number | string;
  student_id?: number;
  teacher_id?: number | string;
  class_model?: {
    id: number;
    name: string;
    code?: string;
    description?: string;
    category?: string;
    level?: string;
    capacity?: string;
    enrolled?: string;
    credits?: string;
    duration?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface LessonRequest {
  id: number;
  student_name: string;
  parent_name: string;
  lesson_type: string;
  preferred_date: string;
  preferred_time: string;
  duration: string;
  duration_hours: number;
  message: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'declined';
  sender_id: string;
  recipient_id: string;
}

export interface Student {
  id: number;
  user_id?: number | string;
  parent_id?: number | string | null;
  enrollment_id?: string;
  grade?: string;
  school?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  completed_assignments?: number;
  total_assignments?: number;
  overall_grade?: string | number;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    email_verified_at?: string | null;
    is_active?: boolean;
  };
  classes?: Array<{
    id: number;
    name: string;
    code?: string;
    tutor_id?: number | string;
  }>;
  // Legacy fields for backward compatibility
  name?: string;
  email?: string;
  class?: string;
  class_id?: number;
  grade_average?: number;
  phone?: string;
  avatar?: string;
}

export interface StudentDetails extends Student {
  grades: Array<{
    id: number;
    assignment_title: string;
    grade: number;
    max_grade: number;
    percentage: number;
    date: string;
  }>;
  assignments: Array<{
    id: number;
    title: string;
    due_date: string;
    status: string;
    submission_id?: number;
  }>;
}

export interface Assignment {
  id: number;
  title: string;
  description?: string;
  instructions?: string;
  class_id: number | string;
  tutor_id?: number | string;
  due_date: string;
  max_points?: number | string;
  submission_type?: string;
  allowed_file_types?: string[];
  submission_count?: number;
  submissions_count?: number;
  total_submissions?: number;
  submitted_count?: number;
  total_students?: number | string;
  status: string;
  created_at?: string;
  updated_at?: string;
  class?: string;
  class_name?: string;
  course?: string;
  class_model?: {
    id: number;
    name: string;
    code?: string;
    description?: string;
    category?: string;
    level?: string;
    capacity?: string;
    enrolled?: string;
    credits?: string;
    duration?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  };
  submissions?: Array<{
    id: number;
    assignment_id: number | string;
    student_id: number | string;
    submitted_at?: string;
    file_url?: string | null;
    text_submission?: string | null;
    link_submission?: string | null;
    status: string;
    grade?: number | null;
    feedback?: string | null;
    graded_at?: string | null;
    created_at?: string;
    updated_at?: string;
  }>;
}

export interface AssignmentDetails extends Assignment {
  submissions: Array<{
    id: number;
    assignment_id: number | string;
    student_id: number | string;
    submitted_at?: string;
    status: string;
    grade?: string | number | null;
    feedback?: string | null;
    graded_at?: string | null;
    file_url?: string | null;
    text_submission?: string | null;
    link_submission?: string | null;
    created_at?: string;
    updated_at?: string;
    student?: {
      id: number;
      user_id?: string | number;
      enrollment_id?: string;
      user?: {
        id: number;
        name: string;
        email: string;
      };
    };
  }>;
}

export interface Availability {
  id: number;
  tutor_id?: string;
  day_of_week: string; // "Monday", "Tuesday", etc.
  start_time: string; // "18:00:00"
  end_time: string; // "21:00:00"
  is_available?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  student_name: string;
  class_name?: string;
  date: string;
  time?: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export interface AttendanceSummary {
  total_records: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface LessonHistory {
  id: number;
  session_id: number;
  date: string;
  subject: string;
  students: string[];
  duration: number;
  notes?: string;
}

export interface Question {
  id: number;
  student_id: number;
  student_name: string;
  question: string;
  answer?: string;
  answered_at?: string;
  created_at: string;
}

export interface Hours {
  total_hours: number;
  this_month: number;
  this_week: number;
  sessions_count: number;
}

export interface Resource {
  id: number;
  title: string;
  description?: string;
  type: 'document' | 'pdf' | 'video' | 'link';
  category?: string;
  class_id?: number;
  class_name?: string;
  file_url?: string;
  file_size?: string;
  tags?: string[];
  is_public: boolean;
  downloads: number | string;
  tutor_id: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceRequest {
  id: number;
  title: string;
  description?: string;
  type: string;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  student_id: number;
  student_name?: string;
  requested_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

export interface ResourceStats {
  total: number;
  public: number;
  private: number;
  total_downloads: number;
}

export const tutorService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<TutorDashboardData>> => {
    const response = await apiClient.get<ApiResponse<TutorDashboardData>>('/tutor/dashboard');
    return response.data;
  },

  // Classes
  getClasses: async (params?: { search?: string }): Promise<ApiResponse<Class[]>> => {
    const response = await apiClient.get<ApiResponse<Class[]>>('/tutor/classes', { params });
    return response.data;
  },

  getClassDetails: async (id: number): Promise<ApiResponse<ClassDetails>> => {
    const response = await apiClient.get<ApiResponse<ClassDetails>>(`/tutor/classes/${id}`);
    return response.data;
  },

  getClassStudents: async (id: number): Promise<ApiResponse<Student[]>> => {
    const response = await apiClient.get<ApiResponse<Student[]>>(`/tutor/classes/${id}/students`);
    return response.data;
  },

  // Students
  getStudents: async (params?: { class_id?: number; search?: string }): Promise<ApiResponse<Student[]>> => {
    const response = await apiClient.get<ApiResponse<Student[]>>('/tutor/students', { params });
    return response.data;
  },

  getStudentDetails: async (id: number): Promise<ApiResponse<StudentDetails>> => {
    const response = await apiClient.get<ApiResponse<StudentDetails>>(`/tutor/students/${id}`);
    return response.data;
  },

  getStudentGrades: async (id: number): Promise<ApiResponse<StudentDetails['grades']>> => {
    const response = await apiClient.get<ApiResponse<StudentDetails['grades']>>(`/tutor/students/${id}/grades`);
    return response.data;
  },

  getStudentAssignments: async (id: number): Promise<ApiResponse<StudentDetails['assignments']>> => {
    const response = await apiClient.get<ApiResponse<StudentDetails['assignments']>>(`/tutor/students/${id}/assignments`);
    return response.data;
  },

  // Lesson Requests
  getLessonRequests: async (): Promise<ApiResponse<LessonRequest[]>> => {
    const response = await apiClient.get<ApiResponse<LessonRequest[]>>('/tutor/lesson-requests');
    return response.data;
  },

  approveLessonRequest: async (id: number): Promise<ApiResponse<Session>> => {
    const response = await apiClient.post<ApiResponse<Session>>(`/tutor/lesson-requests/${id}/approve`);
    return response.data;
  },

  declineLessonRequest: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/tutor/lesson-requests/${id}/decline`);
    return response.data;
  },

  // Sessions
  getSessions: async (params?: {
    date_from?: string;
    date_to?: string;
    status?: string;
    subject?: string;
    student_id?: number;
    class_id?: number;
  }): Promise<ApiResponse<Session[]>> => {
    const response = await apiClient.get<ApiResponse<Session[]>>('/tutor/sessions', { params });
    return response.data;
  },

  getSessionDetails: async (id: number): Promise<ApiResponse<Session>> => {
    const response = await apiClient.get<ApiResponse<Session>>(`/tutor/sessions/${id}`);
    return response.data;
  },

  createSession: async (data: {
    date: string;
    start_time: string;
    end_time: string;
    subject: string;
    year_level?: string;
    location: string;
    session_type: string;
    student_ids?: number[];
    class_id?: number;
    student_id?: number;
  }): Promise<ApiResponse<Session>> => {
    const response = await apiClient.post<ApiResponse<Session>>('/tutor/sessions', data);
    return response.data;
  },

  updateSession: async (id: number, data: Partial<Session>): Promise<ApiResponse<Session>> => {
    const response = await apiClient.put<ApiResponse<Session>>(`/tutor/sessions/${id}`, data);
    return response.data;
  },

  deleteSession: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tutor/sessions/${id}`);
    return response.data;
  },

  addSessionNotes: async (id: number, notes: string): Promise<ApiResponse<Session>> => {
    const response = await apiClient.post<ApiResponse<Session>>(`/tutor/sessions/${id}/notes`, { notes });
    return response.data;
  },

  markSessionAttendance: async (id: number, attendance: Array<{
    student_id: number;
    status: 'present' | 'absent' | 'late';
  }>): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(`/tutor/sessions/${id}/attendance`, { attendance });
    return response.data;
  },

  // Assignments
  getAssignments: async (params?: { class_id?: number; status?: string }): Promise<ApiResponse<Assignment[]>> => {
    const response = await apiClient.get<ApiResponse<Assignment[]>>('/tutor/assignments', { params });
    return response.data;
  },

  getAssignmentDetails: async (id: number): Promise<ApiResponse<AssignmentDetails>> => {
    const response = await apiClient.get<ApiResponse<AssignmentDetails>>(`/tutor/assignments/${id}`);
    return response.data;
  },

  createAssignment: async (data: {
    title: string;
    description?: string;
    instructions?: string;
    class_id: number;
    due_date: string;
    max_points?: number;
    submission_type?: string;
    status?: string;
  }): Promise<ApiResponse<Assignment>> => {
    const response = await apiClient.post<ApiResponse<Assignment>>('/tutor/assignments', data);
    return response.data;
  },

  updateAssignment: async (id: number, data: Partial<Assignment>): Promise<ApiResponse<Assignment>> => {
    const response = await apiClient.put<ApiResponse<Assignment>>(`/tutor/assignments/${id}`, data);
    return response.data;
  },

  deleteAssignment: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tutor/assignments/${id}`);
    return response.data;
  },

  getAssignmentSubmissions: async (id: number): Promise<ApiResponse<AssignmentDetails['submissions']>> => {
    const response = await apiClient.get<ApiResponse<AssignmentDetails['submissions']>>(`/tutor/assignments/${id}/submissions`);
    return response.data;
  },

  gradeSubmission: async (submissionId: number, data: {
    grade: number;
    max_grade: number;
    feedback?: string;
    assessment?: string;
    class_id?: number;
    subject?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(`/tutor/submissions/${submissionId}/grade`, data);
    return response.data;
  },

  // Availability
  getAvailability: async (): Promise<ApiResponse<Availability[]>> => {
    const response = await apiClient.get<ApiResponse<Availability[]>>('/tutor/availability');
    return response.data;
  },

  saveAvailability: async (availability: Array<{
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }>): Promise<ApiResponse<Availability[]>> => {
    const response = await apiClient.post<ApiResponse<Availability[]>>('/tutor/availability', { availability });
    return response.data;
  },

  createAvailability: async (data: {
    day_of_week: string;
    start_time: string;
    end_time: string;
  }): Promise<ApiResponse<Availability>> => {
    const response = await apiClient.post<ApiResponse<Availability>>('/tutor/availability', data);
    return response.data;
  },

  updateAvailability: async (id: number, data: Partial<Availability>): Promise<ApiResponse<Availability>> => {
    const response = await apiClient.put<ApiResponse<Availability>>(`/tutor/availability/${id}`, data);
    return response.data;
  },

  deleteAvailability: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/tutor/availability/${id}`);
    return response.data;
  },

  // Attendance
  getAttendance: async (params?: { date_from?: string; date_to?: string; student_id?: number }): Promise<ApiResponse<AttendanceRecord[]>> => {
    const response = await apiClient.get<ApiResponse<AttendanceRecord[]>>('/tutor/attendance', { params });
    return response.data;
  },

  getAttendanceRecords: async (params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<AttendanceRecord[]>> => {
    const response = await apiClient.get<ApiResponse<AttendanceRecord[]>>('/tutor/attendance-records', { params });
    return response.data;
  },

  // Hours
  getHours: async (params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<Hours>> => {
    const response = await apiClient.get<ApiResponse<Hours>>('/tutor/hours', { params });
    return response.data;
  },

  // Invoices
  getInvoices: async (params?: { status?: string }): Promise<ApiResponse<Invoice[]>> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/tutor/invoices', { params });
    return response.data;
  },

  createInvoice: async (data: {
    student_id: number;
    amount: number;
    description?: string;
    due_date: string;
  }): Promise<ApiResponse<Invoice>> => {
    const response = await apiClient.post<ApiResponse<Invoice>>('/tutor/invoices', data);
    return response.data;
  },

  // Lesson History
  getLessonHistory: async (params?: { date_from?: string; date_to?: string }): Promise<ApiResponse<LessonHistory[]>> => {
    const response = await apiClient.get<ApiResponse<LessonHistory[]>>('/tutor/lesson-history', { params });
    return response.data;
  },

  // Questions
  getQuestions: async (params?: { student_id?: number; answered?: boolean }): Promise<ApiResponse<Question[]>> => {
    const response = await apiClient.get<ApiResponse<Question[]>>('/tutor/questions', { params });
    return response.data;
  },

  replyToQuestion: async (id: number, answer: string): Promise<ApiResponse<Question>> => {
    const response = await apiClient.post<ApiResponse<Question>>(`/tutor/questions/${id}/reply`, { answer });
    return response.data;
  },

  // Messaging
  getRecipients: async (): Promise<ApiResponse<Array<{ id: number; name: string; email: string; role: string }>>> => {
    const response = await apiClient.get<ApiResponse<Array<{ id: number; name: string; email: string; role: string }>>>('/tutor/students/recipients');
    return response.data;
  },

  // Resources
  getResources: async (params?: { search?: string; type?: string; class_id?: number }): Promise<ApiResponse<Resource[]>> => {
    const response = await apiClient.get<ApiResponse<Resource[]>>('/resources', { params });
    return response.data;
  },

  createResource: async (data: FormData): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.post<ApiResponse<Resource>>('/resources', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateResource: async (id: number, data: Partial<Resource>): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.put<ApiResponse<Resource>>(`/resources/${id}`, data);
    return response.data;
  },

  deleteResource: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/resources/${id}`);
    return response.data;
  },

  // Resource Requests
  getResourceRequests: async (params?: { status?: string }): Promise<ApiResponse<ResourceRequest[]>> => {
    const response = await apiClient.get<ApiResponse<ResourceRequest[]>>('/resource-requests', { params });
    return response.data;
  },

  approveResourceRequest: async (id: number, notes?: string): Promise<ApiResponse<ResourceRequest>> => {
    const response = await apiClient.put<ApiResponse<ResourceRequest>>(`/resource-requests/${id}`, { 
      status: 'approved',
      review_notes: notes 
    });
    return response.data;
  },

  rejectResourceRequest: async (id: number, notes?: string): Promise<ApiResponse<ResourceRequest>> => {
    const response = await apiClient.put<ApiResponse<ResourceRequest>>(`/resource-requests/${id}`, { 
      status: 'rejected',
      review_notes: notes 
    });
    return response.data;
  },

  fulfillResourceRequest: async (id: number): Promise<ApiResponse<ResourceRequest>> => {
    const response = await apiClient.put<ApiResponse<ResourceRequest>>(`/resource-requests/${id}`, { 
      status: 'fulfilled' 
    });
    return response.data;
  },
};

