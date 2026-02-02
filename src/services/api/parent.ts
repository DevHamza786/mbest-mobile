import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface Child {
  id: number;
  name: string;
  email: string;
}

export interface ParentDashboardData {
  children: Child[];
  active_child: Child;
  stats: {
    overall_grade: number;
    attendance_rate: number;
    enrolled_classes: number;
    active_assignments: number;
  };
  recent_activities: Array<{
    id: number;
    type: string;
    description: string;
    date: string;
  }>;
}

export interface Class {
  id: number;
  name: string;
  subject: string;
  tutor_name: string;
  schedule: string;
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

  // Classes
  getChildClasses: async (childId: number): Promise<ApiResponse<Class[]>> => {
    const response = await apiClient.get<ApiResponse<Class[]>>(`/parent/children/${childId}/classes`);
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
};

