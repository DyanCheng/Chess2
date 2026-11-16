import { calculateBoardSquareSize } from '../src/components/chess/ChessBoard';
import { BOARD_SIZE } from '../src/constants/chess';
import { SPACING } from '../src/constants/theme';

const boardWidth = (squareSize: number) => squareSize * BOARD_SIZE + 10;

test('fits the board within a narrow screen width', () => {
  const squareSize = calculateBoardSquareSize(360, 900);

  expect(boardWidth(squareSize)).toBeLessThanOrEqual(360 - SPACING.xl * 2);
});

test('limits the board size on short screens', () => {
  const screenHeight = 400;
  const squareSize = calculateBoardSquareSize(800, screenHeight);

  expect(boardWidth(squareSize)).toBeLessThanOrEqual(screenHeight * 0.42);
});

test('respects the measured width of a puzzle card', () => {
  const squareSize = calculateBoardSquareSize(390, 844, 260);

  expect(boardWidth(squareSize)).toBeLessThanOrEqual(260);
});
