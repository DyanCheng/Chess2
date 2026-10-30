import { evaluateBoard, PIECE_VALUES } from './evaluation';
import {
  applyMoveOnBoard,
  generateLegalMoves,
  GeneratedMove,
} from './move-generator';

export function minimax(
  board: any[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: 'w' | 'b',
): number {
  const currentTurn: 'w' | 'b' = isMaximizing
    ? botColor
    : botColor === 'w'
      ? 'b'
      : 'w';

  const legalMoves = generateLegalMoves(board, currentTurn);

  if (depth === 0 || legalMoves.length === 0) {
    return evaluateBoard(board, botColor);
  }

  // Sắp xếp ưu tiên các nước ăn quân trước để cắt tỉa Alpha-Beta nhanh hơn
  legalMoves.sort((a, b) => {
    const scoreA = a.captured ? PIECE_VALUES[a.captured] || 10 : 0;
    const scoreB = b.captured ? PIECE_VALUES[b.captured] || 10 : 0;
    return scoreB - scoreA;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of legalMoves) {
      const nextBoard = applyMoveOnBoard(board, move);
      const evaluation = minimax(nextBoard, depth - 1, alpha, beta, false, botColor);
      if (evaluation > maxEval) maxEval = evaluation;
      if (evaluation > alpha) alpha = evaluation;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of legalMoves) {
      const nextBoard = applyMoveOnBoard(board, move);
      const evaluation = minimax(nextBoard, depth - 1, alpha, beta, true, botColor);
      if (evaluation < minEval) minEval = evaluation;
      if (evaluation < beta) beta = evaluation;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMoveMinimax(
  board: any[][],
  botColor: 'w' | 'b',
  depth = 2,
  validatorFn?: (move: GeneratedMove) => boolean,
): GeneratedMove | null {
  const legalMoves = generateLegalMoves(board, botColor, validatorFn);
  if (legalMoves.length === 0) return null;

  // Sắp xếp ưu tiên nước ăn quân
  legalMoves.sort((a, b) => {
    const scoreA = a.captured ? PIECE_VALUES[a.captured] || 10 : 0;
    const scoreB = b.captured ? PIECE_VALUES[b.captured] || 10 : 0;
    return scoreB - scoreA;
  });

  let bestMove = legalMoves[0];
  let bestValue = -Infinity;

  for (const move of legalMoves) {
    const nextBoard = applyMoveOnBoard(board, move);
    const moveValue = minimax(
      nextBoard,
      depth - 1,
      -Infinity,
      Infinity,
      false,
      botColor,
    );

    if (moveValue > bestValue) {
      bestValue = moveValue;
      bestMove = move;
    }
  }

  return bestMove;
}