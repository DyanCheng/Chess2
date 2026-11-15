import {
  DAILY_PUZZLE_FEN,
  DAILY_PUZZLE_SOLUTION,
  getDailyPuzzleBoard,
  getDailyPuzzleLegalMoves,
  playDailyPuzzleMove,
} from '../src/services/game/dailyPuzzle';

test('builds a complete puzzle position with correctly colored pieces', () => {
  const board = getDailyPuzzleBoard(DAILY_PUZZLE_FEN);

  expect(board).toHaveLength(8);
  expect(board.every(row => row.length === 8)).toBe(true);
  expect(board[0][3]).toMatchObject({ type: 'queen', color: 'black' });
  expect(board[0][4]).toMatchObject({ type: 'king', color: 'black' });
  expect(board[3][7]).toMatchObject({ type: 'queen', color: 'white' });
});

test('shows only legal moves and rejects illegal puzzle moves', () => {
  const legalMoves = getDailyPuzzleLegalMoves(DAILY_PUZZLE_FEN, { row: 3, col: 7 });

  expect(legalMoves).toContainEqual({ row: 1, col: 5 });
  expect(playDailyPuzzleMove(DAILY_PUZZLE_FEN, { row: 3, col: 7 }, { row: 0, col: 7 })).toBeNull();
});

test('accepts the puzzle solution only when it checkmates', () => {
  const result = playDailyPuzzleMove(DAILY_PUZZLE_FEN, { row: 3, col: 7 }, { row: 1, col: 5 });

  expect(result).toMatchObject({ uci: DAILY_PUZZLE_SOLUTION, isCheckmate: true });
});
