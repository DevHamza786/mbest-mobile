import { apiClient } from './config';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '../../types/api';

export const authService = {
  // Login
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      data
    );
    return response.data;
  },

  // Register
  register: async (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: string;
  }): Promise<ApiResponse<LoginResponse>> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  // Forgot Password
  forgotPassword: async (email: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>(
      '/auth/forgot-password',
      { email }
    );
    return response.data;
  },

  // Logout
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    try {
      const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
      return response.data;
    } catch (error: any) {
      // Even if API call fails, we still want to logout locally
      console.warn('Logout API error:', error);
      return { success: true, data: { message: 'Logged out' } };
    }
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get<ApiResponse<User>>('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: { name?: string; phone?: string }): Promise<ApiResponse<User>> => {
    const response = await apiClient.put<ApiResponse<User>>('/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/change-password', data);
    return response.data;
  },
};

