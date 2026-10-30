// ============================================================
// useGame Hook - Game lifecycle management
// ============================================================

import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { usePlayerStore } from '../store/playerStore';
import { useCardStore } from '../store/cardStore';
import { GameMode, BotDifficulty } from '../types/game';
import { localBotMoves } from '../services/game/localChess';
import { useHistoryStore } from '../store/historyStore';
import { formatTime } from '../utils/formatCurrency';

const rewardedGames = new Set<string>();
import { BOT_LEVELS, PVP_REWARDS } from '../constants/game';

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
    useGameStore.setState({ botId: botLevel.id });
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
    if (status === 'finished' && gameResult && gameId && !rewardedGames.has(gameId)) {
      rewardedGames.add(gameId);
      const bot = BOT_LEVELS.find(level => level.id === useGameStore.getState().botId);
      useHistoryStore.getState().recordGame({
        id: gameId,
        date: new Date().toISOString(),
        opponent: mode === 'pve' ? bot?.name || 'Bot' : 'Người chơi',
        result: gameResult.winner === 'draw' ? 'draw' : gameResult.winner === playerColor ? 'win' : 'loss',
        duration: formatTime(Math.max(0, 1200 + timer.increment * moveHistory.length - timer.whiteTime - timer.blackTime)),
      });
      if (mode === 'pve') {
        if (gameResult.winner === playerColor) {
          addGold(bot?.reward.gold || 0);
          addExperience(bot?.reward.experience || 0);
          addGems(bot?.reward.gems || 0);
          recordWin();
        } else if (gameResult.winner === 'draw') {
          recordDraw();
        } else {
          recordLoss();
        }
      } else if (mode === 'pvp') {
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

  // Bot uses the same legal-move engine as the player.
  const makeBotMove = useCallback(() => {
    if (currentTurn !== playerColor && status === 'playing' && mode === 'pve') {
      const timeout = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.status !== 'playing' || state.currentTurn === state.playerColor) return;
        const botColor = playerColor === 'white' ? 'black' : 'white';
        const allMoves = localBotMoves(botColor);
        if (allMoves.length > 0) {
          const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
          useGameStore.getState().makeMove(randomMove.from, randomMove.to);
        }
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentTurn, playerColor, status, mode]);

  // Trigger bot move when it's bot's turn
  useEffect(() => {
    if (mode === 'pve' && currentTurn !== playerColor && status === 'playing') {
      return makeBotMove();
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
