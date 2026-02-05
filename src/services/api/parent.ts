import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface Child {
  id: number;
  name?: string;
  email?: string;
  user?: { name?: string; email?: string };
  student?: { user?: { name?: string } };
}

export interface ParentDashboardData {
  children: Child[];
  active_child: Child;
  stats: {
    overall_grade: number;
    attendance_rate: number;
    enrolled_classes: number;
    active_assignments: number;
    completed_work?: number;
    upcoming_tests?: number;
  };
  recent_activities?: Array<{
    id: number;
    type: string;
    description: string;
    date: string;
  }>;
  recent_grades?: Array<{
    id: number;
    assignment_name: string;
    class?: string;
    grade: number;
    max_points: number;
    percentage: number;
    date: string;
  }>;
  today_schedule?: Array<{
    id: number;
    class_id?: number;
    name: string;
    subject?: string;
    schedules?: Array<{
      day_of_week: string;
      start_time: string;
      end_time: string;
    }>;
    tutor_name?: string;
    instructor?: string;
  }>;
}

export interface ClassSchedule {
  id: number;
  class_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  meeting_link: string | null;
}

export interface Class {
  id: number;
  name: string;
  code: string;
  tutor_id: string;
  description: string;
  category: string;
  level: string;
  capacity: string;
  enrolled: string;
  credits: string;
  duration: string;
  status: string;
  start_date: string;
  end_date: string;
  schedules: ClassSchedule[];
  tutor?: {
    id: number;
    user_id: string;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  };
  tutor_name?: string;
  subject?: string;
  schedule?: string;
  materials?: Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    category?: string;
    url?: string;
    file_path?: string | null;
  }>;
  resources?: Array<{
    id: number;
    title: string;
    description?: string;
    type: string;
    url?: string;
    file_path?: string | null;
  }>;
}

export interface Assignment {
  id: number;
  title: string;
  class: string;
  due_date: string;
  submission_status: string;
  grade?: number;
}

export interface Grade {
  id: number;
  assignment_name: string;
  class: string;
  grade: number;
  max_points: number;
  percentage: number;
  date: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  child_name: string;
}

export const parentService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<ParentDashboardData>> => {
    const response = await apiClient.get<ApiResponse<ParentDashboardData>>('/parent/dashboard');
    return response.data;
  },

  // Classes (returns paginated response: data.data is the classes array)
  getChildClasses: async (childId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/parent/children/${childId}/classes`);
    return response.data;
  },

  // Class details (single class with full data including materials)
  getClassDetails: async (childId: number, classId: number): Promise<ApiResponse<Class>> => {
    const response = await apiClient.get<ApiResponse<Class>>(
      `/parent/children/${childId}/classes/${classId}`
    );
    return response.data;
  },

  // Assignments
  getChildAssignments: async (childId: number): Promise<ApiResponse<Assignment[]>> => {
    const response = await apiClient.get<ApiResponse<Assignment[]>>(`/parent/children/${childId}/assignments`);
    return response.data;
  },

  // Grades
  getChildGrades: async (childId: number): Promise<ApiResponse<Grade[]>> => {
    const response = await apiClient.get<ApiResponse<Grade[]>>(`/parent/children/${childId}/grades`);
    return response.data;
  },

  // Attendance
  getChildAttendance: async (childId: number): Promise<ApiResponse<any>> => {
    const response = await apiClient.get<ApiResponse<any>>(`/parent/children/${childId}/attendance`);
    return response.data;
  },

  // Billing
  getInvoices: async (): Promise<ApiResponse<Invoice[]>> => {
    const response = await apiClient.get<ApiResponse<Invoice[]>>('/parent/billing/invoices');
    return response.data;
  },

  // Create Student
  createStudent: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    school: string;
    grade: string;
    phone: string;
    date_of_birth?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
  }): Promise<ApiResponse<Child>> => {
    const response = await apiClient.post<ApiResponse<Child>>('/parent/children', data);
    return response.data;
  },
};

