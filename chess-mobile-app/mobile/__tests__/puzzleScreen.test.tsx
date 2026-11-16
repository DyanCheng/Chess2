import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { apiService } from '../src/services/api/apiService';
import PuzzleScreen from '../src/screens/puzzle/PuzzleScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../src/store/authStore', () => ({
  useAuthStore: (selector: (state: {
    isAuthenticated: boolean;
    isGuest: boolean;
    userId: string;
    exitGuestMode: jest.Mock;
  }) => unknown) => selector({
    isAuthenticated: true,
    isGuest: false,
    userId: 'test-user',
    exitGuestMode: jest.fn(),
  }),
}));

jest.mock('../src/services/api/apiService', () => ({
  apiService: {
    getPuzzleProgress: jest.fn(),
    completePuzzle: jest.fn(),
  },
}));

const initialProgress = {
  today: '2026-11-16',
  dailyPuzzleId: 'mate-in-one-1',
  completedPuzzleIds: [],
  unlockedPuzzleId: 'mate-in-one-1',
  currentStreak: 0,
  bestStreak: 0,
  lastDailySolvedOn: null,
};

const completedFirstPuzzle = {
  ...initialProgress,
  dailyPuzzleId: 'mate-in-one-2',
  completedPuzzleIds: ['mate-in-one-1'],
  unlockedPuzzleId: 'mate-in-one-2',
};

const renderScreen = () => render(
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    }}
  >
    <PuzzleScreen />
  </SafeAreaProvider>,
);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(apiService.getPuzzleProgress).mockResolvedValue({
    data: initialProgress,
    error: null,
    status: 200,
  });
  jest.mocked(apiService.completePuzzle).mockResolvedValue({
    data: completedFirstPuzzle,
    error: null,
    status: 200,
  });
});

test('loads account progress and opens the daily puzzle', async () => {
  const { getByRole, getByText } = renderScreen();

  await waitFor(() => expect(apiService.getPuzzleProgress).toHaveBeenCalled());
  fireEvent.press(getByRole('button', { name: /BẮT ĐẦU GIẢI CỜ/ }));

  expect(getByText('NHIỆM VỤ')).toBeTruthy();
  expect(getByText('Thoát bài')).toBeTruthy();
});

test('completing an unlocked puzzle saves it and advances to the newly unlocked puzzle', async () => {
  const { getByRole, getByText, getByTestId, getByLabelText } = renderScreen();

  await waitFor(() => expect(getByRole('button', { name: 'Bài 1: Chiếu hết trong 1 nước, đã mở khóa' })).toBeTruthy());
  expect(
    getByRole('button', { name: 'Bài 2: Đòn chiếu hết hàng cuối, chưa mở khóa' })
      .props.accessibilityState.disabled,
  ).toBe(true);

  fireEvent.press(getByRole('button', { name: 'Bài 1: Chiếu hết trong 1 nước, đã mở khóa' }));
  fireEvent(getByTestId('puzzle-board-area'), 'layout', {
    nativeEvent: { layout: { width: 340, height: 340 } },
  });
  fireEvent.press(getByLabelText('Ô h5'));
  fireEvent.press(getByLabelText('Ô f7'));

  await waitFor(() => expect(apiService.completePuzzle).toHaveBeenCalledWith(
    'mate-in-one-1',
    'h5f7',
    false,
  ));
  fireEvent.press(getByRole('button', { name: /Bài tiếp theo/ }));

  expect(getByText('BÀI 2/5 · DỄ')).toBeTruthy();
  expect(getByText('Thoát bài')).toBeTruthy();
});
