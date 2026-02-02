import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface TutorDashboardData {
  upcoming_classes: number;
  pending_assignments: number;
  unread_messages: number;
  total_students: number;
  upcoming_sessions: Array<{
    id: number;
    date: string;
    time: string;
    subject: string;
    students: string[];
  }>;
}

export interface Session {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  subject: string;
  year_level: string;
  location: string;
  session_type: string;
  students: Array<{ id: number; name: string }>;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  class: string;
  grade_average: number;
}

export interface Assignment {
  id: number;
  title: string;
  class: string;
  due_date: string;
  submission_count: number;
  status: string;
}

export const tutorService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<TutorDashboardData>> => {
    const response = await apiClient.get<ApiResponse<TutorDashboardData>>('/tutor/dashboard');
    return response.data;
  },

  // Sessions
  getSessions: async (): Promise<ApiResponse<Session[]>> => {
    const response = await apiClient.get<ApiResponse<Session[]>>('/tutor/sessions');
    return response.data;
  },

  createSession: async (data: Partial<Session>): Promise<ApiResponse<Session>> => {
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

  // Students
  getStudents: async (): Promise<ApiResponse<Student[]>> => {
    const response = await apiClient.get<ApiResponse<Student[]>>('/tutor/students');
    return response.data;
  },

  // Assignments
  getAssignments: async (): Promise<ApiResponse<Assignment[]>> => {
    const response = await apiClient.get<ApiResponse<Assignment[]>>('/tutor/assignments');
    return response.data;
  },

  createAssignment: async (data: Partial<Assignment>): Promise<ApiResponse<Assignment>> => {
    const response = await apiClient.post<ApiResponse<Assignment>>('/tutor/assignments', data);
    return response.data;
  },
};

