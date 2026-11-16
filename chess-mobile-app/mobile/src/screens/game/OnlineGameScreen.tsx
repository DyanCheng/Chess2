import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { CardHand } from '../../components/cards/CardHand';
import { SKILL_CARD_BY_ID } from '../../constants/skillCards';
import { COLORS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';
import { getServerSocket } from '../../services/websocket/serverSocket';
import { usePlayerStore } from '../../store/playerStore';
import { BoardPosition, BoardState, ChessPiece, PieceType } from '../../types/chess';
import { CardInHand } from '../../types/card';
import { fromAlgebraic, toAlgebraic } from '../../utils/chessUtils';

type OnlineRoute = RouteProp<RootStackParamList, 'GamePvP'>;
type OnlineNavigation = NativeStackNavigationProp<RootStackParamList>;

interface ServerGameState {
  gameId: string;
  fen: string;
  turn: 'w' | 'b';
  state: string;
  winner: 'w' | 'b' | 'draw' | null;
  endReason: string | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  ranked?: boolean;
  gameModeCode?: string | null;
  modeConfig?: { timeControlId?: string | null };
  drawOfferBy?: string | null;
  moves?: Array<{ from: string; to: string; playerId?: string; captured?: string }>;
  skillCardCounts?: { w: number; b: number };
  skillCardUsedThisTurn?: { w: boolean; b: boolean };
  lastSkillCardBy?: 'w' | 'b' | null;
  skillEffects?: Array<{ type: string; square?: string; movesRemaining: number }>;
}

interface ServerMatchReward {
  status: 'credited' | 'already_credited' | 'failed';
  currency: number | null;
  experience: number | null;
}

interface DrawOfferResult {
  gameId: string;
  offeredBy: string;
  respondedBy: string;
  accepted: boolean;
  reason?: string;
}

const pieceTypes: Record<string, PieceType> = {
  p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king',
};

function boardFromFen(fen: string): BoardState {
  return new Chess(fen).board().map(row => row.map(piece => piece ? {
    id: `${piece.color}_${piece.type}_${piece.square}`,
    type: pieceTypes[piece.type],
    color: piece.color === 'w' ? 'white' : 'black',
  } as ChessPiece : null));
}

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function cardTargetPositions(
  effect: string,
  board: BoardState,
  color: 'w' | 'b',
  from: BoardPosition | null,
  moveCount: number,
): BoardPosition[] {
  const ownColor = color === 'w' ? 'white' : 'black';
  const positions: BoardPosition[] = [];
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      let valid = false;
      if (effect === 'portal') valid = !!piece && piece.color === ownColor && piece.type !== 'king' && (!from || (row !== from.row || col !== from.col));
      else if (effect === 'start') {
        valid = moveCount === 0 && !!piece && piece.color === ownColor
          && (from ? row === 7 && col === from.col : piece.type === 'pawn' && row === 6);
      } else if (effect === 'tele') valid = !!piece && piece.color === ownColor;
      else if (effect === 'trump') valid = true;
      else if (effect === 'fortune' || effect === 'bring_back') valid = !piece;
      else if (effect === 'freeze' || effect === 'high_risk' || effect === 'mosquito') valid = !!piece && piece.color !== ownColor;
      else valid = !!piece && piece.color === ownColor;
      if (valid) positions.push({ row, col });
    }
  }
  return positions;
}

interface PlayerPanelProps {
  name: string;
  color: 'w' | 'b';
  time: string;
  isActive: boolean;
  isCurrentPlayer: boolean;
}

const PlayerPanel: React.FC<PlayerPanelProps> = ({
  name,
  color,
  time,
  isActive,
  isCurrentPlayer,
}) => (
  <View style={[styles.playerPanel, isActive && styles.activePlayerPanel]}>
    <View style={[styles.playerBadge, isCurrentPlayer && styles.currentPlayerBadge]}>
      <Text style={styles.playerBadgeText}>{color === 'w' ? '♙' : '♟'}</Text>
    </View>
    <View style={styles.playerDetails}>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      <Text style={styles.playerSubtext}>
        Quân {color === 'w' ? 'trắng' : 'đen'}{isActive ? ' · Đang đi' : ''}
      </Text>
    </View>
    <View style={[styles.clockBox, isActive && styles.activeClockBox]}>
      <Text style={[styles.clockText, isActive && styles.activeClockText]}>{time}</Text>
    </View>
  </View>
);

