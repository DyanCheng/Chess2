// ============================================================
// Game Store - Zustand state management for game
// ============================================================

import { create } from 'zustand';
import { BoardState, BoardPosition, ChessMove, PieceColor, ChessPiece } from '../types/chess';
import { CardEffect, CardEffectType, CardInHand } from '../types/card';
import { GameMode, GameState, GameStatus, GameTimer } from '../types/game';
import { PlayerHP } from '../types/player';
import { INITIAL_BOARD, INITIAL_HP } from '../constants/chess';
import { calculateHPDamage, fromAlgebraic } from '../utils/chessUtils';
import { applyLocalMove, localBoard, localLegalMoves, replaceLocalPosition, resetLocalChess } from '../services/game/localChess';
import { toAlgebraic } from '../utils/chessUtils';

const PIECE_BOUND_CARD_EFFECTS = new Set<CardEffectType>([
  'pawn_step', 'freeze', 'high_risk', 'arsenal', 'mosquito', 'matrix', 'transformer',
]);

interface GameStore {
  // Game state
  gameId: string | null;
  mode: GameMode | null;
  botId: string | null;
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
  drawPile: CardInHand[];
  discardPile: CardInHand[];
  activeEffects: CardEffect[];
  selectedCard: CardInHand | null;
  targetingCard: CardInHand | null;
  targetingStep: 'first' | 'second' | null;
  targetingFrom: BoardPosition | null;
  cardUsedThisTurn: boolean;
  previousBoard: BoardState | null;
  previousTurn: PieceColor | null;

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
  selectCardTarget: (pos: BoardPosition) => void;
  updateTimer: () => void;
  agreeDraw: () => void;
  resignGame: () => void;
  resetGame: () => void;
  setBoard: (board: BoardState) => void;
  applyDamage: (color: PieceColor, amount: number) => void;
  applyHeal: (color: PieceColor, amount: number) => void;
}

type GameSetter = (
  partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>),
) => void;
type GameGetter = () => GameStore;

export function getLocalMoveRules(effects: CardEffect[]) {
  return {
    frozenSquares: effects.filter(effect => effect.isActive && effect.effectType === 'freeze' && effect.targetSquare)
      .map(effect => effect.targetSquare!),
    protectedSquares: effects.filter(effect => effect.isActive && ['arsenal', 'pawn_step', 'matrix'].includes(effect.effectType) && effect.targetSquare)
      .map(effect => effect.targetSquare!),
    pawnStepSquares: effects.filter(effect => effect.isActive && effect.effectType === 'pawn_step' && effect.targetSquare)
      .map(effect => effect.targetSquare!),
    pawnBackwardColors: effects.some(effect => effect.isActive && effect.effectType === 'mu')
      ? [effects.find(effect => effect.isActive && effect.effectType === 'mu')!.targetPlayerId]
      : [],
    transformers: effects
      .filter(effect => effect.isActive && effect.effectType === 'transformer' && effect.targetSquare)
      .map(effect => ({ square: effect.targetSquare!, types: effect.movementTypes ?? [] })),
  };
}

function consumeSkillCard(
  state: GameStore,
  card: CardInHand,
): Partial<GameStore> {
  return {
    playerCards: state.playerCards.map(item =>
      (item.instanceId ?? item.card.id) === (card.instanceId ?? card.card.id)
        ? { ...item, usesRemaining: Math.max(0, item.usesRemaining - 1) }
        : item,
    ),
    discardPile: state.playerCards.some(item =>
      (item.instanceId ?? item.card.id) === (card.instanceId ?? card.card.id),
    )
      ? [...state.discardPile, { ...card, usesRemaining: 0 }]
      : state.discardPile,
    selectedCard: null,
    targetingCard: null,
    targetingStep: null,
    targetingFrom: null,
    validMoves: [],
    cardUsedThisTurn: true,
  };
}

