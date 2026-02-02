import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - Using production URL for both development and production
const getBaseURL = () => {
  return 'https://engine-rebuild.co.uk/mbest/public/api/v1';
};

const BASE_URL = getBaseURL();

// Create axios instance
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (__DEV__) {
      console.log('API Response:', response.data);
    }
    return response;
  },
  async (error) => {
    // Log errors in development
    if (__DEV__) {
      console.error('API Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config?.url,
      });
    }

    if (error.response?.status === 401) {
      // Handle unauthorized - clear token and redirect to login
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    
    // Improve error message for network errors
    if (!error.response) {
      // Network error (no response from server)
      error.message = error.message || 'Network Error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

