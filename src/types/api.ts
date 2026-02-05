// API Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'tutor' | 'student' | 'parent';
  phone?: string;
  avatar?: string;
  package_id?: number | null;
  subscription_status?: 'active' | 'pending' | 'rejected' | 'expired' | 'cancelled' | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

