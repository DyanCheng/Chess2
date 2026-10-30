export const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Điểm thưởng vị trí ưu tiên kiểm soát trung tâm bàn cờ (8x8)
const CENTER_BONUS: number[][] = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [5, 10, 20, 25, 25, 20, 10,  5],
  [5, 15, 25, 35, 35, 25, 15,  5],
  [5, 15, 25, 35, 35, 25, 15,  5],
  [5, 10, 20, 25, 25, 20, 10,  5],
  [5, 10, 10, 10, 10, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0],
];

/**
 * Đánh giá điểm số bàn cờ theo góc nhìn của phe botColor ('w' hoặc 'b')
 */
export function evaluateBoard(
  board: any[][],
  botColor: 'w' | 'b' = 'b',
): number {
  if (!Array.isArray(board)) return 0;

  let score = 0;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r]?.[c];
      if (!cell) continue;

      let type = '';
      let color: 'w' | 'b' = 'w';

      if (typeof cell === 'string') {
        type = cell.toLowerCase();
        color = cell === cell.toUpperCase() ? 'w' : 'b';
      } else if (typeof cell === 'object') {
        type = String(cell.type || '').toLowerCase();
        const rawColor = String(cell.color || '').toLowerCase();
        color = rawColor.startsWith('b') ? 'b' : 'w';
      }

      const baseValue = PIECE_VALUES[type] || 0;
      const positional = CENTER_BONUS[r]?.[c] || 0;
      const totalPieceScore = baseValue + positional;

      if (color === botColor) {
        score += totalPieceScore;
      } else {
        score -= totalPieceScore;
      }
    }
  }

  return score;
}