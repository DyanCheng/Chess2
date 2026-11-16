import { Chess } from 'chess.js';
import { BoardPosition, BoardState, ChessMove, ChessPiece, PieceColor, PieceType } from '../../types/chess';
import { toAlgebraic } from '../../utils/chessUtils';

const pieceTypes: Record<string, PieceType> = {
  k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn',
};

let chess = new Chess();

export interface LocalMoveRules {
  frozenSquares?: string[];
  protectedSquares?: string[];
  pawnStepSquares?: string[];
  pawnBackwardColors?: PieceColor[];
  transformers?: Array<{ square: string; types: PieceType[] }>;
}

export function resetLocalChess() {
  chess = new Chess();
}

export function replaceLocalPosition(board: BoardState, turn: PieceColor): void {
  chess.load(localFen(board, turn));
}

function localFen(board: BoardState, turn: PieceColor): string {
  const symbols: Record<PieceType, string> = {
    pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k',
  };
  const rows = board.map(row => {
    let empty = 0;
    let encoded = '';
    for (const piece of row) {
      if (!piece) {
        empty += 1;
        continue;
      }
      if (empty) {
        encoded += String(empty);
        empty = 0;
      }
      const symbol = symbols[piece.type];
      encoded += piece.color === 'white' ? symbol.toUpperCase() : symbol;
    }
    if (empty) encoded += String(empty);
    return encoded;
  });
  return `${rows.join('/')} ${turn === 'white' ? 'w' : 'b'} - - 0 1`;
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

export function localLegalMoves(from: BoardPosition, rules: LocalMoveRules = {}): BoardPosition[] {
  const fromSquare = toAlgebraic(from);
  if (rules.frozenSquares?.includes(fromSquare)) return [];
  const ordinary = chess.moves({ square: fromSquare as any, verbose: true })
    .map(move => ({ row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97 }));
  const filtered = ordinary.filter(move => !rules.protectedSquares?.includes(toAlgebraic(move)));
  const piece = chess.board()[from.row]?.[from.col];
  const board = localBoard();
  const transformer = rules.transformers?.find(item => item.square === fromSquare);
  if (piece && transformer) {
    const extraMoves: BoardPosition[] = [];
    for (const type of transformer.types) {
      const simulatedBoard = board.map(line => line.map(item => item ? { ...item } : null));
      simulatedBoard[from.row][from.col] = { ...simulatedBoard[from.row][from.col]!, type };
      try {
        const simulated = new Chess(localFen(simulatedBoard, localTurn()));
        simulated.moves({ square: fromSquare as any, verbose: true }).forEach(move => {
          const target = { row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97 };
          if (!rules.protectedSquares?.includes(toAlgebraic(target))) extraMoves.push(target);
        });
      } catch {
        continue;
      }
    }
    return [...new Map([...filtered, ...extraMoves].map(move => [`${move.row},${move.col}`, move])).values()];
  }
  if (!piece || piece.type !== 'p') return filtered;

  const color: PieceColor = piece.color === 'w' ? 'white' : 'black';
  const direction = color === 'white' ? -1 : 1;
  const extraTargets: BoardPosition[] = [];
  const addIfSafe = (row: number, col: number, capture: boolean) => {
    if (row < 0 || row > 7 || col < 0 || col > 7) return;
    if (rules.protectedSquares?.includes(toAlgebraic({ row, col }))) return;
    const target = board[row][col];
    if (capture ? !target || target.color === color : !!target) return;
    const next = board.map(line => line.slice());
    next[row][col] = next[from.row][from.col];
    next[from.row][from.col] = null;
    try {
      const validation = new Chess();
      const fen = localFen(next, color);
      validation.load(fen);
      if (!validation.isCheck()) extraTargets.push({ row, col });
    } catch {
      return;
    }
  };

  if (
    rules.pawnStepSquares?.includes(fromSquare) &&
    from.row + direction * 2 >= 0 &&
    from.row + direction * 2 < 8 &&
    !board[from.row + direction][from.col] &&
    !board[from.row + direction * 2][from.col]
  ) {
    addIfSafe(from.row + direction * 2, from.col, false);
  }
  if (rules.pawnBackwardColors?.includes(color)) {
    addIfSafe(from.row - direction, from.col, false);
    addIfSafe(from.row - direction, from.col - 1, true);
    addIfSafe(from.row - direction, from.col + 1, true);
  }
  return [...filtered, ...extraTargets];
}

export function localBotMoves(color: PieceColor, rules: LocalMoveRules = {}): Array<{ from: BoardPosition; to: BoardPosition }> {
  if (localTurn() !== color) return [];
  const moves: Array<{ from: BoardPosition; to: BoardPosition }> = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = chess.board()[row][col];
      if (!piece || piece.color !== (color === 'white' ? 'w' : 'b')) continue;
      const from = { row, col };
      for (const to of localLegalMoves(from, rules)) moves.push({ from, to });
    }
  }
  return moves;
}

export function applyLocalMove(from: BoardPosition, to: BoardPosition, rules: LocalMoveRules = {}): {
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
  if (!localLegalMoves(from, rules).some(move => move.row === to.row && move.col === to.col)) return null;

  let result;
  try {
    result = chess.move({ from: toAlgebraic(from), to: toAlgebraic(to), promotion: 'q' });
  } catch {
    result = null;
  }
  if (!result) {
    const next = before.map(row => row.slice());
    const capturedPiece = next[to.row][to.col];
    next[to.row][to.col] = piece;
    next[from.row][from.col] = null;
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      next[to.row][to.col] = { ...piece, type: 'queen' };
    }
    const nextTurn = piece.color === 'white' ? 'black' : 'white';
    chess.load(localFen(next, nextTurn));
    const captured = capturedPiece || null;
    return {
      board: localBoard(),
      captured,
      move: {
        from, to, piece, captured: captured || undefined,
        isCheck: chess.isCheck(),
        isCheckmate: chess.isCheckmate(),
        isCastling: false,
        isEnPassant: false,
        promotion: next[to.row][to.col]?.type === 'queen' && piece.type === 'pawn' ? 'queen' : undefined,
        notation: `${toAlgebraic(from)}-${toAlgebraic(to)}`,
        timestamp: Date.now(),
      },
      inCheck: chess.isCheck(),
      checkmate: chess.isCheckmate(),
      draw: chess.isDraw(),
    };
  }

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
