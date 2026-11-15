import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import PuzzleScreen from '../src/screens/puzzle/PuzzleScreen';

test('start button opens the full-screen puzzle game', () => {
  const { getByRole, getByText } = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, right: 0, bottom: 0, left: 0 },
      }}
    >
      <PuzzleScreen />
    </SafeAreaProvider>,
  );

  fireEvent.press(getByRole('button', { name: /BẮT ĐẦU GIẢI CỜ/ }));

  expect(getByText('NHIỆM VỤ')).toBeTruthy();
  expect(getByText('Thoát bài')).toBeTruthy();
});
