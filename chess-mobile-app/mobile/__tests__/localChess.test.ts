import { applyLocalMove, localBoard, localLegalMoves, localTurn, resetLocalChess } from '../src/services/game/localChess';

const square = (name: string) => ({ row: 8 - Number(name[1]), col: name.charCodeAt(0) - 97 });
const play = (from: string, to: string) => applyLocalMove(square(from), square(to));

beforeEach(resetLocalChess);

test('uses the same legal turn and rejects an illegal move', () => {
  expect(localLegalMoves(square('e2'))).toContainEqual(square('e4'));
  expect(play('e2', 'e5')).toBeNull();
  expect(play('e2', 'e4')?.move.notation).toBe('e4');
  expect(localTurn()).toBe('black');
  expect(play('d2', 'd4')).toBeNull();
});

test('handles en passant on the offline board', () => {
  play('e2', 'e4');
  play('a7', 'a6');
  play('e4', 'e5');
  play('d7', 'd5');
  const result = play('e5', 'd6');
  expect(result?.move.isEnPassant).toBe(true);
  expect(result?.captured?.type).toBe('pawn');
  expect(localBoard()[3][3]).toBeNull();
  expect(localBoard()[2][3]?.color).toBe('white');
});
