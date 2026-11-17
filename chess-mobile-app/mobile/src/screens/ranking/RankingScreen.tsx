import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOW, SPACING } from '../../constants/arcane-theme';
import { apiService } from '../../services/api/apiService';
import { useArcaneThemeStore } from '../../store/arcaneThemeStore';
import { useAuthStore } from '../../store/authStore';
import { LeaderboardEntry } from '../../types/player';

type Palette = typeof COLORS;

const winRate = (entry: LeaderboardEntry) => {
  const total = entry.player.wins + entry.player.losses + entry.player.draws;
  return total ? Math.round((entry.player.wins / total) * 1000) / 10 : 0;
};

const medal = (rank: number) => rank === 1 ? '♛' : rank === 2 ? '♜' : '♝';

const RankingScreen = () => {
  const isDark = useArcaneThemeStore(state => state.isDark);
  const toggleTheme = useArcaneThemeStore(state => state.toggleTheme);
  const userId = useAuthStore(state => state.userId);
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await apiService.getLeaderboard(100);
    if (response.data) {
      setPlayers(response.data);
      setError(null);
    } else {
      setError(response.error || 'Không tải được bảng xếp hạng.');
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const topPlayers = players.slice(0, 3);
  const remainingPlayers = players.slice(3);
  const me = players.find(entry => entry.player.id === userId) ?? null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>ARCANE CHESS</Text>
          <Text style={styles.title}>Bảng xếp hạng mùa hiện tại</Text>
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đổi giao diện sáng tối" style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeButtonText}>{isDark ? 'Sáng' : 'Tối'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={colors.primary} />}
      >
        {loading && !players.length && (
          <View style={styles.stateBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>Đang tải thứ hạng từ Supabase…</Text>
          </View>
        )}

        {!!error && (
          <TouchableOpacity accessibilityRole="button" style={styles.errorBox} onPress={() => void load()}>
            <Text style={styles.errorTitle}>Không thể cập nhật bảng xếp hạng</Text>
            <Text style={styles.errorText}>{error} Chạm để thử lại.</Text>
          </TouchableOpacity>
        )}

        {!loading && !error && !players.length && (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>Mùa giải chưa có kỳ thủ xếp hạng</Text>
            <Text style={styles.stateText}>Hoàn thành một trận xếp hạng để xuất hiện tại đây.</Text>
          </View>
        )}

        {!!topPlayers.length && (
          <View style={styles.podium}>
            {topPlayers.map(entry => (
              <View key={entry.player.id} style={[styles.podiumItem, entry.rank === 1 && styles.championItem]}>
                <Text style={styles.piece}>{medal(entry.rank)}</Text>
                <Text style={styles.rankLabel}>HẠNG {entry.rank}</Text>
                <Text style={styles.playerName} numberOfLines={1}>{entry.player.username}</Text>
                <Text style={styles.rating}>{entry.rating.toLocaleString('vi-VN')} ELO</Text>
                <Text style={styles.meta}>{winRate(entry)}% thắng · Cấp {entry.player.level}</Text>
              </View>
            ))}
          </View>
        )}

        {!!remainingPlayers.length && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Toàn máy chủ</Text>
            {remainingPlayers.map(entry => (
              <View key={entry.player.id} style={[styles.playerRow, entry.player.id === userId && styles.currentPlayerRow]}>
                <Text style={styles.rowRank}>{entry.rank}</Text>
                <View style={styles.initial}><Text style={styles.initialText}>{entry.player.username.slice(0, 2).toUpperCase()}</Text></View>
                <View style={styles.playerInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{entry.player.username}</Text>
                  <Text style={styles.rowMeta}>{entry.player.wins} thắng · {entry.player.draws} hòa · {entry.player.losses} thua</Text>
                </View>
                <Text style={styles.rowRating}>{entry.rating.toLocaleString('vi-VN')}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!!me && (
        <View style={styles.myRank}>
          <View>
            <Text style={styles.myRankLabel}>THỨ HẠNG CỦA BẠN</Text>
            <Text style={styles.myRankName} numberOfLines={1}>{me.player.username}</Text>
          </View>
          <View style={styles.myRankNumbers}>
            <Text style={styles.myRankPosition}>#{me.rank}</Text>
            <Text style={styles.myRankRating}>{me.rating.toLocaleString('vi-VN')} ELO</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDark,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { color: colors.primary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 1.2 },
  title: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, marginTop: SPACING.xs },
  themeButton: { minHeight: 44, minWidth: 56, alignItems: 'center', justifyContent: 'center', borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceElevated },
  themeButtonText: { color: colors.textPrimary, fontWeight: FONT_WEIGHT.bold },
  content: { padding: SPACING.lg, paddingBottom: 140 },
  stateBox: { alignItems: 'center', paddingVertical: SPACING.xxl, gap: SPACING.md },
  stateText: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 21 },
  emptyTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  errorBox: { backgroundColor: colors.accentRed + '18', borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg },
  errorTitle: { color: colors.accentRed, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  errorText: { color: colors.textSecondary, fontSize: FONT_SIZE.sm, marginTop: SPACING.xs, lineHeight: 20 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm, marginBottom: SPACING.xl },
  podiumItem: { flex: 1, minWidth: 0, backgroundColor: colors.backgroundCard, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, alignItems: 'center' },
  championItem: { paddingVertical: SPACING.xl, backgroundColor: colors.surfaceElevated, ...SHADOW.md },
  piece: { color: colors.primary, fontSize: 30 },
  rankLabel: { color: colors.textMuted, fontSize: 10, fontWeight: FONT_WEIGHT.bold, marginTop: SPACING.xs },
  playerName: { color: colors.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, maxWidth: '100%', marginTop: SPACING.sm },
  rating: { color: colors.primary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, marginTop: SPACING.xs },
  meta: { color: colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: SPACING.xs },
  listSection: { gap: SPACING.sm },
  sectionTitle: { color: colors.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.xs },
  playerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.backgroundCard, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, minHeight: 68 },
  currentPlayerRow: { backgroundColor: colors.primary + '18' },
  rowRank: { width: 32, color: colors.textSecondary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  initial: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, marginHorizontal: SPACING.md },
  initialText: { color: colors.primary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold },
  playerInfo: { flex: 1, minWidth: 0 },
  rowName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  rowMeta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
  rowRating: { color: colors.primary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, marginLeft: SPACING.sm },
  myRank: { position: 'absolute', left: SPACING.lg, right: SPACING.lg, bottom: SPACING.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.backgroundDark, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, ...SHADOW.lg },
  myRankLabel: { color: colors.primary, fontSize: 10, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 0.8 },
  myRankName: { color: colors.textPrimary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, marginTop: 3, maxWidth: 190 },
  myRankNumbers: { alignItems: 'flex-end' },
  myRankPosition: { color: colors.textPrimary, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold },
  myRankRating: { color: colors.textSecondary, fontSize: FONT_SIZE.xs, marginTop: 2 },
});

export default RankingScreen;
