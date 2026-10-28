import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../../constants/theme';
import { useHistoryStore } from '../../store/historyStore';
import { formatDate } from '../../utils/formatCurrency';
import { apiService } from '../../services/api/apiService';
import { useAuthStore } from '../../store/authStore';
import { GradientButton } from '../../components/common/GradientButton';

export const HistoryScreen = () => {
  const entries = useHistoryStore(state => state.entries);
  const { isAuthenticated, userId } = useAuthStore();
  const [onlineGames, setOnlineGames] = useState<Array<{
    id: string; status: string; winner_id: string | null; created_at: string;
    match_players: Array<{ user_id: string; color: 'WHITE' | 'BLACK' }>;
  }>>([]);
  const [onlineStatus, setOnlineStatus] = useState('');
  const loadOnline = async () => {
    setOnlineStatus('Đang tải lịch sử Supabase...');
    const response = await apiService.getGameHistory();
    if (response.error || !response.data) {
      setOnlineStatus(response.error || 'Không tải được lịch sử online');
      return;
    }
    setOnlineGames(response.data.matches);
    setOnlineStatus(response.data.matches.length ? '' : 'Chưa có ván online được lưu.');
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch Sử Trận Đấu</Text>
      {isAuthenticated && <GradientButton title="Tải lịch sử online" onPress={() => { void loadOnline(); }} size="small" />}
      {!!onlineStatus && <Text style={styles.date}>{onlineStatus}</Text>}
      {onlineGames.map(game => (
        <View key={game.id} style={styles.historyItem}>
          <View>
            <Text style={styles.opponentName}>Ván online {game.id}</Text>
            <Text style={styles.date}>{game.status} • {formatDate(game.created_at)}</Text>
          </View>
          <Text style={styles.resultText}>
            {!game.winner_id ? (game.status === 'DRAW' ? 'Hòa' : 'Đang chơi') : game.winner_id === userId ? 'Thắng' : 'Thua'}
          </Text>
        </View>
      ))}
      <FlatList
        data={entries}
        ListEmptyComponent={<Text style={styles.date}>Chưa có trận nào. Hãy chơi với bot để bắt đầu.</Text>}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.opponentName}>{item.opponent}</Text>
              <Text style={styles.date}>{formatDate(item.date)} • {item.duration}</Text>
            </View>
            <View style={[styles.resultBadge, item.result === 'win' ? styles.winBg : item.result === 'loss' ? styles.lossBg : styles.drawBg]}>
              <Text style={styles.resultText}>
                {item.result === 'win' ? 'Thắng' : item.result === 'loss' ? 'Thua' : 'Hòa'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  historyItem: {
    backgroundColor: COLORS.bgCard,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  opponentName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 5,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  winBg: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  lossBg: { backgroundColor: 'rgba(244, 67, 54, 0.2)' },
  drawBg: { backgroundColor: 'rgba(158, 158, 158, 0.2)' },
  resultText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
