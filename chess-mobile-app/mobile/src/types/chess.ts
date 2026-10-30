// ============================================================
// Chess Type Definitions
// ============================================================

export type PieceColor = 'white' | 'black';

export type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  id: string;
  hasMoved?: boolean;
  /** Skin ID for custom piece appearance */
  skinId?: string;
}

export interface BoardPosition {
  row: number; // 0-7 (top to bottom)
  col: number; // 0-7 (left to right)
}

export interface ChessMove {
  from: BoardPosition;
  to: BoardPosition;
  piece: ChessPiece;
  captured?: ChessPiece;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isCastling?: boolean;
  isEnPassant?: boolean;
  promotion?: PieceType;
  notation: string;
  timestamp: number;
}

export type BoardState = (ChessPiece | null)[][];

export interface MoveValidation {
  isValid: boolean;
  validMoves: BoardPosition[];
}

export interface GameResult {
  winner: PieceColor | 'draw';
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'timeout' | 'hp_depleted' | 'disconnect';
}

export interface PieceSkin {
  id: string;
  name: string;
  previewImage: string;
  pieces: Record<PieceType, { white: string; black: string }>;
  price: number;
  currencyType: 'gold' | 'gems';
  isOwned: boolean;
  isEquipped: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
