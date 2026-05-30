import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  initialize: () => {
    const token = localStorage.getItem('token');
    if (token) {
      get().fetchUser();
    }
  },

  fetchUser: async () => {
    try {
      const token = get().token;
      const response = await axios.get(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ user: response.data, error: null });
    } catch (error) {
      get().logout();
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, { email, password });
      const { access_token, user } = response.data;
      localStorage.setItem('token', access_token);
      set({ token: access_token, user, isLoading: false });
      return user;
    } catch (error) {
      set({ 
        error: error.response?.data?.error?.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/register`, userData);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: error.response?.data?.error?.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
