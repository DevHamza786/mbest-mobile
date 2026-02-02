import { apiClient } from './config';
import type { ApiResponse } from '../../types/api';

export interface DashboardData {
  total_students: number;
  total_tutors: number;
  total_classes: number;
  monthly_revenue: number;
  recent_activities: Array<{
    id: number;
    type: string;
    description: string;
    created_at: string;
  }>;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Class {
  id: number;
  name: string;
  subject: string;
  tutor_name: string;
  student_count: number;
  status: string;
}

export const adminService = {
  // Dashboard
  getDashboard: async (): Promise<ApiResponse<DashboardData>> => {
    const response = await apiClient.get<ApiResponse<DashboardData>>('/admin/dashboard');
    return response.data;
  },

  // Users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  },

  createUser: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.post<ApiResponse<User>>('/admin/users', data);
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/users/${id}`);
    return response.data;
  },

  // Classes
  getClasses: async (): Promise<ApiResponse<Class[]>> => {
    const response = await apiClient.get<ApiResponse<Class[]>>('/admin/classes');
    return response.data;
  },

  createClass: async (data: Partial<Class>): Promise<ApiResponse<Class>> => {
    const response = await apiClient.post<ApiResponse<Class>>('/admin/classes', data);
    return response.data;
  },

  updateClass: async (id: number, data: Partial<Class>): Promise<ApiResponse<Class>> => {
    const response = await apiClient.put<ApiResponse<Class>>(`/admin/classes/${id}`, data);
    return response.data;
  },

  deleteClass: async (id: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/classes/${id}`);
    return response.data;
  },
};

