import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { COLORS } from '../../constants/theme';

const MOCK_HISTORY = [
  { id: '1', date: '2023-10-01', opponent: 'Player123', result: 'win', duration: '10:23' },
  { id: '2', date: '2023-10-02', opponent: 'ChessMaster', result: 'loss', duration: '15:40' },
  { id: '3', date: '2023-10-02', opponent: 'Bot_Hard', result: 'draw', duration: '20:00' },
];

export const HistoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch Sử Trận Đấu</Text>
      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <View>
              <Text style={styles.opponentName}>{item.opponent}</Text>
              <Text style={styles.date}>{item.date} • {item.duration}</Text>
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
