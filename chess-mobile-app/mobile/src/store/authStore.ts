// ============================================================
// Auth Store - Authentication state
// ============================================================

import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  token: string | null;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: true, // Default to true for development
  isLoading: false,
  userId: 'player_1',
  email: 'demo@chess.app',
  token: 'demo_token',
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Integrate with Supabase auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({
        isAuthenticated: true,
        userId: 'player_1',
        email,
        token: 'demo_token',
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Đăng nhập thất bại', isLoading: false });
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Integrate with Supabase auth
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({
        isAuthenticated: true,
        userId: 'player_1',
        email,
        token: 'demo_token',
        isLoading: false,
      });
    } catch (error) {
      set({ error: 'Đăng ký thất bại', isLoading: false });
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      userId: null,
      email: null,
      token: null,
    });
  },

  clearError: () => set({ error: null }),
}));
