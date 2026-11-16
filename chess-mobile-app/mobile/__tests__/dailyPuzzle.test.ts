import { Chess } from 'chess.js';
import {
  DAILY_PUZZLE_FEN,
  DAILY_PUZZLE_SOLUTION,
  getDailyPuzzleBoard,
  getDailyPuzzleLegalMoves,
  getPuzzleById,
  playDailyPuzzleMove,
  TACTICAL_PUZZLES,
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

test('every selectable puzzle has a legal, unique mate-in-one solution', () => {
  for (const puzzle of TACTICAL_PUZZLES) {
    const position = new Chess(puzzle.fen);
    const [from, to] = [puzzle.solution.slice(0, 2), puzzle.solution.slice(2, 4)];
    expect(position.isCheck()).toBe(false);
    expect(new Chess(puzzle.fen.replace(' w ', ' b ')).isCheck()).toBe(false);

    const matchingMoves = position.moves({ verbose: true }).filter(move => {
      const next = new Chess(puzzle.fen);
      next.move({ from: move.from, to: move.to, promotion: 'q' });
      return next.isCheckmate();
    });
    const solution = position.moves({ verbose: true })
      .find(move => move.from === from && move.to === to);

    expect(matchingMoves.map(move => `${move.from}${move.to}`)).toEqual([puzzle.solution]);
    expect(solution).toBeDefined();
  }
});

test('puzzle collection can look up known puzzles and rejects unknown IDs', () => {
  expect(getPuzzleById(TACTICAL_PUZZLES[0].id)).toEqual(TACTICAL_PUZZLES[0]);
  expect(getPuzzleById('unknown-puzzle')).toBeNull();
});
