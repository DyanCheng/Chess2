import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import { useArcaneThemeStore } from '../src/store/arcaneThemeStore';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../src/store/authStore', () => ({
  useAuthStore: (selector: (state: {
    login: () => Promise<void>;
    register: () => Promise<boolean>;
    enterGuestMode: () => void;
    isLoading: boolean;
    error: null;
    clearError: () => void;
  }) => unknown) => selector({
    login: async () => {},
    register: async () => false,
    enterGuestMode: () => {},
    isLoading: false,
    error: null,
    clearError: () => {},
  }),
}));

test('login theme switch updates the shared persisted theme', () => {
  useArcaneThemeStore.setState({ isDark: true });

  const { getByLabelText, unmount } = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <LoginScreen />
    </SafeAreaProvider>,
  );

  fireEvent.press(getByLabelText('Chuyển sang giao diện sáng'));

  expect(useArcaneThemeStore.getState().isDark).toBe(false);
  expect(getByLabelText('Chuyển sang giao diện tối')).toBeTruthy();

  unmount();
  useArcaneThemeStore.setState({ isDark: true });
});
