import React, { useEffect, useMemo, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Chess } from 'chess.js';
import { Socket } from 'socket.io-client';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { GradientButton } from '../../components/common/GradientButton';
import { COLORS, SPACING } from '../../constants/theme';
import { RootStackParamList } from '../../navigation/types';
import { getServerSocket } from '../../services/websocket/serverSocket';
import { BoardPosition, BoardState, ChessPiece, PieceType } from '../../types/chess';
import { toAlgebraic } from '../../utils/chessUtils';

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

export const OnlineGameScreen: React.FC = () => {
  const route = useRoute<OnlineRoute>();
  const navigation = useNavigation<OnlineNavigation>();
  const { gameId, color, opponentId, playerId } = route.params;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [game, setGame] = useState<ServerGameState | null>(null);
  const [selected, setSelected] = useState<BoardPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let connected: Socket | null = null;
    const join = () => connected?.emit('game:join', { gameId });
    const update = (next: ServerGameState) => {
      if (next.gameId !== gameId || !active) return;
      setGame(next);
      setSelected(null);
      setError(null);
    };
    const onError = (reason: { message?: string }) => setError(reason?.message || 'Nước đi không hợp lệ');
    getServerSocket().then(current => {
      if (!active) return;
      connected = current;
      setSocket(current);
      current.on('game:updated', update);
      current.on('exception', onError);
      current.on('connect', join);
      join();
    }).catch(reason => setError(reason instanceof Error ? reason.message : 'Mất kết nối'));
    return () => {
      active = false;
      connected?.off('game:updated', update);
      connected?.off('exception', onError);
      connected?.off('connect', join);
    };
  }, [gameId, playerId]);

  const engine = useMemo(() => game ? new Chess(game.fen) : null, [game?.fen]);
  const board = useMemo(() => game ? boardFromFen(game.fen) : null, [game?.fen]);
  const validMoves = useMemo(() => {
    if (!engine || !selected || game?.turn !== color || game?.state === 'FINISHED') return [];
    return engine.moves({ square: toAlgebraic(selected) as any, verbose: true }).map(move => ({
      row: 8 - Number(move.to[1]), col: move.to.charCodeAt(0) - 97,
    }));
  }, [engine, selected, game?.turn, game?.state, color]);

  const onSquarePress = (position: BoardPosition) => {
    if (!board || !game || game.turn !== color || game.state === 'FINISHED') return;
    if (selected && validMoves.some(move => move.row === position.row && move.col === position.col)) {
      socket?.emit('game:move', {
        gameId,
        move: { gameId, from: toAlgebraic(selected), to: toAlgebraic(position), promotion: 'q' },
      });
      setSelected(null);
      return;
    }
    const piece = board[position.row][position.col];
    setSelected(piece && piece.color === (color === 'w' ? 'white' : 'black') ? position : null);
  };

  const resign = () => Alert.alert('Đầu hàng', 'Xác nhận đầu hàng ván này?', [
    { text: 'Hủy', style: 'cancel' },
      { text: 'Đầu hàng', style: 'destructive', onPress: () => socket?.emit('game:resign', { gameId }) },
  ]);

  const goHome = () => {
    if (game?.state === 'FINISHED') {
      navigation.navigate('MainTabs', { screen: 'Home' });
      return;
    }
    Alert.alert('Rời ván', 'Rời ván đang chơi sẽ tính là đầu hàng. Tiếp tục?', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Rời ván', style: 'destructive', onPress: () => {
        socket?.emit('game:resign', { gameId });
        navigation.navigate('MainTabs', { screen: 'Home' });
      } },
    ]);
  };

  return <SafeAreaView style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Đấu trực tuyến</Text>
      <Text style={styles.subtitle}>Đối thủ: {opponentId}</Text>
      <Text style={styles.subtitle}>Bạn chơi quân {color === 'w' ? 'trắng' : 'đen'}</Text>
    </View>
    {error && <Text style={styles.error}>{error}</Text>}
    {board && game ? <>
      <ChessBoard board={board} selectedSquare={selected} validMoves={validMoves}
        lastMove={null} onSquarePress={onSquarePress} isFlipped={color === 'b'}
        isInteractive={game.turn === color && game.state !== 'FINISHED'} />
      <Text style={styles.status}>{game.state === 'FINISHED'
        ? `Ván đã kết thúc: ${game.endReason || 'hòa'}${game.winner ? ` (${game.winner})` : ''}`
        : game.turn === color ? 'Đến lượt bạn' : 'Đang chờ đối thủ'}</Text>
      <Text style={styles.clock}>Trắng {Math.ceil(game.whiteTimeMs / 1000)}s  ·  Đen {Math.ceil(game.blackTimeMs / 1000)}s</Text>
    </> : <Text style={styles.status}>Đang tải ván cờ...</Text>}
    <View style={styles.actions}>
      {game?.state !== 'FINISHED' && <GradientButton title="Đầu hàng" onPress={resign} variant="outline" size="small" />}
      <GradientButton title="Trang chủ" onPress={goHome} size="small" />
    </View>
  </SafeAreaView>;
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'space-around' },
  header: { padding: SPACING.lg },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: COLORS.textSecondary, marginTop: SPACING.sm },
  status: { color: COLORS.textPrimary, textAlign: 'center', fontSize: 18 },
  clock: { color: COLORS.textSecondary, textAlign: 'center' },
  error: { color: '#ef4444', textAlign: 'center', padding: SPACING.md },
  actions: { flexDirection: 'row', justifyContent: 'space-around', padding: SPACING.lg },
});
