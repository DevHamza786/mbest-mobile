import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types/api';

// Safe AsyncStorage wrapper
const safeAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage removeItem error:', error);
    }
  },
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

const authStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => set({ token }),

  login: async (user, token) => {
    await safeAsyncStorage.setItem('auth_token', token);
    await safeAsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    await safeAsyncStorage.removeItem('auth_token');
    await safeAsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadAuth: async () => {
    try {
      const token = await safeAsyncStorage.getItem('auth_token');
      const userStr = await safeAsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      set({ user, token, isAuthenticated: !!(user && token) });
    } catch (error) {
      console.error('Error loading auth:', error);
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
}));

// Export as both named and default
export const useAuthStore = authStore;
export default authStore;
