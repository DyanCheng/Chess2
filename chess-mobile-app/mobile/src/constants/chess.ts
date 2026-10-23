// ============================================================
// Chess Constants - Initial board, piece values, HP damage
// ============================================================

import { BoardState, PieceType } from '../types/chess';

/** Unicode chess piece symbols for rendering */
export const PIECE_SYMBOLS: Record<PieceType, { white: string; black: string }> = {
  king:   { white: '♔', black: '♚' },
  queen:  { white: '♕', black: '♛' },
  rook:   { white: '♖', black: '♜' },
  bishop: { white: '♗', black: '♝' },
  knight: { white: '♘', black: '♞' },
  pawn:   { white: '♙', black: '♟' },
};

/** Point value of each piece (used for HP damage calculation) */
export const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0, // King cannot be captured
};

/** HP damage when a piece is captured = piece value * multiplier */
export const HP_DAMAGE_MULTIPLIER = 2;

/** Initial HP for each player */
export const INITIAL_HP = 40;

/** Max HP cap */
export const MAX_HP = 50;

/** Board column labels */
export const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

/** Board row labels */
export const ROWS = ['8', '7', '6', '5', '4', '3', '2', '1'];

/** Board size */
export const BOARD_SIZE = 8;

/** Square size will be calculated based on screen width */
export const BOARD_PADDING = 4;

/** Initial chess board setup */
export const INITIAL_BOARD: BoardState = [
  // Row 0 (rank 8) - Black back rank
  [
    { type: 'rook',   color: 'black', id: 'br1' },
    { type: 'knight', color: 'black', id: 'bn1' },
    { type: 'bishop', color: 'black', id: 'bb1' },
    { type: 'queen',  color: 'black', id: 'bq'  },
    { type: 'king',   color: 'black', id: 'bk'  },
    { type: 'bishop', color: 'black', id: 'bb2' },
    { type: 'knight', color: 'black', id: 'bn2' },
    { type: 'rook',   color: 'black', id: 'br2' },
  ],
  // Row 1 (rank 7) - Black pawns
  [
    { type: 'pawn', color: 'black', id: 'bp1' },
    { type: 'pawn', color: 'black', id: 'bp2' },
    { type: 'pawn', color: 'black', id: 'bp3' },
    { type: 'pawn', color: 'black', id: 'bp4' },
    { type: 'pawn', color: 'black', id: 'bp5' },
    { type: 'pawn', color: 'black', id: 'bp6' },
    { type: 'pawn', color: 'black', id: 'bp7' },
    { type: 'pawn', color: 'black', id: 'bp8' },
  ],
  // Rows 2-5 - Empty squares
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  // Row 6 (rank 2) - White pawns
  [
    { type: 'pawn', color: 'white', id: 'wp1' },
    { type: 'pawn', color: 'white', id: 'wp2' },
    { type: 'pawn', color: 'white', id: 'wp3' },
    { type: 'pawn', color: 'white', id: 'wp4' },
    { type: 'pawn', color: 'white', id: 'wp5' },
    { type: 'pawn', color: 'white', id: 'wp6' },
    { type: 'pawn', color: 'white', id: 'wp7' },
    { type: 'pawn', color: 'white', id: 'wp8' },
  ],
  // Row 7 (rank 1) - White back rank
  [
    { type: 'rook',   color: 'white', id: 'wr1' },
    { type: 'knight', color: 'white', id: 'wn1' },
    { type: 'bishop', color: 'white', id: 'wb1' },
    { type: 'queen',  color: 'white', id: 'wq'  },
    { type: 'king',   color: 'white', id: 'wk'  },
    { type: 'bishop', color: 'white', id: 'wb2' },
    { type: 'knight', color: 'white', id: 'wn2' },
    { type: 'rook',   color: 'white', id: 'wr2' },
  ],
];
