import { create } from 'zustand';
import { apiService, AuthSessionResponse } from '../services/api/apiService';
import { SupabaseAuthError, supabaseAuth } from '../services/supabaseAuth';
import { authTokenStorage } from '../services/authTokenStorage';
import { resetIapUser } from '../services/iap/revenueCat';

interface AuthState {
  isAuthenticated: boolean;
  isGuest: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  userId: string | null;
  email: string | null;
  username: string | null;
  error: string | null;
  hydrate: () => Promise<void>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

async function saveSession(session: Pick<AuthSessionResponse, 'accessToken' | 'refreshToken'>) {
  if (!session.accessToken || !session.refreshToken) throw new Error('Không nhận được phiên đăng nhập hợp lệ.');
  apiService.setToken(session.accessToken);
  try {
    const profile = await apiService.getProfile();
    if (profile.error || !profile.data) {
      throw new Error(profile.error || 'Không thể tải hồ sơ người chơi.');
    }
    await authTokenStorage.setRefreshToken(session.refreshToken);
    return {
      isAuthenticated: true,
      isGuest: false,
      userId: profile.data.id,
      email: profile.data.email,
      username: profile.data.username,
      error: null,
    };
  } catch (error) {
    apiService.clearToken();
    throw error;
  }
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: false,
  isGuest: false,
  isHydrated: false,
  isLoading: false,
  userId: null,
  email: null,
  username: null,
  error: null,

  hydrate: async () => {
    try {
      const refreshToken = await authTokenStorage.getRefreshToken();
      if (!refreshToken) return;
      const session = await supabaseAuth.refreshSession(refreshToken);
      set(await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      }));
    } catch (error) {
      if (error instanceof SupabaseAuthError && (error.status === 400 || error.status === 401)) {
        await authTokenStorage.deleteRefreshToken();
      }
      apiService.clearToken();
      set({ isAuthenticated: false, userId: null, email: null, username: null });
    } finally {
      set({ isHydrated: true });
    }
  },

  enterGuestMode: () => set({ isGuest: true }),

  exitGuestMode: () => set({ isGuest: false }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const session = await supabaseAuth.signInWithPassword(email, password);
      set(await saveSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      }));
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
      set(await saveSession(response.data));
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
    await authTokenStorage.deleteRefreshToken();
    apiService.clearToken();
    set({
      isAuthenticated: false,
      isGuest: false,
      userId: null,
      email: null,
      username: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
