import { apiClient } from './config';
import type { ApiResponse, LoginRequest, LoginResponse } from '../../types/api';

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
};