function getTargetPositions(
  effect: CardEffectType,
  board: BoardState,
  color: PieceColor,
  from: BoardPosition | null = null,
): BoardPosition[] {
  const positions: BoardPosition[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      let valid = false;
      if (effect === 'portal') valid = !!piece && piece.color === color && piece.type !== 'king';
      else if (effect === 'start') {
        valid = !!piece && piece.color === color && (from
          ? row === 7 && col === from.col
          : piece.type === 'pawn' && row === 6);
      } else if (effect === 'tele') {
        valid = from ? !piece : !!piece && piece.color === color && piece.type !== 'king';
      } else if (effect === 'trump') valid = true;
      else if (effect === 'fortune' || effect === 'bring_back') valid = !piece;
      else if (['freeze', 'high_risk', 'mosquito'].includes(effect)) valid = !!piece && piece.color !== color;
      else valid = !!piece && piece.color === color;
      if (valid) positions.push({ row, col });
    }
  }
  return positions;
}

function applyImmediateCard(card: CardInHand, get: GameGetter, set: GameSetter): void {
  const state = get();
  const { effectType } = card.card;
  if (!card.isUsable) return;
  const effect = (type: CardEffectType, turns: number, value = 0): CardEffect => ({
    id: `effect_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    cardId: card.card.id,
    effectType: type,
    targetPlayerId: state.playerColor,
    turnsRemaining: turns,
    value,
    isActive: true,
  });

  switch (effectType) {
    case 'back_to_future':
      if (state.previousBoard && state.previousTurn && state.moveHistory.length > 0) {
        replaceLocalPosition(state.previousBoard, state.previousTurn);
        set({
          board: state.previousBoard,
          currentTurn: state.previousTurn,
          moveHistory: state.moveHistory.slice(0, -1),
          lastMove: null,
          previousBoard: null,
          previousTurn: null,
        });
      }
      break;
    case 'mu':
      set({ activeEffects: [...state.activeEffects, effect('mu', 9999)] });
      break;
    case 'matrix': {
      const positions = Array.from({ length: 8 }, (_, index) => ({ row: 7 - index, col: index }));
      const occupied = positions.filter(position => state.board[position.row][position.col]);
      if (occupied.length >= 5) {
        const effects = occupied
          .map(position => ({
            ...effect('matrix', 6),
            targetSquare: toAlgebraic(position),
          }));
        set({ activeEffects: [...state.activeEffects, ...effects] });
      }
      break;
    }
    case 'arsenal_plus':
      set({ activeEffects: [...state.activeEffects, effect('arsenal_plus', 9999, 1)] });
      break;
    case 'hide_king': {
      let king: BoardPosition | null = null;
      const rooks: BoardPosition[] = [];
      state.board.forEach((row, rowIndex) => row.forEach((piece, colIndex) => {
        if (piece?.color !== state.playerColor) return;
        if (piece.type === 'king') king = { row: rowIndex, col: colIndex };
        if (piece.type === 'rook') rooks.push({ row: rowIndex, col: colIndex });
      }));
      if (king && rooks.length > 0) {
        rooks.sort((a, b) =>
          Math.abs(a.row - king!.row) + Math.abs(a.col - king!.col)
          - Math.abs(b.row - king!.row) - Math.abs(b.col - king!.col),
        );
        const rook = rooks[0];
        const nextBoard = state.board.map(row => row.map(piece => piece ? { ...piece } : null));
        const kingPiece = nextBoard[king.row][king.col];
        nextBoard[king.row][king.col] = nextBoard[rook.row][rook.col];
        nextBoard[rook.row][rook.col] = kingPiece;
        replaceLocalPosition(nextBoard, state.currentTurn);
        set({ board: nextBoard });
      }
      break;
    }
    case 'vckbla':
      get().resignGame();
      return;
    case 'shuffle': {
      const cards = [...state.drawPile];
      for (let index = cards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [cards[index], cards[swapIndex]] = [cards[swapIndex], cards[index]];
      }
      set({ drawPile: cards });
      break;
    }
    case 'greed': {
      const drawPile = [...state.drawPile];
      const discardPile = [...state.discardPile];
      if (drawPile.length < 2 && discardPile.length) {
        drawPile.push(...discardPile.splice(0));
        for (let index = drawPile.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [drawPile[index], drawPile[swapIndex]] = [drawPile[swapIndex], drawPile[index]];
        }
      }
      const drawn = drawPile.splice(0, 2);
      set({ playerCards: [...state.playerCards, ...drawn], drawPile, discardPile });
      break;
    }
    default:
      break;
  }
  set(current => consumeSkillCard(current, card));
}

function completeTargetCard(
  card: CardInHand,
  board: BoardState,
  position: BoardPosition,
  from: BoardPosition | null,
  get: GameGetter,
  set: GameSetter,
): void {
  const state = get();
  const effectType = card.card.effectType;
  const square = toAlgebraic(position);
  const nextBoard = board.map(row => row.map(piece => piece ? { ...piece } : null));
  const effect = (type: CardEffectType, turns: number, targetSquare: string, value = 0): CardEffect => ({
    id: `effect_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    cardId: card.card.id,
    effectType: type,
    targetPlayerId: state.playerColor,
    turnsRemaining: turns,
    value,
    isActive: true,
    targetSquare,
  });
  let effects = state.activeEffects;
  let endTurn = false;

  switch (effectType) {
    case 'pawn_step':
      effects = [...effects, effect('pawn_step', 2, square)];
      break;
    case 'freeze':
      effects = [...effects, effect('freeze', 2, square)];
      break;
    case 'trump':
      effects = [...effects, effect('trump', 3, square)];
      break;
    case 'high_risk':
      effects = [...effects, effect('high_risk', 14, square, 2), effect('freeze', 14, square)];
      break;
    case 'arsenal': {
      const bonus = effects.filter(item => item.effectType === 'arsenal_plus' && item.isActive)
        .reduce((total, item) => total + item.value, 0);
      effects = [
        ...effects.filter(item => item.effectType !== 'arsenal_plus'),
        effect('arsenal', 6 + bonus, square),
      ];
      break;
    }
    case 'portal':
      if (from) endTurn = true;
      break;
    case 'start':
      if (state.moveHistory.length !== 0 || !from) return;
      break;
    case 'fortune': {
      if (nextBoard[position.row][position.col]) return;
      const hp = state.playerColor === 'white' ? state.whiteHP : state.blackHP;
      const newHP = Math.max(0, Math.floor(hp.current * 0.2));
      nextBoard[position.row][position.col] = {
        id: `${state.playerColor}_queen_${square}`,
        type: 'queen',
        color: state.playerColor,
      };
      set(state.playerColor === 'white'
        ? { whiteHP: { ...state.whiteHP, current: newHP } }
        : { blackHP: { ...state.blackHP, current: newHP } });
      if (newHP === 0) get().applyDamage(state.playerColor, 0);
      break;
    }
    case 'bring_back': {
      if (nextBoard[position.row][position.col]) return;
      const captured = [...state.moveHistory].reverse().find(move => move.captured?.color === state.playerColor)?.captured;
      if (!captured) return;
      nextBoard[position.row][position.col] = { ...captured, id: `${captured.id}_revived_${Date.now()}` };
      break;
    }
    case 'tele': {
      const fromPosition = from;
      if (!fromPosition) return;
      const empty: BoardPosition[] = [];
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          if (!nextBoard[row][col]) empty.push({ row, col });
        }
      }
      const destination = empty[Math.floor(Math.random() * empty.length)];
      if (!destination) return;
      nextBoard[destination.row][destination.col] = nextBoard[fromPosition.row][fromPosition.col];
      nextBoard[fromPosition.row][fromPosition.col] = null;
      const sourceSquare = toAlgebraic(fromPosition);
      const destinationSquare = toAlgebraic(destination);
      effects = effects.map(item => ({
        ...item,
        targetSquare: item.targetSquare === sourceSquare &&
          PIECE_BOUND_CARD_EFFECTS.has(item.effectType)
          ? destinationSquare
          : item.targetSquare,
      }));
      break;
    }
    case 'mosquito':
      effects = [...effects, effect('freeze', 9999, square), effect('mosquito', 9999, square, 1)];
      break;
    case 'transformer': {
      const representative = nextBoard[position.row][position.col];
      if (!representative) return;
      const movementTypes = new Set(
        nextBoard.flat()
          .filter(piece => piece?.color === state.playerColor)
          .map(piece => piece!.type),
      );
      const mergedSquares = nextBoard.flatMap((row, rowIndex) => row.flatMap((piece, colIndex) =>
        piece?.color === state.playerColor && piece.type !== 'king' &&
          (rowIndex !== position.row || colIndex !== position.col)
          ? [toAlgebraic({ row: rowIndex, col: colIndex })]
          : [],
      ));
      effects = effects.map(item => ({
        ...item,
        targetSquare: item.targetSquare && mergedSquares.includes(item.targetSquare) &&
          PIECE_BOUND_CARD_EFFECTS.has(item.effectType)
          ? square
          : item.targetSquare,
      }));
      for (let row = 0; row < 8; row += 1) {
        for (let col = 0; col < 8; col += 1) {
          if (row === position.row && col === position.col) continue;
          if (nextBoard[row][col]?.color === state.playerColor && nextBoard[row][col]?.type !== 'king') {
            nextBoard[row][col] = null;
          }
        }
      }
      effects = [...effects, {
        ...effect('transformer', 9999, square),
        movementTypes: [...movementTypes],
      }];
      break;
    }
    default:
      return;
  }

  const boardChanges = ['portal', 'start', 'fortune', 'bring_back', 'tele', 'transformer'].includes(effectType);
  if ((effectType === 'portal' || effectType === 'start') && from) {
    const firstSquare = toAlgebraic(from);
    const secondSquare = square;
    effects = effects.map(item => ({
      ...item,
      targetSquare: !PIECE_BOUND_CARD_EFFECTS.has(item.effectType)
        ? item.targetSquare
        : item.targetSquare === firstSquare
        ? secondSquare
        : item.targetSquare === secondSquare ? firstSquare : item.targetSquare,
    }));
  }
  if (boardChanges) {
    replaceLocalPosition(nextBoard, endTurn
      ? (state.playerColor === 'white' ? 'black' : 'white')
      : state.currentTurn);
  }
  set(current => ({
    ...consumeSkillCard(current, card),
    board: nextBoard,
    currentTurn: endTurn ? (state.playerColor === 'white' ? 'black' : 'white') : state.currentTurn,
    timer: endTurn ? { ...state.timer, isWhiteTurn: state.playerColor === 'black' } : state.timer,
    activeEffects: effects,
    targetingCard: null,
    targetingStep: null,
    targetingFrom: null,
    selectedCard: null,
  }));
}

