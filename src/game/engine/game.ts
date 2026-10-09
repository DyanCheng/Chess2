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

    // Nhập thành
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

    // Bắt tốt qua đường
    if (piece.type === 'pawn' && from.col !== to.col && !targetPiece) {
      isEnPassant = true;
      targetPiece = grid[from.row][to.col];
      grid[from.row][to.col] = null;
    }

    // Phong cấp tốt
    let finalPieceType = piece.type;
    if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
      if (promotionType && ['queen', 'rook', 'bishop', 'knight'].includes(promotionType)) {
        finalPieceType = promotionType;
      } else {
        finalPieceType = 'queen';
      }
    }

    grid[to.row][to.col] = { ...piece, type: finalPieceType, hasMoved: true };
    grid[from.row][from.col] = null;

    const move: ChessMove = {
      from,
      to,
      piece,
      captured: targetPiece || undefined,
      isCastling,
      isEnPassant,
      promotion: finalPieceType !== piece.type ? finalPieceType : undefined,
      notation: `${piece.type}_${from.row}${from.col}->${to.row}${to.col}`,
      timestamp: Date.now(),
    };

    this.moveHistory.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
    return true;
  }

  public isGameOver(): boolean {
    return this.checkStalemate() || this.checkInsufficientMaterial();
  }

  public checkStalemate(): boolean {
    const grid = this.board.getGrid();
    const lastMove = this.moveHistory[this.moveHistory.length - 1];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = grid[r][c];
        if (piece && piece.color === this.currentTurn) {
          for (let tr = 0; tr < 8; tr++) {
            for (let tc = 0; tc < 8; tc++) {
              if (MoveValidator.isValidMove(grid, { row: r, col: c }, { row: tr, col: tc }, lastMove)) {
                return false;
              }
            }
          }
        }
      }
    }
    return true;
  }

  public checkInsufficientMaterial(): boolean {
    const grid = this.board.getGrid();
    const pieces: { type: string; color: string }[] = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = grid[r][c];
        if (piece) pieces.push({ type: piece.type, color: piece.color });
      }
    }

    if (pieces.length === 2) return true;
    if (pieces.length === 3) {
      return pieces.some((p) => p.type === 'knight' || p.type === 'bishop');
    }
    return false;
  }

  public serializeState(): string {
    return JSON.stringify({
      board: this.board.getGrid(),
      currentTurn: this.currentTurn,
      moveHistory: this.moveHistory,
    });
  }

  public restoreState(serializedData: string): boolean {
    try {
      const data = JSON.parse(serializedData);
      this.currentTurn = data.currentTurn;
      this.moveHistory = data.moveHistory;
      const grid = this.board.getGrid();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          grid[r][c] = data.board[r][c];
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
}