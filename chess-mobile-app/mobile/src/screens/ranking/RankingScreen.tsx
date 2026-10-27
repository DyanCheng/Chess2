import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, StatusBar } from 'react-native';
import { COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/arcane-theme';

const AVATAR_IMG = require('../../assets/images/champion_avatar.png');

// ============================================================
// THEME (Dark / Light) - same pattern as the other screens
// ============================================================
type Palette = typeof COLORS;
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggle: () => void;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  onNavigate?: (id: string) => void;
} | null>(null);
const useTheme = () => React.useContext(ThemeContext)!;

// ============================================================
// DATA
// ============================================================
const SCOPES = [
  { id: 'server', label: 'Toàn Server', icon: '🌐' },
  { id: 'friends', label: 'Bạn Bè', icon: '👥' },
  { id: 'guild', label: 'Bang Hội', icon: '🛡️' },
];

const MODES = [
  { id: 'blitz', label: '⚡ Blitz (Chớp)' },
  { id: 'rapid', label: '⏱ Rapid (Nhanh)' },
  { id: 'bullet', label: '🔫 Bullet (Siêu tốc)' },
];

const TABS = [
  { id: 'home', label: 'Trang chủ', icon: '🛡️' },
  { id: 'modes', label: 'Chế độ', icon: '⚔️' },
  { id: 'puzzle', label: 'Giải đố', icon: '🧩' },
  { id: 'ranking', label: 'Xếp hạng', icon: '🏅' },
  { id: 'shop', label: 'Cửa hàng', icon: '🛒' },
];

type Trend = { dir: 'up' | 'down' | 'same'; n?: number };
const PLAYERS: { rank: number; name: string; title: string; elo: number; trend: Trend }[] = [
  { rank: 4, name: 'DarkBishop_GM', title: 'GM', elo: 2745, trend: { dir: 'up', n: 3 } },
  { rank: 5, name: 'GrandTactician', title: 'IM', elo: 2720, trend: { dir: 'up', n: 1 } },
  { rank: 6, name: 'DragonSlayer99', title: 'GM', elo: 2695, trend: { dir: 'down', n: 2 } },
  { rank: 7, name: 'QueenGambit_Pro', title: 'FM', elo: 2670, trend: { dir: 'up', n: 4 } },
  { rank: 8, name: 'EndgameMaster', title: 'IM', elo: 2650, trend: { dir: 'same' } },
  { rank: 9, name: 'PhantomKnight', title: 'CM', elo: 2635, trend: { dir: 'up', n: 2 } },
  { rank: 10, name: 'ImmortalPawn', title: 'FM', elo: 2610, trend: { dir: 'up', n: 1 } },
];

// ============================================================
// HEADER & TITLE
// ============================================================
const Header = () => {
  const { styles, isDark, toggle } = useTheme();
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <View style={styles.logoBox}><Text style={styles.logoIcon}>♚</Text></View>
        <Text style={styles.logoText}>ARCANE CHESS</Text>
      </View>
      <View style={styles.row}>
        <View style={styles.pill}><Text style={styles.pillText}>⚡ 48/50</Text></View>
        <TouchableOpacity style={styles.iconBtn} onPress={toggle}>
          <Text>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
        <View style={styles.iconBtn}>
          <Text>🔔</Text>
          <View style={styles.notifDot} />
        </View>
        <Image source={AVATAR_IMG} style={styles.headerAvatar} />
      </View>
    </View>
  );
};

const TitleBar = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.titleBar}>
      <View>
        <Text style={styles.eyebrow}>🏛 ĐẤU TRƯỜNG HUYỀN THOẠI</Text>
        <View style={[styles.row, { marginTop: 2 }]}>
          <Text style={styles.trophy}>🏆</Text>
          <Text style={styles.pageTitle}>BẢNG XẾP{'\n'}HẠNG MÙA 9</Text>
        </View>
      </View>
      <View style={styles.seasonPill}>
        <Text style={styles.seasonPillText}>🕒 Còn 14 ngày</Text>
      </View>
    </View>
  );
};

