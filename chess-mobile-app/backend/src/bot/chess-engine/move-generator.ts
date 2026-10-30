export interface GeneratedMove {
  from: string;
  to: string;
  promotion?: string;
  captured?: string;
  piece?: string;
  scoreHint?: number;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const PIECE_CODES: Record<string, string> = {
  pawn: 'p', knight: 'n', bishop: 'b', rook: 'r', queen: 'q', king: 'k',
  p: 'p', n: 'n', b: 'b', r: 'r', q: 'q', k: 'k',
};
const PROMOTION_TYPES: Record<string, string> = {
  q: 'queen', r: 'rook', b: 'bishop', n: 'knight',
};

export function coordsToSquare(row: number, col: number): string {
  return `${FILES[col]}${8 - row}`;
}

export function squareToCoords(square: string): { row: number; col: number } {
  const col = FILES.indexOf(square[0].toLowerCase());
  const row = 8 - parseInt(square[1], 10);
  return { row, col };
}

export function parseCell(cell: any): { type: string; color: 'w' | 'b' } | null {
  if (!cell) return null;
  if (typeof cell === 'string') {
    const trimmed = cell.trim();
    if (!trimmed) return null;
    const rawType = trimmed.toLowerCase();
    return {
      type: PIECE_CODES[rawType] || rawType,
      color: trimmed === trimmed.toUpperCase() ? 'w' : 'b',
    };
  }
  if (typeof cell === 'object' && cell.type) {
    const rawColor = String(cell.color || 'w').toLowerCase();
    const rawType = String(cell.type).toLowerCase();
    return {
      type: PIECE_CODES[rawType] || rawType,
      color: rawColor.startsWith('b') ? 'b' : 'w',
    };
  }
  return null;
}

export function cloneBoard(board: any[][]): any[][] {
  return board.map((row) =>
    row.map((cell) => (cell && typeof cell === 'object' ? { ...cell } : cell)),
  );
}

export function applyMoveOnBoard(board: any[][], move: GeneratedMove): any[][] {
  const next = cloneBoard(board);
  const from = squareToCoords(move.from);
  const to = squareToCoords(move.to);
  const movingPiece = next[from.row]?.[from.col];
  if (!movingPiece) return next;

  next[from.row][from.col] = null;

  const parsed = parseCell(movingPiece);
  if (parsed && parsed.type === 'p' && (to.row === 0 || to.row === 7)) {
    const promo = move.promotion || 'q';
    if (typeof movingPiece === 'string') {
      next[to.row][to.col] = parsed.color === 'w' ? promo.toUpperCase() : promo.toLowerCase();
    } else {
      next[to.row][to.col] = { ...movingPiece, type: PROMOTION_TYPES[promo] || promo };
    }
  } else {
    next[to.row][to.col] = movingPiece;
  }

  return next;
}

function isInside(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

/**
 * Sinh các nước đi giả hợp lệ (pseudo-legal) cho tất cả quân của phe `turn`
 */
export function generatePseudoMovesFromBoard(
  board: any[][],
  turn: 'w' | 'b',
): GeneratedMove[] {
  const moves: GeneratedMove[] = [];
  if (!Array.isArray(board) || board.length < 8) return moves;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = parseCell(board[r]?.[c]);
      if (!piece || piece.color !== turn) continue;

      const from = coordsToSquare(r, c);

      const addCandidate = (tr: number, tc: number) => {
        if (!isInside(tr, tc)) return false;
        const target = parseCell(board[tr][tc]);
        if (target && target.color === turn) return false; // Chặn bởi quân mình

        const to = coordsToSquare(tr, tc);
        const isPromotion = piece.type === 'p' && (tr === 0 || tr === 7);
        moves.push({
          from,
          to,
          piece: piece.type,
          captured: target?.type,
          promotion: isPromotion ? 'q' : undefined,
        });
        return !target; // Tiếp tục trượt nếu ô trống
      };

      if (piece.type === 'p') {
        const dir = turn === 'w' ? -1 : 1;
        const startRow = turn === 'w' ? 6 : 1;

        // Đi thẳng 1 ô
        if (isInside(r + dir, c) && !parseCell(board[r + dir][c])) {
          addCandidate(r + dir, c);
          // Đi thẳng 2 ô từ vị trí xuất phát
          if (r === startRow && isInside(r + dir * 2, c) && !parseCell(board[r + dir * 2][c])) {
            addCandidate(r + dir * 2, c);
          }
        }
        // Ăn chéo
        for (const dc of [-1, 1]) {
          if (isInside(r + dir, c + dc)) {
            const target = parseCell(board[r + dir][c + dc]);
            if (target && target.color !== turn) {
              addCandidate(r + dir, c + dc);
            }
          }
        }
      } else if (piece.type === 'n') {
        const jumps = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2],  [1, 2],  [2, -1],  [2, 1],
        ];
        for (const [dr, dc] of jumps) addCandidate(r + dr, c + dc);
      } else if (piece.type === 'k') {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr !== 0 || dc !== 0) addCandidate(r + dr, c + dc);
          }
        }
      } else {
        const dirs: number[][] = [];
        if (piece.type === 'b' || piece.type === 'q') {
          dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
        }
        if (piece.type === 'r' || piece.type === 'q') {
          dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
        }
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (isInside(nr, nc)) {
            const canContinue = addCandidate(nr, nc);
            if (!canContinue) break;
            nr += dr;
            nc += dc;
          }
        }
      }
    }
  }

  return moves;
}

export function findKingSquare(board: any[][], color: 'w' | 'b'): string | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = parseCell(board[r]?.[c]);
      if (p && p.color === color && p.type === 'k') {
        return coordsToSquare(r, c);
      }
    }
  }
  return null;
}

export function isKingInCheckOnBoard(board: any[][], color: 'w' | 'b'): boolean {
  const kingSq = findKingSquare(board, color);
  if (!kingSq) return true; // Mất vua coi như bị ăn
  const opponent: 'w' | 'b' = color === 'w' ? 'b' : 'w';
  const opponentMoves = generatePseudoMovesFromBoard(board, opponent);
  return opponentMoves.some((m) => m.to === kingSq);
}

/**
 * Sinh danh sách các nước đi hợp lệ (không để Vua phe mình bị chiếu)
 */
export function generateLegalMoves(
  board: any[][],
  turn: 'w' | 'b',
  validatorFn?: (move: GeneratedMove) => boolean,
): GeneratedMove[] {
  const pseudo = generatePseudoMovesFromBoard(board, turn);
  const legal = pseudo.filter((move) => {
    const nextBoard = applyMoveOnBoard(board, move);
    if (isKingInCheckOnBoard(nextBoard, turn)) {
      return false;
    }
    if (validatorFn && !validatorFn(move)) {
      return false;
    }
    return true;
  });

  return legal;
}
