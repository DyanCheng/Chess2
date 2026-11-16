import { Chess } from 'chess.js';
import { BoardPosition, BoardState, ChessPiece, PieceType } from '../../types/chess';
import { toAlgebraic } from '../../utils/chessUtils';

export interface TacticalPuzzle {
  id: string;
  title: string;
  theme: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khó';
  fen: string;
  solution: string;
  prompt: string;
}

export const TACTICAL_PUZZLES: TacticalPuzzle[] = [
  {
    id: 'mate-in-one-1',
    title: 'Chiếu hết trong 1 nước',
    theme: 'Phối hợp Hậu và Tượng',
    difficulty: 'Dễ',
    fen: '3qk3/5ppp/8/7Q/2B5/8/8/4K3 w - - 0 1',
    solution: 'h5f7',
    prompt: 'Tìm nước đi chiếu hết của Trắng.',
  },
  {
    id: 'mate-in-one-2',
    title: 'Đòn chiếu hết hàng cuối',
    theme: 'Hậu khóa đường thoát',
    difficulty: 'Dễ',
    fen: '5K1k/8/3Q4/p3p3/8/8/8/8 w - - 0 1',
    solution: 'd6h6',
    prompt: 'Dùng Hậu để khóa Vua đen và chiếu hết.',
  },
  {
    id: 'mate-in-one-3',
    title: 'Vua phối hợp với Hậu',
    theme: 'Chiếu hết bằng Vua',
    difficulty: 'Trung bình',
    fen: '8/3p4/4Q1p1/8/8/8/2K5/k7 w - - 0 1',
    solution: 'e6a6',
    prompt: 'Tìm nước chiếu hết. Hãy chú ý các ô thoát của Vua đen.',
  },
  {
    id: 'mate-in-one-4',
    title: 'Hậu xuyên đường chéo',
    theme: 'Chiếu hết bằng đường chéo',
    difficulty: 'Trung bình',
    fen: '8/8/8/1p4Q1/6p1/3K4/8/3k4 w - - 0 1',
    solution: 'g5d2',
    prompt: 'Di chuyển Hậu để chiếu hết trong một nước.',
  },
  {
    id: 'mate-in-one-5',
    title: 'Đòn kết thúc',
    theme: 'Hậu chiếu hết',
    difficulty: 'Khó',
    fen: '8/8/2p4k/5K2/8/8/3p4/Q7 w - - 0 1',
    solution: 'a1h8',
    prompt: 'Tìm nước chiếu hết của Trắng.',
  },
];

export const DAILY_PUZZLE_FEN = TACTICAL_PUZZLES[0].fen;
export const DAILY_PUZZLE_SOLUTION = TACTICAL_PUZZLES[0].solution;

export const getPuzzleById = (id: string): TacticalPuzzle | null =>
  TACTICAL_PUZZLES.find(puzzle => puzzle.id === id) ?? null;

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
