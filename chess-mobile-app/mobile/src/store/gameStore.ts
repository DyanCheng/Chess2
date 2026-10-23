// ============================================================
// Game Store - Zustand state management for game
// ============================================================

import { create } from 'zustand';
import { BoardState, BoardPosition, ChessMove, ChessPiece, PieceColor } from '../types/chess';
import { CardEffect, CardInHand } from '../types/card';
import { GameMode, GameState, GameStatus, GameTimer } from '../types/game';
import { PlayerHP } from '../types/player';
import { INITIAL_BOARD, INITIAL_HP } from '../constants/chess';
import { cloneBoard, executeMove, getValidMoves, isCheckmate, isStalemate, isInCheck, calculateHPDamage } from '../utils/chessUtils';

interface GameStore {
  // Game state
  gameId: string | null;
  mode: GameMode | null;
  status: GameStatus;
  board: BoardState;
  currentTurn: PieceColor;
  playerColor: PieceColor;
  moveHistory: ChessMove[];
  selectedSquare: BoardPosition | null;
  validMoves: BoardPosition[];
  lastMove: { from: BoardPosition; to: BoardPosition } | null;
  inCheck: boolean;

  // Timer
  timer: GameTimer;

  // HP System
  whiteHP: PlayerHP;
  blackHP: PlayerHP;

  // Cards
  playerCards: CardInHand[];
  activeEffects: CardEffect[];
  selectedCard: CardInHand | null;

  // UI state
  isPromoting: boolean;
  promotionPosition: BoardPosition | null;
  showGameOverModal: boolean;
  gameResult: { winner: PieceColor | 'draw'; reason: string } | null;

  // Actions
  initGame: (mode: GameMode, playerColor: PieceColor) => void;
  selectSquare: (pos: BoardPosition) => void;
  makeMove: (from: BoardPosition, to: BoardPosition) => void;
  selectCard: (card: CardInHand | null) => void;
  useCard: (card: CardInHand) => void;
  updateTimer: () => void;
  resignGame: () => void;
  resetGame: () => void;
  setBoard: (board: BoardState) => void;
  applyDamage: (color: PieceColor, amount: number) => void;
  applyHeal: (color: PieceColor, amount: number) => void;
}

