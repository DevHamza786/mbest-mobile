import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../../store/subscriptionStore';

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
    'Accept': 'application/json',
    // Don't set Content-Type here - it will be set automatically based on data type
    // For FormData, axios will set multipart/form-data with boundary
  },
});

// Request interceptor to add auth token and handle FormData
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Handle FormData vs JSON data
    const isFormData = config.data instanceof FormData;
    
    if (isFormData) {
      // For FormData, if Content-Type is already set to multipart/form-data, keep it
      // Otherwise, don't set it - let the request config handle it
      if (config.headers && config.headers['Content-Type'] !== 'multipart/form-data') {
        // Only remove if it's not already set correctly
        if (config.headers['Content-Type'] === 'application/json') {
          delete config.headers['Content-Type'];
        }
      }
      // Keep Accept header for JSON response
      if (!config.headers['Accept']) {
        config.headers['Accept'] = 'application/json';
      }
    } else if (config.data && typeof config.data === 'object' && !isFormData) {
      // For JSON data, set Content-Type only if not already set
      if (!config.headers['Content-Type'] && !config.headers['content-type']) {
        config.headers['Content-Type'] = 'application/json';
      }
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

    if (error.response?.status === 403) {
      const data = error.response?.data;
      const msg = data?.message || '';
      if (
        msg.toLowerCase().includes('subscription') ||
        data?.redirect_to?.includes('subscription')
      ) {
        useSubscriptionStore.getState().setSubscriptionRequired(true);
      }
    }
    
    // Improve error message for network errors
    if (!error.response) {
      // Network error (no response from server)
      error.message = error.message || 'Network Error. Please check your connection.';
    }
    
    return Promise.reject(error);
  }
);