export const OnlineGameScreen: React.FC = () => {
  const route = useRoute<OnlineRoute>();
  const navigation = useNavigation<OnlineNavigation>();
  const { gameId, color, opponentId, playerId } = route.params;
  const playerName = usePlayerStore(state => state.profile?.username ?? 'Bạn');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<ServerGameState | null>(null);
  const [reward, setReward] = useState<ServerMatchReward | null>(null);
  const [selected, setSelected] = useState<BoardPosition | null>(null);
  const [cards, setCards] = useState<CardInHand[]>([]);
  const [selectedCard, setSelectedCard] = useState<CardInHand | null>(null);
  const [targetingCard, setTargetingCard] = useState<CardInHand | null>(null);
  const [targetingFrom, setTargetingFrom] = useState<BoardPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [drawOfferPending, setDrawOfferPending] = useState(false);
  const [boardFlipped, setBoardFlipped] = useState(color === 'b');
  const [clockNow, setClockNow] = useState(Date.now());
  const receivedAt = useRef(Date.now());
  const promptedDrawOfferBy = useRef<string | null>(null);

  const showDrawOffer = useCallback((offeredBy: string, activeSocket: Socket) => {
    if (offeredBy === playerId) {
      setDrawOfferPending(true);
      return;
    }
    if (promptedDrawOfferBy.current === offeredBy) return;

    promptedDrawOfferBy.current = offeredBy;
    setDrawOfferPending(true);
    Alert.alert('Đề nghị hòa', 'Đối thủ muốn kết thúc ván cờ với kết quả hòa.', [
      {
        text: 'Từ chối',
        style: 'cancel',
        onPress: () => activeSocket.emit('game:draw_respond', { gameId, accepted: false }),
      },
      {
        text: 'Chấp nhận',
        onPress: () => activeSocket.emit('game:draw_respond', { gameId, accepted: true }),
      },
    ], { cancelable: false });
  }, [gameId, playerId]);

  useEffect(() => {
    let active = true;
    let connected: Socket | null = null;
    setGame(null);
    setReward(null);
    setCards([]);

    const join = () => connected?.emit('game:join', { gameId });
    const update = (next: ServerGameState) => {
      if (next.gameId !== gameId || !active) return;
      receivedAt.current = Date.now();
      setGame(next);
      setSelected(null);
      setError(null);
      if (next.state === 'FINISHED' || next.state === 'ABORTED') {
        setDrawOfferPending(false);
        promptedDrawOfferBy.current = null;
      } else if (next.drawOfferBy) {
        showDrawOffer(next.drawOfferBy, connected!);
      } else {
        setDrawOfferPending(false);
        promptedDrawOfferBy.current = null;
      }
    };
    const onError = (reason: { message?: string | string[] }) => {
      const message = reason?.message;
      setError(Array.isArray(message) ? message.join(' · ') : message || 'Không thể thực hiện thao tác.');
      setDrawOfferPending(false);
      promptedDrawOfferBy.current = null;
      setTargetingCard(null);
      setTargetingFrom(null);
    };
    const onReward = (result: ServerMatchReward) => {
      if (active) setReward(result);
    };
    const onCards = (response: { hand: string[]; drawCount: number }) => {
      if (!active) return;
      const next: CardInHand[] = [];
      for (const [index, id] of response.hand.entries()) {
        const card = SKILL_CARD_BY_ID[id];
        if (!card) {
          setError(`Máy chủ gửi lá bài không xác định: ${id}`);
          return;
        }
        next.push({
          card,
          instanceId: `${id}_${index}`,
          isUsable: true,
          cooldownRemaining: 0,
          usesRemaining: 1,
        });
      }
      setCards(next);
    };
    const onDrawOffer = (offer: { gameId: string; offeredBy: string }) => {
      if (active && offer.gameId === gameId && connected) {
        showDrawOffer(offer.offeredBy, connected);
      }
    };
    const onDrawOfferResult = (result: DrawOfferResult) => {
      if (!active || result.gameId !== gameId) return;
      setDrawOfferPending(false);
      promptedDrawOfferBy.current = null;
      if (result.accepted) {
        setNotice('Hai bên đã đồng ý hòa.');
      } else if (result.offeredBy === playerId) {
        setNotice(result.reason === 'opponent_moved'
          ? 'Đề nghị hòa đã hết hiệu lực sau nước đi của đối thủ.'
          : 'Đối thủ đã từ chối đề nghị hòa.');
      }
    };
    const onConnect = () => {
      setIsConnected(true);
      join();
    };
    const onDisconnect = () => setIsConnected(false);

    getServerSocket().then(current => {
      if (!active) return;
      connected = current;
      setSocket(current);
      setIsConnected(current.connected);
      current.on('game:updated', update);
      current.on('game:finished', update);
      current.on('game:reward', onReward);
      current.on('game:cards', onCards);
      current.on('game:draw_offer', onDrawOffer);
      current.on('game:draw_offer_result', onDrawOfferResult);
      current.on('exception', onError);
      current.on('connect', onConnect);
      current.on('disconnect', onDisconnect);
      if (current.connected) join();
    }).catch(reason => {
      if (active) setError(reason instanceof Error ? reason.message : 'Mất kết nối máy chủ.');
    });

    return () => {
      active = false;
      connected?.off('game:updated', update);
      connected?.off('game:finished', update);
      connected?.off('game:reward', onReward);
      connected?.off('game:cards', onCards);
      connected?.off('game:draw_offer', onDrawOffer);
      connected?.off('game:draw_offer_result', onDrawOfferResult);
      connected?.off('exception', onError);
      connected?.off('connect', onConnect);
      connected?.off('disconnect', onDisconnect);
    };
  }, [gameId, playerId, showDrawOffer]);

  useEffect(() => {
    if (!game || (game.state !== 'IN_PROGRESS' && game.state !== 'CHECK')) return undefined;
    const interval = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [game?.fen, game?.state, game?.turn]);

  const engine = useMemo(() => game ? new Chess(game.fen) : null, [game?.fen]);
  const board = useMemo(() => game ? boardFromFen(game.fen) : null, [game?.fen]);
  const validMoves = useMemo(() => {
    if (targetingCard && board) {
      return cardTargetPositions(
        targetingCard.card.effectType,
        board,
        color,
        targetingFrom,
        game?.moves?.length ?? 0,
      );
    }
    if (!engine || !selected || game?.turn !== color || game?.state === 'FINISHED') return [];
    if (game?.skillEffects?.some(effect => effect.type === 'frozen' && effect.square === toAlgebraic(selected))) return [];
    return engine.moves({ square: toAlgebraic(selected) as any, verbose: true })
      .filter(move => !game?.skillEffects?.some(effect =>
        (effect.type === 'protected' || effect.type === 'matrix') && effect.square === move.to,
      ))
      .map(move => ({
      row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97,
    }));
  }, [engine, selected, game?.turn, game?.state, game?.skillEffects, color, targetingCard, targetingFrom, board, game?.moves?.length]);
  const lastMove = useMemo(() => {
    const moves = game?.moves;
    const move = moves?.[moves.length - 1];
    if (!move || !/^[a-h][1-8]$/.test(move.from) || !/^[a-h][1-8]$/.test(move.to)) return null;
    return { from: fromAlgebraic(move.from), to: fromAlgebraic(move.to) };
  }, [game?.moves]);

  const isFinished = game?.state === 'FINISHED' || game?.state === 'ABORTED';
  const isMyTurn = game?.turn === color && (game?.state === 'IN_PROGRESS' || game?.state === 'CHECK');
  const opponentColor = color === 'w' ? 'b' : 'w';
  const opponentTime = opponentColor === 'w' ? game?.whiteTimeMs ?? 0 : game?.blackTimeMs ?? 0;
  const playerTime = color === 'w' ? game?.whiteTimeMs ?? 0 : game?.blackTimeMs ?? 0;
  const elapsedOnTurn = game && game.turn === color && !isFinished ? clockNow - receivedAt.current : 0;
  const elapsedOnOpponentTurn = game && game.turn === opponentColor && !isFinished
    ? clockNow - receivedAt.current
    : 0;
  const activeGame = !!game && !isFinished;
  const canCounter = !!game?.lastSkillCardBy && game.lastSkillCardBy !== color;
  const handCards = cards.map(card => ({
    ...card,
    isUsable: card.card.effectType === 'nope'
      ? canCounter
      : card.card.effectType === 'copy'
        ? isMyTurn && canCounter && !game?.skillCardUsedThisTurn?.[color]
        : card.card.effectType === 'block'
          ? isMyTurn && (game?.skillCardCounts?.[opponentColor] ?? 0) > 0 && !game?.skillCardUsedThisTurn?.[color]
          : isMyTurn && !game?.skillCardUsedThisTurn?.[color],
  }));
  const sendSkillCard = (card: CardInHand, targets: Record<string, string> = {}) => {
    if (!socket?.connected || !activeGame) return;
    socket.emit('game:use_card', { gameId, cardId: card.card.id, ...targets });
    setTargetingCard(null);
    setTargetingFrom(null);
    setSelectedCard(null);
    setNotice(`${card.card.name} đã được kích hoạt.`);
  };
  const useSkillCard = (card: CardInHand) => {
    const targeted = new Set([
      'pawn_step', 'freeze', 'trump', 'high_risk', 'arsenal', 'portal',
      'start', 'fortune', 'bring_back', 'transformer', 'tele', 'mosquito',
    ]);
    setNotice(null);
    if (!targeted.has(card.card.effectType)) {
      sendSkillCard(card);
      return;
    }
    setTargetingCard(card);
    setTargetingFrom(null);
    setNotice(`Chọn mục tiêu cho ${card.card.name}.`);
  };

  const onSquarePress = (position: BoardPosition) => {
    if (!board || !game || !isMyTurn || !socket?.connected) return;
    if (targetingCard) {
      const effect = targetingCard.card.effectType;
      const piece = board[position.row][position.col];
      const ownColor = color === 'w' ? 'white' : 'black';
      if (effect === 'portal' || effect === 'start') {
        if (!targetingFrom) {
          const valid = effect === 'portal'
            ? !!piece && piece.color === ownColor && piece.type !== 'king'
            : !!piece && piece.color === ownColor && piece.type === 'pawn'
              && position.row === 6 && game.moves?.length === 0;
          if (valid) setTargetingFrom(position);
          return;
        }
        const valid = effect === 'portal'
          ? !!piece && piece.color === ownColor && piece.type !== 'king'
            && (position.row !== targetingFrom.row || position.col !== targetingFrom.col)
          : !!piece && piece.color === ownColor
            && position.row === 7 && position.col === targetingFrom.col;
        if (valid) {
          sendSkillCard(targetingCard, {
            fromSquare: toAlgebraic(targetingFrom),
            toSquare: toAlgebraic(position),
          });
        }
        return;
      }
      if (effect === 'tele') {
        if (piece?.color === ownColor) sendSkillCard(targetingCard, { square: toAlgebraic(position) });
        return;
      }
      const square = toAlgebraic(position);
      if (effect === 'trump') {
        sendSkillCard(targetingCard, { square });
      } else if (effect === 'fortune' || effect === 'bring_back') {
        if (piece) return;
        const targets: Record<string, string> = { square };
        if (effect === 'bring_back') {
          const captured = [...(game.moves ?? [])].reverse().find(move =>
            move.playerId !== playerId && !!move.captured,
          )?.captured;
          if (!captured || !['p', 'n', 'b', 'r', 'q'].includes(captured)) {
            setNotice('Bạn chưa có quân phù hợp để hồi sinh.');
            return;
          }
          targets.pieceType = captured;
        }
        sendSkillCard(targetingCard, targets);
      } else if (['freeze', 'high_risk', 'mosquito'].includes(effect)) {
        if (piece && piece.color !== ownColor) sendSkillCard(targetingCard, { square });
      } else if (piece && piece.color === ownColor) {
        sendSkillCard(targetingCard, { square });
      }
      return;
    }
    if (selected && validMoves.some(move => move.row === position.row && move.col === position.col)) {
      socket.emit('game:move', {
        gameId,
        move: { gameId, from: toAlgebraic(selected), to: toAlgebraic(position), promotion: 'q' },
      });
      setSelected(null);
      return;
    }
    const piece = board[position.row][position.col];
    setSelected(piece && piece.color === (color === 'w' ? 'white' : 'black') ? position : null);
  };

  const resign = () => Alert.alert('Đầu hàng', 'Bạn có chắc chắn muốn đầu hàng ván này?', [
    { text: 'Tiếp tục chơi', style: 'cancel' },
    { text: 'Đầu hàng', style: 'destructive', onPress: () => socket?.emit('game:resign', { gameId }) },
  ]);

  const offerDraw = () => {
    if (!socket?.connected || !activeGame || drawOfferPending) return;
    Alert.alert('Đề nghị hòa', 'Gửi lời đề nghị hòa cho đối thủ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Gửi đề nghị',
        onPress: () => {
          setNotice(null);
          setDrawOfferPending(true);
          socket.emit('game:draw_offer', { gameId });
        },
      },
    ]);
  };

  const exitMatch = () => {
    if (isFinished) {
      navigation.navigate('MainTabs', { screen: 'Home' });
      return;
    }
    Alert.alert('Thoát trận', 'Thoát ván đang diễn ra sẽ tính là đầu hàng. Bạn muốn tiếp tục?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Thoát trận',
        style: 'destructive',
        onPress: () => {
          socket?.emit('game:resign', { gameId });
          navigation.navigate('MainTabs', { screen: 'Home' });
        },
      },
    ]);
  };

  const statusText = !game
    ? 'Đang kết nối với đối thủ...'
    : isFinished
      ? game.winner === 'draw'
        ? 'VÁN ĐẤU HÒA'
        : game.winner === color
          ? 'BẠN ĐÃ CHIẾN THẮNG'
          : 'VÁN ĐẤU ĐÃ KẾT THÚC'
      : isMyTurn
        ? 'LƯỢT CỦA BẠN'
        : 'ĐANG CHỜ ĐỐI THỦ';
  const timeControl = game?.modeConfig?.timeControlId?.toUpperCase() ?? 'ĐẤU TRỰC TUYẾN';
  const canSendAction = activeGame && isConnected;

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thoát trận"
            onPress={exitMatch}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>×</Text>
          </Pressable>
          <View style={styles.headerTitle}>
            <Text style={styles.title} numberOfLines={1}>Đấu trường Ma Pháp</Text>
            <Text style={styles.subtitle}>PvP trực tuyến</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cài đặt"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Settings' })}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>⚙</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Hồ sơ"
            onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>♙</Text>
          </Pressable>
        </View>

        <View style={styles.matchBar}>
          <Text style={styles.matchType}>
            {timeControl} · {game?.ranked ? 'ĐẤU XẾP HẠNG' : 'ĐẤU THƯỜNG'}
          </Text>
          <Text style={[styles.connection, isConnected ? styles.connected : styles.disconnected]}>
            ● {isConnected ? 'ỔN ĐỊNH' : 'MẤT KẾT NỐI'}
          </Text>
        </View>

        <PlayerPanel
          name={opponentId ? 'Đối thủ' : 'Đang chờ đối thủ'}
          color={opponentColor}
          time={formatClock(opponentTime - elapsedOnOpponentTurn)}
          isActive={!!game && game.turn === opponentColor && !isFinished}
          isCurrentPlayer={false}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {board && game ? (
          <View style={styles.boardArea}>
            <ChessBoard
              board={board}
              selectedSquare={selected}
              validMoves={validMoves}
              effectSquares={(game.skillEffects ?? [])
                .filter(effect => effect.movesRemaining > 0 && effect.square)
                .map(effect => fromAlgebraic(effect.square!))}
              lastMove={lastMove}
              onSquarePress={onSquarePress}
              isFlipped={boardFlipped}
              isInteractive={!!isMyTurn && isConnected}
            />
          </View>
        ) : (
          <View style={styles.boardLoading}>
            <Text style={styles.loadingText}>Đang tải bàn cờ...</Text>
          </View>
        )}

        <View style={styles.statusBar}>
          <Text style={[styles.statusDot, isMyTurn && styles.myTurnDot]}>●</Text>
          <Text style={styles.statusText}>{statusText}</Text>
          {game && <Text style={styles.moveCount}>NƯỚC {game.moves?.length ?? 0}</Text>}
        </View>

        <PlayerPanel
          name={playerName}
          color={color}
          time={formatClock(playerTime - elapsedOnTurn)}
          isActive={!!isMyTurn}
          isCurrentPlayer
        />

        <CardHand
          cards={handCards}
          selectedCard={selectedCard}
          onSelectCard={setSelectedCard}
          onUseCard={useSkillCard}
          isPlayerTurn
          targetingCardId={targetingCard?.card.id}
        />

        {notice && <Text style={styles.notice}>{notice}</Text>}
        {reward && (
          <Text style={styles.reward}>
            {reward.status === 'failed'
              ? 'Phần thưởng đang chờ xử lý lại.'
              : `+${reward.currency ?? 0} vàng · +${reward.experience ?? 0} kinh nghiệm`}
          </Text>
        )}

        <View style={styles.actions}>
          {activeGame ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={!canSendAction || drawOfferPending}
                onPress={offerDraw}
                style={[styles.actionButton, styles.drawButton, (!canSendAction || drawOfferPending) && styles.disabledButton]}
              >
                <Text style={styles.actionIcon}>♧</Text>
                <Text style={styles.actionText}>{drawOfferPending ? 'Chờ hòa' : 'Hòa'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!canSendAction}
                onPress={resign}
                style={[styles.actionButton, styles.resignButton, !canSendAction && styles.disabledButton]}
              >
                <Text style={[styles.actionIcon, styles.resignIcon]}>⚑</Text>
                <Text style={styles.actionText}>Đầu hàng</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setBoardFlipped(value => !value)}
                style={[styles.actionButton, styles.boardButton]}
              >
                <Text style={styles.actionIcon}>↻</Text>
                <Text style={styles.actionText}>Xoay bàn</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
              style={[styles.actionButton, styles.homeButton]}
            >
              <Text style={styles.actionText}>Về trang chủ</Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#101318',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C2027',
    borderRadius: 12,
  },
  headerButtonText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  matchBar: {
    minHeight: 34,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C2027',
    gap: SPACING.sm,
  },
  matchType: {
    color: COLORS.accentLight,
    fontWeight: '800',
    fontSize: 11,
    flexShrink: 1,
  },
  connection: {
    fontSize: 10,
    fontWeight: '700',
  },
  connected: {
    color: COLORS.success,
  },
  disconnected: {
    color: COLORS.danger,
  },
  playerPanel: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2E37',
    backgroundColor: '#20242C',
  },
  activePlayerPanel: {
    borderColor: COLORS.accent,
  },
  playerBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#171A20',
  },
  currentPlayerBadge: {
    backgroundColor: COLORS.primaryDark,
  },
  playerBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 24,
  },
  playerDetails: {
    flex: 1,
    minWidth: 0,
  },
  playerName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  playerSubtext: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  clockBox: {
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 10,
    backgroundColor: '#101318',
  },
  activeClockBox: {
    backgroundColor: '#302315',
  },
  clockText: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  activeClockText: {
    color: COLORS.accentLight,
  },
  boardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 0,
  },
  boardLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
  },
  statusBar: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: 12,
    backgroundColor: '#1C2027',
  },
  statusDot: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  myTurnDot: {
    color: COLORS.accentLight,
  },
  statusText: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  moveCount: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  error: {
    color: COLORS.danger,
    textAlign: 'center',
    fontSize: 12,
  },
  notice: {
    color: COLORS.accentLight,
    textAlign: 'center',
    fontSize: 11,
  },
  reward: {
    color: COLORS.success,
    textAlign: 'center',
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: 12,
    backgroundColor: '#1C2027',
  },
  drawButton: {
    borderWidth: 1,
    borderColor: '#267B89',
  },
  resignButton: {
    borderWidth: 1,
    borderColor: '#7D3E46',
  },
  resignIcon: {
    color: '#FF8B92',
  },
  boardButton: {
    borderWidth: 1,
    borderColor: '#3A3E47',
  },
  homeButton: {
    backgroundColor: COLORS.primaryDark,
  },
  actionIcon: {
    color: '#61D8E5',
    fontSize: 18,
    fontWeight: '700',
  },
  actionText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.45,
  },
});