export const useGameStore = create<GameStore>()((set, get) => ({
  // Initial state
  gameId: null,
  mode: null,
  status: 'waiting',
  board: INITIAL_BOARD,
  currentTurn: 'white',
  playerColor: 'white',
  moveHistory: [],
  selectedSquare: null,
  validMoves: [],
  lastMove: null,
  inCheck: false,

  timer: {
    whiteTime: 600,
    blackTime: 600,
    increment: 5,
    isWhiteTurn: true,
  },

  whiteHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
  blackHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },

  playerCards: [],
  activeEffects: [],
  selectedCard: null,

  isPromoting: false,
  promotionPosition: null,
  showGameOverModal: false,
  gameResult: null,

  // Initialize a new game
  initGame: (mode, playerColor) => {
    set({
      gameId: `game_${Date.now()}`,
      mode,
      status: 'playing',
      board: cloneBoard(INITIAL_BOARD),
      currentTurn: 'white',
      playerColor,
      moveHistory: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      inCheck: false,
      timer: {
        whiteTime: 600,
        blackTime: 600,
        increment: 5,
        isWhiteTurn: true,
      },
      whiteHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      blackHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      playerCards: [],
      activeEffects: [],
      selectedCard: null,
      isPromoting: false,
      promotionPosition: null,
      showGameOverModal: false,
      gameResult: null,
    });
  },

  // Select a square on the board
  selectSquare: (pos) => {
    const { board, currentTurn, playerColor, selectedSquare, validMoves, status } = get();
    if (status !== 'playing') return;

    // If clicking on a valid move destination, execute the move
    if (selectedSquare && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      get().makeMove(selectedSquare, pos);
      return;
    }

    const piece = board[pos.row][pos.col];

    // If clicking on player's own piece, select it
    if (piece && piece.color === currentTurn && piece.color === playerColor) {
      const moves = getValidMoves(board, pos);
      set({
        selectedSquare: pos,
        validMoves: moves,
      });
    } else {
      set({ selectedSquare: null, validMoves: [] });
    }
  },

  // Execute a chess move
  makeMove: (from, to) => {
    const { board, currentTurn, moveHistory, timer } = get();

    const result = executeMove(board, from, to);
    const { newBoard, captured, move } = result;

    // Calculate HP damage if piece was captured
    if (captured) {
      const damageMultiplier = get().activeEffects.some(
        e => e.effectType === 'double_damage' && e.isActive
      ) ? 2 : 1;
      const damage = calculateHPDamage(captured, damageMultiplier);
      const targetColor = captured.color;

      // Apply damage through shield first
      const targetHP = targetColor === 'white' ? get().whiteHP : get().blackHP;
      let remainingDamage = damage;

      if (targetHP.shield > 0) {
        const shieldAbsorb = Math.min(targetHP.shield, remainingDamage);
        remainingDamage -= shieldAbsorb;
        if (targetColor === 'white') {
          set(state => ({
            whiteHP: { ...state.whiteHP, shield: state.whiteHP.shield - shieldAbsorb },
          }));
        } else {
          set(state => ({
            blackHP: { ...state.blackHP, shield: state.blackHP.shield - shieldAbsorb },
          }));
        }
      }

      if (remainingDamage > 0) {
        get().applyDamage(targetColor, remainingDamage);
      }
    }

    const nextTurn = currentTurn === 'white' ? 'black' : 'white';

    // Add increment to current player's timer
    const newTimer = { ...timer };
    if (currentTurn === 'white') {
      newTimer.whiteTime += timer.increment;
    } else {
      newTimer.blackTime += timer.increment;
    }
    newTimer.isWhiteTurn = nextTurn === 'white';

    // Check game end conditions
    let gameResult = null;
    let showGameOverModal = false;
    let inCheck = isInCheck(newBoard, nextTurn);

    if (isCheckmate(newBoard, nextTurn)) {
      gameResult = { winner: currentTurn, reason: 'Chiếu hết!' };
      showGameOverModal = true;
    } else if (isStalemate(newBoard, nextTurn)) {
      gameResult = { winner: 'draw' as const, reason: 'Hết nước đi - Hòa!' };
      showGameOverModal = true;
    } else if (get().whiteHP.current <= 0) {
      gameResult = { winner: 'black' as const, reason: 'Hết sinh mệnh!' };
      showGameOverModal = true;
    } else if (get().blackHP.current <= 0) {
      gameResult = { winner: 'white' as const, reason: 'Hết sinh mệnh!' };
      showGameOverModal = true;
    }

    // Update active effects (decrement turn counters)
    const updatedEffects = get().activeEffects.map(effect => ({
      ...effect,
      turnsRemaining: effect.turnsRemaining - 1,
      isActive: effect.turnsRemaining - 1 > 0,
    })).filter(e => e.turnsRemaining > 0);

    set({
      board: newBoard,
      currentTurn: nextTurn,
      moveHistory: [...moveHistory, move as ChessMove],
      selectedSquare: null,
      validMoves: [],
      lastMove: { from, to },
      inCheck,
      timer: newTimer,
      status: gameResult ? 'finished' : 'playing',
      gameResult,
      showGameOverModal,
      activeEffects: updatedEffects,
    });
  },

  selectCard: (card) => set({ selectedCard: card }),

  useCard: (card) => {
    // Card usage logic - will interact with the card effect system
    const { activeEffects, currentTurn, playerColor } = get();

    if (currentTurn !== playerColor) return;

    const newEffect: CardEffect = {
      id: `effect_${Date.now()}`,
      cardId: card.card.id,
      effectType: card.card.effectType,
      targetPlayerId: playerColor,
      turnsRemaining: card.card.duration || 1,
      value: card.card.value || 0,
      isActive: true,
    };

    // Apply immediate effects
    switch (card.card.effectType) {
      case 'heal':
        get().applyHeal(playerColor, card.card.value || 10);
        break;
      case 'shield':
        if (playerColor === 'white') {
          set(state => ({
            whiteHP: { ...state.whiteHP, shield: state.whiteHP.shield + (card.card.value || 8) },
          }));
        } else {
          set(state => ({
            blackHP: { ...state.blackHP, shield: state.blackHP.shield + (card.card.value || 8) },
          }));
        }
        break;
      case 'time_bonus':
        set(state => ({
          timer: {
            ...state.timer,
            ...(playerColor === 'white'
              ? { whiteTime: state.timer.whiteTime + (card.card.value || 60) }
              : { blackTime: state.timer.blackTime + (card.card.value || 60) }),
          },
        }));
        break;
      case 'fortify':
        if (playerColor === 'white') {
          set(state => ({
            whiteHP: {
              ...state.whiteHP,
              max: state.whiteHP.max + (card.card.value || 5),
              current: Math.min(state.whiteHP.current + (card.card.value || 5), state.whiteHP.max + (card.card.value || 5)),
            },
          }));
        } else {
          set(state => ({
            blackHP: {
              ...state.blackHP,
              max: state.blackHP.max + (card.card.value || 5),
              current: Math.min(state.blackHP.current + (card.card.value || 5), state.blackHP.max + (card.card.value || 5)),
            },
          }));
        }
        break;
    }

    // Add effect to active effects for duration-based cards
    if (card.card.duration && card.card.duration > 0) {
      set({ activeEffects: [...activeEffects, newEffect] });
    }

    // Update card in hand
    set(state => ({
      playerCards: state.playerCards.map(c =>
        c.card.id === card.card.id
          ? { ...c, usesRemaining: c.usesRemaining - 1, cooldownRemaining: c.card.cooldownTurns }
          : c
      ),
      selectedCard: null,
    }));
  },

  updateTimer: () => {
    const { status, timer } = get();
    if (status !== 'playing') return;

    set(state => {
      const newTimer = { ...state.timer };
      if (newTimer.isWhiteTurn) {
        newTimer.whiteTime = Math.max(0, newTimer.whiteTime - 1);
        if (newTimer.whiteTime <= 0) {
          return {
            timer: newTimer,
            status: 'finished' as GameStatus,
            gameResult: { winner: 'black' as PieceColor, reason: 'Hết thời gian!' },
            showGameOverModal: true,
          };
        }
      } else {
        newTimer.blackTime = Math.max(0, newTimer.blackTime - 1);
        if (newTimer.blackTime <= 0) {
          return {
            timer: newTimer,
            status: 'finished' as GameStatus,
            gameResult: { winner: 'white' as PieceColor, reason: 'Hết thời gian!' },
            showGameOverModal: true,
          };
        }
      }
      return { timer: newTimer };
    });
  },

  resignGame: () => {
    const { playerColor } = get();
    const winner = playerColor === 'white' ? 'black' : 'white';
    set({
      status: 'finished',
      gameResult: { winner, reason: 'Đầu hàng' },
      showGameOverModal: true,
    });
  },

  resetGame: () => {
    set({
      gameId: null,
      mode: null,
      status: 'waiting',
      board: cloneBoard(INITIAL_BOARD),
      currentTurn: 'white',
      moveHistory: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      inCheck: false,
      whiteHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      blackHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      playerCards: [],
      activeEffects: [],
      selectedCard: null,
      isPromoting: false,
      promotionPosition: null,
      showGameOverModal: false,
      gameResult: null,
    });
  },

  setBoard: (board) => set({ board }),

  applyDamage: (color, amount) => {
    set(state => {
      if (color === 'white') {
        const newHP = Math.max(0, state.whiteHP.current - amount);
        return {
          whiteHP: { ...state.whiteHP, current: newHP },
          ...(newHP <= 0 ? {
            status: 'finished' as GameStatus,
            gameResult: { winner: 'black' as PieceColor, reason: 'Hết sinh mệnh!' },
            showGameOverModal: true,
          } : {}),
        };
      } else {
        const newHP = Math.max(0, state.blackHP.current - amount);
        return {
          blackHP: { ...state.blackHP, current: newHP },
          ...(newHP <= 0 ? {
            status: 'finished' as GameStatus,
            gameResult: { winner: 'white' as PieceColor, reason: 'Hết sinh mệnh!' },
            showGameOverModal: true,
          } : {}),
        };
      }
    });
  },

  applyHeal: (color, amount) => {
    set(state => {
      if (color === 'white') {
        return {
          whiteHP: {
            ...state.whiteHP,
            current: Math.min(state.whiteHP.max, state.whiteHP.current + amount),
          },
        };
      } else {
        return {
          blackHP: {
            ...state.blackHP,
            current: Math.min(state.blackHP.max, state.blackHP.current + amount),
          },
        };
      }
    });
  },
}));