export const useGameStore = create<GameStore>()((set, get) => ({
  // Initial state
  gameId: null,
  mode: null,
  botId: null,
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
  drawPile: [],
  discardPile: [],
  activeEffects: [],
  selectedCard: null,
  targetingCard: null,
  targetingStep: null,
  targetingFrom: null,
  cardUsedThisTurn: false,
  previousBoard: null,
  previousTurn: null,

  isPromoting: false,
  promotionPosition: null,
  showGameOverModal: false,
  gameResult: null,

  // Initialize a new game
  initGame: (mode, playerColor) => {
    resetLocalChess();
    set({
      gameId: `game_${Date.now()}`,
      mode,
      botId: null,
      status: 'playing',
      board: localBoard(),
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
      drawPile: [],
      discardPile: [],
      activeEffects: [],
      selectedCard: null,
      targetingCard: null,
      targetingStep: null,
      targetingFrom: null,
      cardUsedThisTurn: false,
      previousBoard: null,
      previousTurn: null,
      isPromoting: false,
      promotionPosition: null,
      showGameOverModal: false,
      gameResult: null,
    });
  },

  // Select a square on the board
  selectSquare: (pos) => {
    const { board, currentTurn, playerColor, selectedSquare, validMoves, status, targetingCard } = get();
    if (status !== 'playing') return;
    if (targetingCard) {
      get().selectCardTarget(pos);
      return;
    }

    // If clicking on a valid move destination, execute the move
    if (selectedSquare && validMoves.some(m => m.row === pos.row && m.col === pos.col)) {
      get().makeMove(selectedSquare, pos);
      return;
    }

    const piece = board[pos.row][pos.col];

    // If clicking on player's own piece, select it
    if (piece && piece.color === currentTurn && piece.color === playerColor) {
      const moves = localLegalMoves(pos, getLocalMoveRules(get().activeEffects));
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
    const { currentTurn, moveHistory, timer, status, board, activeEffects, playerColor } = get();
    if (status !== 'playing') return;
    const result = applyLocalMove(from, to, getLocalMoveRules(activeEffects));
    if (!result) return;
    const { board: newBoard, captured, move } = result;

    // Calculate HP damage if piece was captured
    if (captured) {
      const damageMultiplier = get().activeEffects.some(e =>
        e.isActive && (
          e.effectType === 'double_damage' ||
          (e.effectType === 'high_risk' && e.targetSquare === toAlgebraic(from) && e.turnsRemaining > 0)
        ),
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
    const destinationSquare = toAlgebraic(to);
    const sourceSquare = toAlgebraic(from);
    const capturedEffectIds = new Set(activeEffects
      .filter(effect =>
        effect.targetSquare === destinationSquare &&
        effect.targetSquare !== sourceSquare &&
        PIECE_BOUND_CARD_EFFECTS.has(effect.effectType),
      )
      .map(effect => effect.id));

    // Add increment to current player's timer
    const newTimer = { ...timer };
    if (currentTurn === 'white') {
      newTimer.whiteTime += timer.increment;
    } else {
      newTimer.blackTime += timer.increment;
    }
    newTimer.isWhiteTurn = nextTurn === 'white';

    // Apply delayed board effects before checking for game end.
    let gameResult = null;
    let showGameOverModal = false;
    const inCheck = result.inCheck;
    const expiringTrump = activeEffects.filter(effect =>
      effect.effectType === 'trump' && effect.turnsRemaining <= 1,
    );
    const finalBoard = newBoard.map(row => row.map(piece => piece ? { ...piece } : null));
    for (const effect of expiringTrump) {
      if (!effect.targetSquare) continue;
      const target = fromAlgebraic(effect.targetSquare);
      const destroyed = finalBoard[target.row][target.col];
      finalBoard[target.row][target.col] = null;
      if (destroyed?.type === 'king') {
        gameResult = { winner: effect.targetPlayerId, reason: 'Bị tiêu diệt bởi Trump' };
        showGameOverModal = true;
      }
    }

    const updatedEffects = activeEffects.filter(effect => !capturedEffectIds.has(effect.id)).flatMap(effect => {
      const targetSquare = effect.targetSquare === sourceSquare &&
        PIECE_BOUND_CARD_EFFECTS.has(effect.effectType)
        ? destinationSquare
        : effect.targetSquare;
      if (effect.effectType === 'high_risk' && effect.turnsRemaining <= 1) {
        return [{ ...effect, targetSquare, turnsRemaining: 9999, isActive: true }];
      }
      const remaining = effect.turnsRemaining - 1;
      if (remaining <= 0) return [];
      return [{
        ...effect,
        targetSquare,
        turnsRemaining: remaining,
        isActive: true,
      }];
    });
    activeEffects
      .filter(effect => effect.effectType === 'mosquito' && effect.targetPlayerId !== currentTurn)
      .forEach(effect => {
        get().applyDamage(effect.targetPlayerId === 'white' ? 'black' : 'white', effect.value);
      });

    if (!gameResult && result.checkmate) {
      gameResult = { winner: currentTurn, reason: 'Chiếu hết!' };
      showGameOverModal = true;
    } else if (!gameResult && result.draw) {
      gameResult = { winner: 'draw' as const, reason: 'Hết nước đi - Hòa!' };
      showGameOverModal = true;
    } else if (!gameResult && get().whiteHP.current <= 0) {
      gameResult = { winner: 'black' as const, reason: 'Hết sinh mệnh!' };
      showGameOverModal = true;
    } else if (!gameResult && get().blackHP.current <= 0) {
      gameResult = { winner: 'white' as const, reason: 'Hết sinh mệnh!' };
      showGameOverModal = true;
    }

    if (expiringTrump.length > 0) replaceLocalPosition(finalBoard, nextTurn);
    set({
      board: finalBoard,
      currentTurn: nextTurn,
      moveHistory: [...moveHistory, move],
      previousBoard: board.map(row => row.map(piece => piece ? { ...piece } : null)),
      previousTurn: currentTurn,
      cardUsedThisTurn: nextTurn === playerColor ? false : get().cardUsedThisTurn,
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
    const { activeEffects, currentTurn, playerColor, status } = get();
    if (
      status !== 'playing' ||
      get().targetingCard ||
      get().cardUsedThisTurn ||
      card.usesRemaining <= 0
    ) return;
    if (!card.isUsable) return;
    if (currentTurn !== playerColor) return;

    const targeted = new Set([
      'pawn_step', 'freeze', 'trump', 'high_risk', 'arsenal', 'portal',
      'start', 'fortune', 'bring_back', 'transformer', 'tele', 'mosquito',
    ]);
    if (targeted.has(card.card.effectType)) {
      set({
        selectedCard: card,
        targetingCard: card,
        targetingStep: ['portal', 'start'].includes(card.card.effectType) ? 'first' : 'first',
        targetingFrom: null,
        validMoves: getTargetPositions(card.card.effectType, get().board, playerColor),
      });
      return;
    }

    applyImmediateCard(card, get, set);
  },

  selectCardTarget: (pos) => {
    const { targetingCard, targetingFrom, board, playerColor } = get();
    if (!targetingCard) return;
    const effect = targetingCard.card.effectType;
    const piece = board[pos.row]?.[pos.col];
    if (effect === 'tele') {
      if (piece?.color === playerColor) {
        completeTargetCard(targetingCard, board, pos, pos, get, set);
      }
      return;
    }
    if (effect === 'portal' || effect === 'start') {
      if (!targetingFrom) {
        const valid = effect === 'portal'
          ? piece?.color === playerColor && piece.type !== 'king'
          : piece?.color === playerColor && piece.type === 'pawn' && pos.row === 6;
        if (valid) set({
          targetingFrom: pos,
          targetingStep: 'second',
          validMoves: getTargetPositions(effect, board, playerColor, pos),
        });
        return;
      }
      const firstPiece = board[targetingFrom.row][targetingFrom.col];
      const valid = effect === 'portal'
        ? piece?.color === playerColor && piece.type !== 'king'
        : piece?.color === playerColor && pos.row === 7 && pos.col === targetingFrom.col;
      if (!valid || !firstPiece) return;
      const swapped = board.map(row => row.map(item => item ? { ...item } : null));
      swapped[targetingFrom.row][targetingFrom.col] = piece ? { ...piece } : null;
      swapped[pos.row][pos.col] = { ...firstPiece };
      completeTargetCard(targetingCard, swapped, pos, targetingFrom, get, set);
      return;
    }
    if (!piece && ['fortune', 'bring_back', 'trump'].includes(effect)) {
      completeTargetCard(targetingCard, board, pos, null, get, set);
      return;
    }
    if (effect === 'trump') {
      completeTargetCard(targetingCard, board, pos, null, get, set);
      return;
    }
    const mustBeEnemy = ['freeze', 'high_risk', 'mosquito'].includes(effect);
    if (piece && (mustBeEnemy ? piece.color !== playerColor : piece.color === playerColor)) {
      completeTargetCard(targetingCard, board, pos, null, get, set);
    }
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

  agreeDraw: () => {
    if (get().status !== 'playing') return;
    set({
      status: 'finished',
      gameResult: { winner: 'draw', reason: 'Hòa theo thỏa thuận' },
      showGameOverModal: true,
      selectedSquare: null,
      validMoves: [],
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
    resetLocalChess();
    set({
      gameId: null,
      mode: null,
      botId: null,
      status: 'waiting',
      board: localBoard(),
      currentTurn: 'white',
      moveHistory: [],
      selectedSquare: null,
      validMoves: [],
      lastMove: null,
      inCheck: false,
      whiteHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      blackHP: { current: INITIAL_HP, max: INITIAL_HP, shield: 0 },
      playerCards: [],
      drawPile: [],
      discardPile: [],
      activeEffects: [],
      selectedCard: null,
      targetingCard: null,
      targetingStep: null,
      targetingFrom: null,
      cardUsedThisTurn: false,
      previousBoard: null,
      previousTurn: null,
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
