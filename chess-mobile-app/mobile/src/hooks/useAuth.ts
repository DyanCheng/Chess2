// ============================================================
// useAuth Hook - Authentication management
// ============================================================

import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const {
    isAuthenticated, isLoading, userId, email, error,
    login, register, logout, clearError,
  } = useAuthStore();

  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password);
  }, [login]);

  const handleRegister = useCallback(async (email: string, password: string, username: string) => {
    await register(email, password, username);
  }, [register]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    isAuthenticated,
    isLoading,
    userId,
    email,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
  };
}
