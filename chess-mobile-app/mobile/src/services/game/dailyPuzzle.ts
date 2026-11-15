import { Chess } from 'chess.js';
import { BoardPosition, BoardState, ChessPiece, PieceType } from '../../types/chess';
import { toAlgebraic } from '../../utils/chessUtils';

export const DAILY_PUZZLE_FEN = '3qk3/5ppp/8/7Q/2B5/8/8/4K3 w - - 0 1';
export const DAILY_PUZZLE_SOLUTION = 'h5f7';

const PIECE_TYPES: Record<string, PieceType> = {
  k: 'king',
  q: 'queen',
  r: 'rook',
  b: 'bishop',
  n: 'knight',
  p: 'pawn',
};

const toPosition = (square: string): BoardPosition => ({
  row: 8 - Number(square[1]),
  col: square.charCodeAt(0) - 97,
});

export const getDailyPuzzleBoard = (fen: string): BoardState => {
  const chess = new Chess(fen);
  return chess.board().map(row => row.map(piece => {
    if (!piece) return null;
    const chessPiece: ChessPiece = {
      id: `${piece.color}_${piece.type}_${piece.square}`,
      type: PIECE_TYPES[piece.type],
      color: piece.color === 'w' ? 'white' : 'black',
    };
    return chessPiece;
  }));
};

export const getDailyPuzzleLegalMoves = (fen: string, from: BoardPosition): BoardPosition[] => {
  const chess = new Chess(fen);
  const fromSquare = toAlgebraic(from);
  return chess.moves({ verbose: true })
    .filter(move => move.from === fromSquare)
    .map(move => toPosition(move.to));
};

export const playDailyPuzzleMove = (
  fen: string,
  from: BoardPosition,
  to: BoardPosition,
): { fen: string; uci: string; isCheckmate: boolean } | null => {
  const chess = new Chess(fen);
  const fromSquare = toAlgebraic(from);
  const toSquare = toAlgebraic(to);
  const isLegal = chess.moves({ verbose: true })
    .some(move => move.from === fromSquare && move.to === toSquare);

  if (!isLegal) return null;

  const move = chess.move({ from: fromSquare, to: toSquare, promotion: 'q' });
  return {
    fen: chess.fen(),
    uci: `${move.from}${move.to}`,
    isCheckmate: chess.isCheckmate(),
  };
};
