import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'arcane_chess_refresh_token';

export const authTokenStorage = {
  getRefreshToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.');
      return Promise.resolve(window.sessionStorage.getItem(REFRESH_TOKEN_KEY));
    }
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(refreshToken: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.');
      window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  deleteRefreshToken(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.');
      window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
