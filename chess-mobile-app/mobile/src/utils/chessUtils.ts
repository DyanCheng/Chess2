// ============================================================
// Chess Utilities - Move validation, board logic
// ============================================================

import { BoardPosition, BoardState, ChessPiece, ChessMove, MoveValidation, PieceColor, PieceType } from '../types/chess';
import { BOARD_SIZE, PIECE_VALUES, HP_DAMAGE_MULTIPLIER } from '../constants/chess';

/**
 * Deep clone the board state
 */
export function cloneBoard(board: BoardState): BoardState {
  return board.map(row => row.map(piece => piece ? { ...piece } : null));
}

/**
 * Check if position is within board bounds
 */
export function isInBounds(pos: BoardPosition): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

/**
 * Get piece at position
 */
export function getPieceAt(board: BoardState, pos: BoardPosition): ChessPiece | null {
  if (!isInBounds(pos)) return null;
  return board[pos.row][pos.col];
}

/**
 * Convert board position to algebraic notation
 */
export function toAlgebraic(pos: BoardPosition): string {
  const col = String.fromCharCode(97 + pos.col); // a-h
  const row = (BOARD_SIZE - pos.row).toString();  // 1-8
  return `${col}${row}`;
}

/**
 * Convert algebraic notation to board position
 */
export function fromAlgebraic(notation: string): BoardPosition {
  const col = notation.charCodeAt(0) - 97;
  const row = BOARD_SIZE - parseInt(notation[1]);
  return { row, col };
}

/**
 * Get all valid moves for a piece at the given position
 */
export function getValidMoves(board: BoardState, pos: BoardPosition): BoardPosition[] {
  const piece = getPieceAt(board, pos);
  if (!piece) return [];

  let moves: BoardPosition[] = [];

  switch (piece.type) {
    case 'pawn':
      moves = getPawnMoves(board, pos, piece.color);
      break;
    case 'knight':
      moves = getKnightMoves(board, pos, piece.color);
      break;
    case 'bishop':
      moves = getBishopMoves(board, pos, piece.color);
      break;
    case 'rook':
      moves = getRookMoves(board, pos, piece.color);
      break;
    case 'queen':
      moves = getQueenMoves(board, pos, piece.color);
      break;
    case 'king':
      moves = getKingMoves(board, pos, piece.color);
      break;
  }

  // Filter moves that would leave king in check
  return moves.filter(move => !wouldBeInCheck(board, pos, move, piece.color));
}

/**
 * Get pawn moves (including en passant and double move)
 */
function getPawnMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  const moves: BoardPosition[] = [];
  const direction = color === 'white' ? -1 : 1;
  const startRow = color === 'white' ? 6 : 1;

  // Forward move
  const forward: BoardPosition = { row: pos.row + direction, col: pos.col };
  if (isInBounds(forward) && !getPieceAt(board, forward)) {
    moves.push(forward);

    // Double move from starting position
    if (pos.row === startRow) {
      const doubleForward: BoardPosition = { row: pos.row + 2 * direction, col: pos.col };
      if (!getPieceAt(board, doubleForward)) {
        moves.push(doubleForward);
      }
    }
  }

  // Diagonal captures
  for (const dc of [-1, 1]) {
    const capture: BoardPosition = { row: pos.row + direction, col: pos.col + dc };
    if (isInBounds(capture)) {
      const target = getPieceAt(board, capture);
      if (target && target.color !== color) {
        moves.push(capture);
      }
    }
  }

  return moves;
}

/**
 * Get knight moves
 */
function getKnightMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  const moves: BoardPosition[] = [];
  const offsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];

  for (const [dr, dc] of offsets) {
    const target: BoardPosition = { row: pos.row + dr, col: pos.col + dc };
    if (isInBounds(target)) {
      const piece = getPieceAt(board, target);
      if (!piece || piece.color !== color) {
        moves.push(target);
      }
    }
  }

  return moves;
}

/**
 * Get sliding moves (bishop, rook, queen helper)
 */
function getSlidingMoves(
  board: BoardState,
  pos: BoardPosition,
  color: PieceColor,
  directions: [number, number][]
): BoardPosition[] {
  const moves: BoardPosition[] = [];

  for (const [dr, dc] of directions) {
    let current: BoardPosition = { row: pos.row + dr, col: pos.col + dc };

    while (isInBounds(current)) {
      const piece = getPieceAt(board, current);
      if (!piece) {
        moves.push({ ...current });
      } else {
        if (piece.color !== color) {
          moves.push({ ...current });
        }
        break;
      }
      current = { row: current.row + dr, col: current.col + dc };
    }
  }

  return moves;
}

function getBishopMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  return getSlidingMoves(board, pos, color, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
}

function getRookMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  return getSlidingMoves(board, pos, color, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
}

function getQueenMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  return [
    ...getBishopMoves(board, pos, color),
    ...getRookMoves(board, pos, color),
  ];
}

