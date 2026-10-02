import { Board } from './board';
import { MoveValidator } from './validator';
import { BoardPosition, ChessMove, PieceColor, BoardState, PieceType } from './types';

export class ChessGame {
  private board: Board;
  private currentTurn: PieceColor;
  private moveHistory: ChessMove[];

  constructor() {
    this.board = new Board();
    this.currentTurn = 'white';
    this.moveHistory = [];
  }

  public getBoardGrid(): BoardState {
    return this.board.getGrid();
  }

  public getCurrentTurn(): PieceColor {
    return this.currentTurn;
  }

  public getMoveHistory(): ChessMove[] {
    return this.moveHistory;
  }

  public makeMove(from: BoardPosition, to: BoardPosition, promotionType?: PieceType): boolean {
    const grid = this.board.getGrid();
    const piece = grid[from.row][from.col];
    if (!piece) return false;
    if (piece.color !== this.currentTurn) return false;

    const lastMove = this.moveHistory[this.moveHistory.length - 1];
    if (!MoveValidator.isValidMove(grid, from, to, lastMove)) return false;

    let targetPiece = grid[to.row][to.col];
    let isCastling = false;
    let isEnPassant = false;

    // Xử lý logic Nhập thành (Castling)
    if (piece.type === 'king' && Math.abs(to.col - from.col) === 2) {
      isCastling = true;
      const rookCol = to.col > from.col ? 7 : 0;
      const newRookCol = to.col > from.col ? 5 : 3;
      const rook = grid[from.row][rookCol];
      if (rook) {
        grid[from.row][newRookCol] = { ...rook, hasMoved: true };
        grid[from.row][rookCol] = null;
      }
    }

    // Xử lý logic Bắt tốt qua đường (En Passant)
    if (piece.type === 'pawn' && from.col !== to.col && !targetPiece) {
      isEnPassant = true;
      const capturedPawnRow = from.row;
      const capturedPawnCol = to.col;
      targetPiece = grid[capturedPawnRow][capturedPawnCol];
      grid[capturedPawnRow][capturedPawnCol] = null;
    }

    // Xử lý phong cấp tốt (GAME-010: Pawn promotion)
    let finalPieceType = piece.type;
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      if (promotionType && ['queen', 'rook', 'bishop', 'knight'].includes(promotionType)) {
        finalPieceType = promotionType;
      } else {
        finalPieceType = 'queen'; // Mặc định phong Hậu nếu không truyền lên
      }
    }

    // Di chuyển quân cờ chính
    grid[to.row][to.col] = {
      ...piece,
      type: finalPieceType,
      hasMoved: true
    };
    grid[from.row][from.col] = null;

    // Ghi nhận lịch sử nước đi
    const move: ChessMove = {
      from,
      to,
      piece,
      captured: targetPiece || undefined,
      isCastling,
      isEnPassant,
      promotion: finalPieceType !== piece.type ? finalPieceType : undefined,
      notation: `${piece.type}_${from.row}${from.col}->${to.row}${to.col}`,
      timestamp: Date.now()
    };

    this.moveHistory.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    return true;
  }
}