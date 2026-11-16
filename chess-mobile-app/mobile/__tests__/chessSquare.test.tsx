import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { render } from '@testing-library/react-native';
import { ChessSquare } from '../src/components/chess/ChessSquare';
import { COLORS } from '../src/constants/theme';

test('marks the last move without changing the square color', () => {
  const { UNSAFE_getByType } = render(
    <ChessSquare
      row={4}
      col={0}
      piece={null}
      isLight
      isSelected={false}
      isValidMove={false}
      isLastMove
      isCapture={false}
      size={40}
      onPress={jest.fn()}
    />,
  );
  const square = UNSAFE_getByType(TouchableOpacity);

  expect(StyleSheet.flatten(square.props.style).backgroundColor).toBe(COLORS.boardLight);
});
