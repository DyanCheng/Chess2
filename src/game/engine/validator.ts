import { BoardState, BoardPosition, ChessPiece, ChessMove } from './types';

export class MoveValidator {
  public static isWithinBounds(pos: BoardPosition): boolean {
    return pos.row >= 0 && pos.row < 8 && pos.col >= 0 && pos.col < 8;
  }

  public static isValidMove(board: BoardState, from: BoardPosition, to: BoardPosition, lastMove?: ChessMove): boolean {
    if (!this.isWithinBounds(from) || !this.isWithinBounds(to)) return false;
    const piece = board[from.row][from.col];
    if (!piece) return false;
    if (from.row === to.row && from.col === to.col) return false;

    const targetPiece = board[to.row][to.col];
    if (targetPiece && targetPiece.color === piece.color) return false;

    switch (piece.type) {
      case 'pawn':
        return this.isValidPawnMove(board, from, to, piece.color, lastMove);
      case 'knight':
        return this.isValidKnightMove(from, to);
      case 'rook':
        return this.isValidRookMove(board, from, to);
      case 'bishop':
        return this.isValidBishopMove(board, from, to);
      case 'queen':
        return this.isValidQueenMove(board, from, to);
      case 'king':
        return this.isValidKingMove(board, from, to) || this.isValidCastling(board, from, to, piece.color);
      default:
        return false;
    }
  }

  private static isValidKnightMove(from: BoardPosition, to: BoardPosition): boolean {
    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.col - to.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
  }

  private static isValidPawnMove(board: BoardState, from: BoardPosition, to: BoardPosition, color: 'white' | 'black', lastMove?: ChessMove): boolean {
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    // Đi thẳng 1 ô
    if (colDiff === 0 && rowDiff === direction && !board[to.row][to.col]) return true;

    // Đi thẳng 2 ô từ vạch xuất phát
    if (colDiff === 0 && rowDiff === direction * 2 && from.row === startRow && !board[to.row][to.col] && !board[from.row + direction][from.col]) return true;

    // Ăn quân chéo thường
    if (Math.abs(colDiff) === 1 && rowDiff === direction && board[to.row][to.col] && board[to.row][to.col]?.color !== color) return true;

    // GAME-009: Bắt tốt qua đường (En Passant)
    if (Math.abs(colDiff) === 1 && rowDiff === direction && !board[to.row][to.col]) {
      if (lastMove && lastMove.piece.type === 'pawn' && Math.abs(lastMove.to.row - lastMove.from.row) === 2) {
        if (lastMove.to.row === from.row && lastMove.to.col === to.col) {
          return true;
        }
      }
    }

    return false;
  }

  private static isValidRookMove(board: BoardState, from: BoardPosition, to: BoardPosition): boolean {
    if (from.row !== to.row && from.col !== to.col) return false;
    return this.isPathClear(board, from, to);
  }

  private static isValidBishopMove(board: BoardState, from: BoardPosition, to: BoardPosition): boolean {
    if (Math.abs(from.row - to.row) !== Math.abs(from.col - to.col)) return false;
    return this.isPathClear(board, from, to);
  }

  private static isValidQueenMove(board: BoardState, from: BoardPosition, to: BoardPosition): boolean {
    const isRookLike = from.row === to.row || from.col === to.col;
    const isBishopLike = Math.abs(from.row - to.row) === Math.abs(from.col - to.col);
    if (!isRookLike && !isBishopLike) return false;
    return this.isPathClear(board, from, to);
  }

  private static isValidKingMove(from: BoardPosition, to: BoardPosition): boolean {
    const rowDiff = Math.abs(from.row - to.row);
    const colDiff = Math.abs(from.col - to.col);
    return rowDiff <= 1 && colDiff <= 1;
  }

  // GAME-008: Kiểm tra nhập thành (Castling)
  private static isValidCastling(board: BoardState, from: BoardPosition, to: BoardPosition, color: 'white' | 'black'): boolean {
    const row = color === 'white' ? 7 : 0;
    if (from.row !== row || to.row !== row) return false;

    const king = board[from.row][from.col];
    if (!king || king.hasMoved) return false;

    // Nhập thành cánh vua (King-side)
    if (to.col === 6) {
      const rook = board[row][7];
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
      if (board[row][5] !== null || board[row][6] !== null) return false;
      return true;
    }

    // Nhập thành cánh hậu (Queen-side)
    if (to.col === 2) {
      const rook = board[row][0];
      if (!rook || rook.type !== 'rook' || rook.hasMoved) return false;
      if (board[row][1] !== null || board[row][2] !== null || board[row][3] !== null) return false;
      return true;
    }

    return false;
  }

  private static isPathClear(board: BoardState, from: BoardPosition, to: BoardPosition): boolean {
    const rowStep = Math.sign(to.row - from.row);
    const colStep = Math.sign(to.col - from.col);
    let currentRow = from.row + rowStep;
    let currentCol = from.col + colStep;

    while (currentRow !== to.row || currentCol !== to.col) {
      if (board[currentRow][currentCol] !== null) return false;
      currentRow += rowStep;
      currentCol += colStep;
    }
    return true;
  }
}