import React, { useCallback, useEffect, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Socket } from 'socket.io-client';
import { BORDER_RADIUS, COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import { getServerSocket } from '../../services/websocket/serverSocket';
import { useAuthStore } from '../../store/authStore';

interface RoomPlayer {
  userId: string;
  username: string;
  ready: boolean;
}

interface Room {
  id: string;
  code: string;
  name: string;
  hostId: string;
  hostUsername: string;
  timeControlMinutes: number;
  whitePlayer: RoomPlayer | null;
  blackPlayer: RoomPlayer | null;
  messages?: Message[];
}

interface Message {
  id: string;
  senderName: string;
  text: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onGameStart: (game: { gameId: string; color: 'w' | 'b'; opponentId: string; playerId: string }) => void;
}

export const RoomManagerModal = ({ visible, onClose, onGameStart }: Props) => {
  const userId = useAuthStore(state => state.userId);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [ready, setReady] = useState(false);
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((target: Socket) => {
    target.emit('room:list', {}, (response: { data?: Room[]; error?: string }) => {
      if (response?.data) {
        setRooms(response.data);
      }
      if (response?.error) {
        setError(response.error);
      }
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    let active = true;
    let current: Socket | null = null;
    const connect = async () => {
      try {
        current = await getServerSocket();
        if (!active) {
          return;
        }
        setSocket(current);
        setError(null);
        refresh(current);
        const onUpdated = (updated: Room) => {
          setRoom(previous => previous?.id === updated.id ? updated : previous);
        };
        const onListUpdated = () => current && refresh(current);
        const onMessage = ({ message }: { message: Message }) => setMessages(previous => [...previous, message]);
        const onClosed = () => { setRoom(null); setMessages([]); setError('Phòng đã đóng.'); };
        const onStarted = ({ room: startedRoom, game }: { room: Room; game: { gameId?: string; id?: string } }) => {
          const color: 'w' | 'b' = startedRoom.whitePlayer?.userId === userId ? 'w' : 'b';
          const opponentId = color === 'w'
            ? startedRoom.blackPlayer?.userId
            : startedRoom.whitePlayer?.userId;
          setRoom(null);
          setMessages([]);
          onGameStart({ gameId: game.gameId || game.id || '', color, opponentId: opponentId || '', playerId: userId || '' });
        };
        current.on('room:updated', onUpdated);
        current.on('room:list_updated', onListUpdated);
        current.on('room:chat_message', onMessage);
        current.on('room:closed', onClosed);
        current.on('room:game_started', onStarted);
        return () => {
          current?.off('room:updated', onUpdated);
          current?.off('room:list_updated', onListUpdated);
          current?.off('room:chat_message', onMessage);
          current?.off('room:closed', onClosed);
          current?.off('room:game_started', onStarted);
        };
      } catch (connectError: any) {
        if (active) {
          setError(connectError?.message || 'Không kết nối được máy chủ');
        }
      }
      return undefined;
    };
    let removeListeners: (() => void) | undefined;
    connect().then(cleanup => { removeListeners = cleanup; });
    return () => {
      active = false;
      removeListeners?.();
    };
  }, [onGameStart, refresh, userId, visible]);

  const handleResponse = (response: { data?: any; error?: string }, onSuccess: (data: any) => void) => {
    setBusy(false);
    if (response?.error || !response?.data) {
      setError(response?.error || 'Máy chủ không trả về dữ liệu');
      return;
    }
    setError(null);
    onSuccess(response.data);
  };

  const createRoom = () => {
    if (!socket) {
      return;
    }
    setBusy(true);
    socket.emit('room:create', { name: name.trim() || undefined, timeControlMinutes: 5 }, response => {
      handleResponse(response, created => { setRoom(created); setReady(true); setMessages([]); });
    });
  };

  const joinRoom = (roomCode = code) => {
    if (!socket || !roomCode.trim()) {
      return;
    }
    setBusy(true);
    socket.emit('room:join', { roomIdOrCode: roomCode.trim().toUpperCase() }, response => {
      handleResponse(response, joined => { setRoom(joined.room); setReady(false); setMessages(joined.room.messages || []); });
    });
  };

  const leaveRoom = () => {
    if (socket && room) {
      socket.emit('room:leave', { roomId: room.id });
    }
    setRoom(null);
    setMessages([]);
    setReady(false);
  };

  const close = () => {
    leaveRoom();
    onClose();
  };

  const toggleReady = () => {
    if (!socket || !room) {
      return;
    }
    const next = !ready;
    setReady(next);
    socket.emit('room:ready', { roomId: room.id, ready: next });
  };

  const sendChat = () => {
    if (!socket || !room || !chat.trim()) {
      return;
    }
    socket.emit('room:chat', { roomId: room.id, text: chat.trim() });
    setChat('');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{room ? room.name : 'Phòng tùy chỉnh'}</Text>
          <TouchableOpacity onPress={close}><Text style={styles.link}>Đóng</Text></TouchableOpacity>
        </View>
        {!!error && <TouchableOpacity style={styles.error} onPress={() => socket && refresh(socket)}><Text style={styles.text}>{error} · Thử lại</Text></TouchableOpacity>}
        {!room ? (
          <ScrollView contentContainerStyle={styles.body}>
            <Text style={styles.label}>Tạo phòng mới</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Tên phòng" placeholderTextColor={COLORS.textMuted} maxLength={40} />
            <TouchableOpacity style={styles.primaryButton} onPress={createRoom} disabled={busy}>
              <Text style={styles.primaryText}>{busy ? 'Đang xử lý...' : 'Tạo phòng 5 phút'}</Text>
            </TouchableOpacity>
            <Text style={styles.label}>Tham gia bằng mã</Text>
            <View style={styles.row}>
              <TextInput style={[styles.input, styles.flex]} value={code} onChangeText={setCode} autoCapitalize="characters" maxLength={6} placeholder="Mã 6 ký tự" placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.smallButton} onPress={() => joinRoom()}><Text style={styles.link}>Vào</Text></TouchableOpacity>
            </View>
            <Text style={styles.label}>Phòng đang chờ</Text>
            {rooms.length === 0 && <Text style={styles.muted}>Chưa có phòng công khai.</Text>}
            {rooms.map(item => (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => joinRoom(item.code)}>
                <View style={styles.flex}><Text style={styles.text}>{item.name}</Text><Text style={styles.muted}>{item.hostUsername} · {item.timeControlMinutes} phút</Text></View>
                <Text style={styles.link}>Tham gia</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.body}>
            <View style={styles.codeBox}><Text style={styles.muted}>MÃ PHÒNG</Text><Text style={styles.code}>{room.code}</Text></View>
            <View style={styles.players}>
              <Text style={styles.text}>♔ {room.whitePlayer?.username || 'Đang chờ'} {room.whitePlayer?.ready ? '✓' : ''}</Text>
              <Text style={styles.text}>♚ {room.blackPlayer?.username || 'Đang chờ'} {room.blackPlayer?.ready ? '✓' : ''}</Text>
            </View>
            <ScrollView style={styles.chatBox}>{messages.map(message => <Text key={message.id} style={styles.text}><Text style={styles.link}>{message.senderName}: </Text>{message.text}</Text>)}</ScrollView>
            <View style={styles.row}><TextInput style={[styles.input, styles.flex]} value={chat} onChangeText={setChat} placeholder="Tin nhắn" placeholderTextColor={COLORS.textMuted} onSubmitEditing={sendChat} /><TouchableOpacity style={styles.smallButton} onPress={sendChat}><Text style={styles.link}>Gửi</Text></TouchableOpacity></View>
            <View style={styles.row}>
              <TouchableOpacity style={styles.smallButton} onPress={toggleReady}><Text style={styles.link}>{ready ? 'Hủy sẵn sàng' : 'Sẵn sàng'}</Text></TouchableOpacity>
              {room.hostId === userId && <TouchableOpacity style={styles.primaryButton} onPress={() => socket?.emit('room:start', { roomId: room.id }, (response: { error?: string }) => response?.error && setError(response.error))}><Text style={styles.primaryText}>Bắt đầu</Text></TouchableOpacity>}
              <TouchableOpacity style={styles.smallButton} onPress={leaveRoom}><Text style={styles.danger}>Rời phòng</Text></TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
  title: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, fontWeight: '700' },
  body: { flex: 1, padding: SPACING.lg, gap: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  flex: { flex: 1 },
  label: { color: COLORS.textSecondary, fontWeight: '700', marginTop: SPACING.sm },
  text: { color: COLORS.textPrimary },
  muted: { color: COLORS.textMuted },
  link: { color: COLORS.primary, fontWeight: '700' },
  danger: { color: '#ef4444', fontWeight: '700' },
  input: { backgroundColor: COLORS.bgCard, color: COLORS.textPrimary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  primaryButton: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center' },
  primaryText: { color: '#1A1205', fontWeight: '800' },
  smallButton: { backgroundColor: COLORS.bgCard, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bgCard, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  error: { backgroundColor: 'rgba(239,68,68,0.16)', padding: SPACING.md },
  codeBox: { alignItems: 'center', backgroundColor: COLORS.bgCard, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md },
  code: { color: COLORS.primary, fontSize: 28, fontWeight: '800', letterSpacing: 4 },
  players: { gap: SPACING.sm, backgroundColor: COLORS.bgCard, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  chatBox: { flex: 1, backgroundColor: COLORS.bgCard, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
});