function getKingMoves(board: BoardState, pos: BoardPosition, color: PieceColor): BoardPosition[] {
  const moves: BoardPosition[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const target: BoardPosition = { row: pos.row + dr, col: pos.col + dc };
      if (isInBounds(target)) {
        const piece = getPieceAt(board, target);
        if (!piece || piece.color !== color) {
          moves.push(target);
        }
      }
    }
  }
  return moves;
}

/**
 * Find king position
 */
export function findKing(board: BoardState, color: PieceColor): BoardPosition | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.type === 'king' && piece.color === color) {
        return { row, col };
      }
    }
  }
  return null;
}

/**
 * Check if king is in check
 */
export function isInCheck(board: BoardState, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const opponentColor = color === 'white' ? 'black' : 'white';

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === opponentColor) {
        const rawMoves = getRawMoves(board, { row, col }, piece);
        if (rawMoves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get raw moves without checking for check (prevents infinite recursion)
 */
function getRawMoves(board: BoardState, pos: BoardPosition, piece: ChessPiece): BoardPosition[] {
  switch (piece.type) {
    case 'pawn': return getPawnMoves(board, pos, piece.color);
    case 'knight': return getKnightMoves(board, pos, piece.color);
    case 'bishop': return getBishopMoves(board, pos, piece.color);
    case 'rook': return getRookMoves(board, pos, piece.color);
    case 'queen': return getQueenMoves(board, pos, piece.color);
    case 'king': return getKingMoves(board, pos, piece.color);
    default: return [];
  }
}

/**
 * Check if a move would leave the king in check
 */
function wouldBeInCheck(board: BoardState, from: BoardPosition, to: BoardPosition, color: PieceColor): boolean {
  const testBoard = cloneBoard(board);
  testBoard[to.row][to.col] = testBoard[from.row][from.col];
  testBoard[from.row][from.col] = null;
  return isInCheck(testBoard, color);
}

/**
 * Check if player is in checkmate
 */
export function isCheckmate(board: BoardState, color: PieceColor): boolean {
  if (!isInCheck(board, color)) return false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col });
        if (validMoves.length > 0) return false;
      }
    }
  }

  return true;
}

/**
 * Check if position is a stalemate
 */
export function isStalemate(board: BoardState, color: PieceColor): boolean {
  if (isInCheck(board, color)) return false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, { row, col });
        if (validMoves.length > 0) return false;
      }
    }
  }

  return true;
}

/**
 * Execute a move on the board and return new board state
 */
export function executeMove(board: BoardState, from: BoardPosition, to: BoardPosition): {
  newBoard: BoardState;
  captured: ChessPiece | null;
  move: Partial<ChessMove>;
} {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.row][from.col];
  const captured = newBoard[to.row][to.col];

  if (!piece) {
    return { newBoard, captured: null, move: {} };
  }

  // Execute the move
  newBoard[to.row][to.col] = { ...piece, hasMoved: true };
  newBoard[from.row][from.col] = null;

  // Check for pawn promotion
  const isPromotion = piece.type === 'pawn' &&
    ((piece.color === 'white' && to.row === 0) || (piece.color === 'black' && to.row === 7));

  if (isPromotion) {
    newBoard[to.row][to.col] = { ...piece, type: 'queen', hasMoved: true };
  }

  const opponentColor = piece.color === 'white' ? 'black' : 'white';

  return {
    newBoard,
    captured,
    move: {
      from,
      to,
      piece,
      captured: captured || undefined,
      isCheck: isInCheck(newBoard, opponentColor),
      isCheckmate: isCheckmate(newBoard, opponentColor),
      promotion: isPromotion ? 'queen' : undefined,
      notation: getMoveNotation(piece, from, to, !!captured, isInCheck(newBoard, opponentColor)),
      timestamp: Date.now(),
    },
  };
}

/**
 * Generate move notation
 */
function getMoveNotation(
  piece: ChessPiece,
  from: BoardPosition,
  to: BoardPosition,
  isCapture: boolean,
  isCheck: boolean
): string {
  const pieceSymbols: Record<PieceType, string> = {
    king: 'K', queen: 'Q', rook: 'R', bishop: 'B', knight: 'N', pawn: '',
  };
  const symbol = pieceSymbols[piece.type];
  const capture = isCapture ? 'x' : '';
  const target = toAlgebraic(to);
  const check = isCheck ? '+' : '';

  if (piece.type === 'pawn' && isCapture) {
    return `${String.fromCharCode(97 + from.col)}x${target}${check}`;
  }

  return `${symbol}${capture}${target}${check}`;
}

/**
 * Calculate HP damage from capturing a piece
 */
export function calculateHPDamage(capturedPiece: ChessPiece, damageMultiplier: number = 1): number {
  return PIECE_VALUES[capturedPiece.type] * HP_DAMAGE_MULTIPLIER * damageMultiplier;
}
