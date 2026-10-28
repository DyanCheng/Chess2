import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiService, AuthSessionResponse } from '../services/api/apiService';
import { resetIapUser } from '../services/iap/revenueCat';

const REFRESH_KEY = 'arcane_chess_refresh_token';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
  error: string | null;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

async function saveSession(session: AuthSessionResponse) {
  if (!session.accessToken || !session.refreshToken) throw new Error('Máy chủ không trả phiên đăng nhập');
  await SecureStore.setItemAsync(REFRESH_KEY, session.refreshToken);
  apiService.setToken(session.accessToken);
  return {
    isAuthenticated: true,
    userId: session.user.id,
    email: session.user.email,
    username: session.user.username,
    error: null,
  };
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isLoading: false,
  userId: null,
  email: null,
  username: null,
  error: null,

  hydrate: async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return;
      const response = await apiService.refreshSession(refreshToken);
      if (response.error || !response.data) throw new Error(response.error || 'Không khôi phục được phiên');
      set(await saveSession(response.data));
    } catch {
      apiService.clearToken();
      // Keep the refresh token when the backend is merely offline.
      set({ isAuthenticated: false, userId: null, email: null, username: null });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.login(email, password);
      if (response.error || !response.data) throw new Error(response.error || 'Đăng nhập thất bại');
      set(await saveSession(response.data));
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Đăng nhập thất bại';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.register(email, password, username);
      if (response.error || !response.data) throw new Error(response.error || 'Đăng ký thất bại');
      if (response.data.emailConfirmationRequired) return true;
      set(await saveSession(response.data));
      return false;
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : 'Đăng ký thất bại';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await resetIapUser().catch(() => undefined);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    apiService.clearToken();
    set({ isAuthenticated: false, userId: null, email: null, username: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