// ============================================================
// FILTERS
// ============================================================
const Filters = () => {
  const { styles, colors } = useTheme();
  const [scope, setScope] = useState('server');
  const [mode, setMode] = useState('blitz');

  return (
    <View>
      <View style={styles.scopeBar}>
        {SCOPES.map(s => {
          const active = scope === s.id;
          return (
            <TouchableOpacity key={s.id} style={[styles.scopeItem, active && styles.scopeActive]} onPress={() => setScope(s.id)}>
              <Text style={[styles.scopeText, active && { color: '#1A1205' }]}>{s.icon} {s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modeRow}>
        {MODES.map(m => {
          const active = mode === m.id;
          return (
            <TouchableOpacity key={m.id} style={[styles.modeChip, active && styles.modeChipActive]} onPress={() => setMode(m.id)}>
              <Text style={[styles.modeChipText, active && { color: '#1A1205' }]}>{m.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ============================================================
// PODIUM
// ============================================================
const Podium = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.podium}>
      {/* 2nd */}
      <View style={styles.podiumSide}>
        <Text style={styles.podiumPlace}>🥈 #2</Text>
        <View style={[styles.podiumAvatar, styles.avatarSilver]}>
          <Text style={styles.podiumInitial}>H</Text>
          <View style={styles.titleTag}><Text style={styles.titleTagText}>GM</Text></View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>Hikaru_Storm</Text>
        <Text style={styles.podiumNick}>Vua Đòn Chớp</Text>
        <View style={styles.podiumStatBox}>
          <Text style={styles.podiumStatElo}>2,815</Text>
          <Text style={styles.podiumStatLabel}>ELO</Text>
          <Text style={styles.podiumWin}>74.6% WR</Text>
        </View>
      </View>

      {/* 1st */}
      <View style={styles.podiumCenter}>
        <Text style={styles.crown}>👑</Text>
        <View style={styles.championTag}><Text style={styles.championTagText}>QUÁN QUÂN</Text></View>
        <View style={[styles.podiumAvatarBig, styles.avatarGold]}>
          <Image source={AVATAR_IMG} style={styles.avatarImg} />
          <View style={styles.topBadge}><Text style={styles.topBadgeText}>TOP 1</Text></View>
        </View>
        <Text style={styles.podiumNameBig} numberOfLines={1}>Magnus_A...</Text>
        <Text style={styles.podiumNick}>Đại Kiện Tướng Tối Cao</Text>
        <View style={[styles.podiumStatBox, styles.podiumStatBoxGold]}>
          <Text style={styles.podiumStatEloBig}>2,840</Text>
          <Text style={styles.podiumStatLabelGold}>ELO ĐỈNH PHONG</Text>
          <Text style={styles.podiumWin}>Thắng 78.2% 🔥</Text>
          <Text style={styles.podiumStreak}>Chuỗi 14 trận</Text>
        </View>
      </View>

      {/* 3rd */}
      <View style={styles.podiumSide}>
        <Text style={styles.podiumPlace}>🥉 #3</Text>
        <View style={[styles.podiumAvatar, styles.avatarBronze]}>
          <Text style={styles.podiumInitial}>V</Text>
          <View style={[styles.titleTag, { backgroundColor: COLORS_BRONZE }]}><Text style={styles.titleTagText}>WGM</Text></View>
        </View>
        <Text style={styles.podiumName} numberOfLines={1}>Valkyrie_Queen</Text>
        <Text style={styles.podiumNick}>Nữ Hoàng Tàn Cuộc</Text>
        <View style={styles.podiumStatBox}>
          <Text style={styles.podiumStatElo}>2,790</Text>
          <Text style={styles.podiumStatLabel}>ELO</Text>
          <Text style={styles.podiumWin}>72.1% WR</Text>
        </View>
      </View>
    </View>
  );
};
const COLORS_BRONZE = '#CD7F32';

// ============================================================
// LIST
// ============================================================
const TrendText = ({ t }: { t: Trend }) => {
  const { styles, colors } = useTheme();
  if (t.dir === 'same') return <Text style={[styles.trend, { color: colors.textMuted }]}>— Giữ hạng</Text>;
  const up = t.dir === 'up';
  return (
    <Text style={[styles.trend, { color: up ? colors.accentGreen : colors.accentRed }]}>
      {up ? '▲' : '▼'} {t.n} hạng
    </Text>
  );
};

const RankList = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.listWrap}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>☰ HẠNG 4 — 100</Text>
        <Text style={styles.listNote}>Chỉ số ELO • Phong độ</Text>
      </View>
      {PLAYERS.map(p => (
        <View key={p.rank} style={styles.playerRow}>
          <Text style={styles.playerRank}>{p.rank}</Text>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitial}>{p.name[0]}</Text>
            <View style={styles.playerTitle}><Text style={styles.playerTitleText}>{p.title}</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName} numberOfLines={1}>{p.name}</Text>
            <View style={styles.row}>
              <Text style={styles.playerElo}>{p.elo.toLocaleString('en-US')} ELO</Text>
              <TrendText t={p.trend} />
            </View>
          </View>
          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileBtnText}>Hồ Sơ ›</Text>
          </TouchableOpacity>
        </View>
      ))}
      <Text style={styles.moreText}>⌄ Cuộn để xem tiếp các Đại Kiện Tướng khác</Text>
    </View>
  );
};

// ============================================================
// MY RANK (pinned above tab bar)
// ============================================================
const MyRank = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.myCard}>
      <View style={styles.myTop}>
        <View style={styles.myAvatar}>
          <Image source={AVATAR_IMG} style={styles.avatarImg} />
          <View style={styles.playerTitle}><Text style={styles.playerTitleText}>GM</Text></View>
        </View>
        <View style={{ marginLeft: SPACING.sm }}>
          <Text style={styles.myName}>VortexGM...</Text>
          <Text style={styles.myElo}>1,450 ELO</Text>
        </View>
        <View style={styles.myRankBox}>
          <Text style={styles.myRankLabel}>HẠNG</Text>
          <Text style={styles.myRankValue}>#142</Text>
        </View>
        <Text style={styles.myTopText}>• Top 4.5%{'\n'}Server</Text>
        <TouchableOpacity style={styles.fightBtn}>
          <Text style={styles.fightText}>⚔ Đấu Ngay</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.myProgressRow}>
        <Text style={styles.myProgressLabel}>↗ Lên Đại Kiện Tướng (Grandmaster)</Text>
        <Text style={styles.myProgressValue}>1,450 / 1,600 ELO (75%)</Text>
      </View>
      <View style={styles.progressBg}><View style={[styles.progressFill, { width: '75%' }]} /></View>
      <View style={styles.myProgressRow}>
        <Text style={styles.myStreak}>🔥 Chuỗi 5 thắng (+28 LP hôm nay)</Text>
        <Text style={styles.myLeft}>Cần 150 ELO nữa</Text>
      </View>
    </View>
  );
};

