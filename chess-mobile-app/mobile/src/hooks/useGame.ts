// ============================================================
// useGame Hook - Game lifecycle management
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useCardStore } from '../store/cardStore';
import { GameMode, BotDifficulty } from '../types/game';
import { PieceColor, BoardPosition } from '../types/chess';
import { PVP_REWARDS } from '../constants/game';

export function useGame() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    gameId, mode, status, board, currentTurn, playerColor,
    moveHistory, selectedSquare, validMoves, lastMove, inCheck,
    timer, whiteHP, blackHP, playerCards, activeEffects,
    selectedCard, showGameOverModal, gameResult,
    initGame, selectSquare, makeMove, selectCard, useCard,
    updateTimer, resignGame, resetGame,
  } = useGameStore();

  const { addGold, addExperience, addGems, recordWin, recordLoss, recordDraw } = usePlayerStore();
  const { getHandCards } = useCardStore();

  // Start a new PVP game
  const startPvPGame = useCallback(() => {
    initGame('pvp', 'white');
    // Set player cards
    const hand = getHandCards();
    useGameStore.setState({ playerCards: hand });
  }, [initGame, getHandCards]);

  // Start a new PVE (bot) game
  const startBotGame = useCallback((botLevel: BotDifficulty) => {
    initGame('pve', 'white');
    const hand = getHandCards();
    useGameStore.setState({ playerCards: hand });
  }, [initGame, getHandCards]);

  // Timer effect
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, updateTimer]);

  // Handle game over rewards
  useEffect(() => {
    if (status === 'finished' && gameResult) {
      if (mode === 'pvp') {
        if (gameResult.winner === playerColor) {
          addGold(PVP_REWARDS.win.gold);
          addExperience(PVP_REWARDS.win.experience);
          recordWin();
        } else if (gameResult.winner === 'draw') {
          addGold(PVP_REWARDS.draw.gold);
          addExperience(PVP_REWARDS.draw.experience);
          recordDraw();
        } else {
          addGold(PVP_REWARDS.loss.gold);
          addExperience(PVP_REWARDS.loss.experience);
          recordLoss();
        }
      }
    }
  }, [status, gameResult]);

  // Simple bot move (random valid move for development)
  const makeBotMove = useCallback(() => {
    if (currentTurn !== playerColor && status === 'playing' && mode === 'pve') {
      setTimeout(() => {
        const { board } = useGameStore.getState();
        const botColor = playerColor === 'white' ? 'black' : 'white';

        // Collect all possible moves for bot
        const allMoves: { from: BoardPosition; to: BoardPosition }[] = [];
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.color === botColor) {
              const { getValidMoves } = require('../utils/chessUtils');
              const moves = getValidMoves(board, { row, col });
              moves.forEach((to: BoardPosition) => {
                allMoves.push({ from: { row, col }, to });
              });
            }
          }
        }

        if (allMoves.length > 0) {
          // Pick a random move (basic bot logic)
          const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          useGameStore.getState().makeMove(randomMove.from, randomMove.to);
        }
      }, 500 + Math.random() * 1000);
    }
  }, [currentTurn, playerColor, status, mode]);

  // Trigger bot move when it's bot's turn
  useEffect(() => {
    if (mode === 'pve' && currentTurn !== playerColor && status === 'playing') {
      makeBotMove();
    }
  }, [currentTurn, mode, playerColor, status, makeBotMove]);

  return {
    // State
    gameId, mode, status, board, currentTurn, playerColor,
    moveHistory, selectedSquare, validMoves, lastMove, inCheck,
    timer, whiteHP, blackHP, playerCards, activeEffects,
    selectedCard, showGameOverModal, gameResult,

    // Actions
    startPvPGame, startBotGame, selectSquare, makeMove,
    selectCard, useCard, resignGame, resetGame,

    // Computed
    isPlayerTurn: currentTurn === playerColor,
    isGameOver: status === 'finished',
    moveCount: moveHistory.length,
  };
}
