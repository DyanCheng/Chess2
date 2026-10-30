import { Chess } from 'chess.js';
import { BoardPosition, BoardState, ChessMove, ChessPiece, PieceColor, PieceType } from '../../types/chess';
import { toAlgebraic } from '../../utils/chessUtils';

const pieceTypes: Record<string, PieceType> = {
  k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
};

let chess = new Chess();

export function resetLocalChess() {
  chess = new Chess();
}

export function localBoard(): BoardState {
  return chess.board().map(row => row.map(piece => piece ? {
    id: `${piece.color}_${piece.type}_${piece.square}`,
    type: pieceTypes[piece.type],
    color: piece.color === 'w' ? 'white' : 'black',
  } : null));
}

export function localTurn(): PieceColor {
  return chess.turn() === 'w' ? 'white' : 'black';
}

export function localLegalMoves(from: BoardPosition): BoardPosition[] {
  return chess.moves({ square: toAlgebraic(from) as any, verbose: true })
    .map(move => ({ row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97 }));
}

export function localBotMoves(color: PieceColor): Array<{ from: BoardPosition; to: BoardPosition }> {
  if (localTurn() !== color) return [];
  return chess.moves({ verbose: true }).map(move => ({
    from: { row: 8 - Number(move.from[1]), col: move.from.charCodeAt(0) - 97 },
    to: { row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97 },
  }));
}

export function applyLocalMove(from: BoardPosition, to: BoardPosition): {
  board: BoardState;
  captured: ChessPiece | null;
  move: ChessMove;
  inCheck: boolean;
  checkmate: boolean;
  draw: boolean;
} | null {
  const before = localBoard();
  const piece = before[from.row]?.[from.col];
  if (!piece) return null;

  let result;
  try {
    result = chess.move({ from: toAlgebraic(from), to: toAlgebraic(to), promotion: 'q' });
  } catch {
    return null;
  }
  if (!result) return null;

  const captured = result.captured
    ? before[to.row][to.col] || before[from.row][to.col]
    : null;
  return {
    board: localBoard(),
    captured,
    move: {
      from, to, piece, captured: captured || undefined,
      isCheck: chess.isCheck(),
      isCheckmate: chess.isCheckmate(),
      isCastling: result.flags.includes('k') || result.flags.includes('q'),
      isEnPassant: result.flags.includes('e'),
      promotion: result.promotion ? pieceTypes[result.promotion] : undefined,
      notation: result.san,
      timestamp: Date.now(),
    },
    inCheck: chess.isCheck(),
    checkmate: chess.isCheckmate(),
    draw: chess.isDraw(),
  };
}