// ============================================================
// TAB BAR
// ============================================================
const TabBar = () => {
  const { styles, colors, onNavigate } = useTheme();
  return (
    <View style={styles.tabBar}>
      {TABS.map(t => {
        const active = t.id === 'ranking';
        return (
          <TouchableOpacity key={t.id} style={styles.tabItem} onPress={() => onNavigate?.(t.id)}>
            <Text style={[styles.tabIcon, { opacity: active ? 1 : 0.5 }]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, { color: active ? colors.tabBarActive : colors.tabBarInactive }]}>{t.label}</Text>
            {active && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ============================================================
// SCREEN
// ============================================================
const RankingScreen = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [isDark, setIsDark] = useState(true);
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors), [isDark]);
  const ctx = React.useMemo(
    () => ({ isDark, toggle: () => setIsDark(v => !v), colors, styles, onNavigate }),
    [isDark, styles, onNavigate],
  );

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TitleBar />
          <Filters />
          <Podium />
          <RankList />
          <View style={{ height: 210 }} />
        </ScrollView>
        <MyRank />
        <TabBar />
      </View>
    </ThemeContext.Provider>
  );
};

// `COLORS` param intentionally shadows the import so styles follow the active theme.
const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center' },

  // header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, paddingTop: SPACING.xxl + 20,
    backgroundColor: COLORS.backgroundDark, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  logoBox: {
    width: 34, height: 34, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.backgroundCard,
    borderWidth: 1, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  logoIcon: { fontSize: 18, color: COLORS.primary },
  logoText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 1.5 },
  pill: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    borderColor: COLORS.accent + '55', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, marginRight: SPACING.sm,
  },
  pillText: { fontSize: FONT_SIZE.xs, color: COLORS.accent, fontWeight: FONT_WEIGHT.bold },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm,
  },
  notifDot: { position: 'absolute', top: 6, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accentRed },
  headerAvatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: COLORS.primary },

  // title
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  eyebrow: { fontSize: 9, color: COLORS.accent, letterSpacing: 1, fontWeight: FONT_WEIGHT.bold },
  trophy: { fontSize: 24, marginRight: SPACING.sm },
  pageTitle: { fontSize: FONT_SIZE.xxl + 2, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.extrabold, lineHeight: 26 },
  seasonPill: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    borderColor: COLORS.primary + '40', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginTop: SPACING.md,
  },
  seasonPillText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  // filters
  scopeBar: {
    flexDirection: 'row', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, padding: 4, marginBottom: SPACING.md,
  },
  scopeItem: { flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.full, alignItems: 'center' },
  scopeActive: { backgroundColor: COLORS.primary },
  scopeText: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  modeRow: { gap: SPACING.sm, paddingBottom: SPACING.lg },
  modeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.border,
  },
  modeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  modeChipText: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },

  // podium
  podium: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.sm, paddingVertical: SPACING.lg, marginBottom: SPACING.lg, ...SHADOW.sm,
  },
  podiumSide: { flex: 1, alignItems: 'center' },
  podiumCenter: { flex: 1.25, alignItems: 'center' },
  podiumPlace: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.textMuted, marginBottom: 6 },
  podiumAvatar: {
    width: 56, height: 56, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  podiumAvatarBig: {
    width: 78, height: 78, borderRadius: BORDER_RADIUS.lg, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 3, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm,
  },
  avatarSilver: { borderColor: '#94A3B8' },
  avatarBronze: { borderColor: '#CD7F32' },
  avatarGold: { borderColor: COLORS.primary, ...SHADOW.gold },
  avatarImg: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.md },
  podiumInitial: { fontSize: FONT_SIZE.xxl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textSecondary },
  titleTag: {
    position: 'absolute', bottom: -6, right: -4, backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 4, paddingVertical: 1,
  },
  titleTagText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#FFFFFF' },
  crown: { fontSize: 22, marginBottom: -2 },
  championTag: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.full, paddingHorizontal: SPACING.md,
    paddingVertical: 2, marginBottom: SPACING.sm,
  },
  championTagText: { fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 0.5 },
  topBadge: {
    position: 'absolute', bottom: -7, backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 6, paddingVertical: 1,
  },
  topBadgeText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  podiumName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  podiumNameBig: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, marginTop: 4 },
  podiumNick: { fontSize: 9, color: COLORS.accent, marginTop: 2, marginBottom: SPACING.sm, textAlign: 'center' },
  podiumStatBox: {
    width: '100%', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, paddingVertical: SPACING.sm,
  },
  podiumStatBoxGold: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary + '66', paddingVertical: SPACING.md },
  podiumStatElo: { fontSize: FONT_SIZE.xl + 2, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary },
  podiumStatEloBig: { fontSize: FONT_SIZE.xxxl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },
  podiumStatLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 },
  podiumStatLabelGold: { fontSize: 9, color: COLORS.primary, letterSpacing: 1, fontWeight: FONT_WEIGHT.bold },
  podiumWin: { fontSize: 9, color: COLORS.textMuted, marginTop: 3, fontWeight: FONT_WEIGHT.semibold },
  podiumStreak: { fontSize: 9, color: COLORS.textMuted, marginTop: 1 },

  // list
  listWrap: { marginBottom: SPACING.md },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  listTitle: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 0.5 },
  listNote: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm,
  },
  playerRank: { width: 26, fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textMuted },
  playerAvatar: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginHorizontal: SPACING.sm,
  },
  playerInitial: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textSecondary },
  playerTitle: {
    position: 'absolute', bottom: -4, right: -4, backgroundColor: COLORS.accentBlue,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 4, paddingVertical: 1,
  },
  playerTitleText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#FFFFFF' },
  playerName: { fontSize: FONT_SIZE.md + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  playerElo: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, marginRight: SPACING.sm },
  trend: { fontSize: 10, fontWeight: FONT_WEIGHT.semibold },
  profileBtn: {
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  profileBtnText: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  moreText: { textAlign: 'center', fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: SPACING.md },

  // my rank card
  myCard: {
    position: 'absolute', left: SPACING.md, right: SPACING.md, bottom: 74,
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, borderWidth: 1.5,
    borderColor: COLORS.primary, padding: SPACING.md, ...SHADOW.lg,
  },
  myTop: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  myAvatar: {
    width: 40, height: 40, borderRadius: BORDER_RADIUS.md, borderWidth: 2, borderColor: COLORS.primary,
    backgroundColor: COLORS.secondary,
  },
  myName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary },
  myElo: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },
  myRankBox: {
    marginLeft: SPACING.sm, backgroundColor: COLORS.accentBlue + '25', borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.accentBlue + '66', paddingHorizontal: 6, paddingVertical: 2, alignItems: 'center',
  },
  myRankLabel: { fontSize: 7, color: COLORS.accentBlue, fontWeight: FONT_WEIGHT.bold },
  myRankValue: { fontSize: FONT_SIZE.sm, color: COLORS.accentBlue, fontWeight: FONT_WEIGHT.extrabold },
  myTopText: { flex: 1, fontSize: 9, color: COLORS.textMuted, marginLeft: SPACING.sm, lineHeight: 12 },
  fightBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  fightText: { fontSize: FONT_SIZE.xs + 1, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  myProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  myProgressLabel: { fontSize: 9, color: COLORS.accent, fontWeight: FONT_WEIGHT.bold },
  myProgressValue: { fontSize: 9, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: COLORS.surface, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  myStreak: { fontSize: 9, color: COLORS.accentRed, fontWeight: FONT_WEIGHT.semibold },
  myLeft: { fontSize: 9, color: COLORS.textMuted },

  // tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.tabBarBg, borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingBottom: SPACING.lg, paddingTop: SPACING.sm, paddingHorizontal: SPACING.sm,
    position: 'absolute', bottom: 0, left: 0, right: 0,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: SPACING.xs },
  tabIcon: { fontSize: 20, marginBottom: 2 },
  tabLabel: { fontSize: 9, fontWeight: FONT_WEIGHT.medium },
  tabIndicator: { position: 'absolute', top: -SPACING.sm - 1, width: 24, height: 3, backgroundColor: COLORS.primary, borderRadius: 1.5 },
});

export default RankingScreen;
