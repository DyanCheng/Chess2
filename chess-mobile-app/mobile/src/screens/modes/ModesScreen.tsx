import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StatusBar,
} from 'react-native';
import { COLORS, LIGHT_COLORS } from '../../constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/theme';

// ============================================================
// THEME (Dark / Light)
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
const TIME_CONTROLS = [
  { id: 'bullet', label: 'Bullet', time: '1m | 0s' },
  { id: 'blitz', label: '⚡ Blitz', time: '3m | 2s' },
  { id: 'rapid', label: 'Rapid', time: '10m | 0s' },
  { id: 'classic', label: 'Cổ Điển', time: '30m | 0s' },
];

const VARIANTS = [
  { id: 'fog', title: 'Cờ Sương Mù', tag: 'HOT 🔥', tagColor: COLORS.accentRed, tint: '#1B2A4A', desc: 'Tầm nhìn giới hạn bởi quân cờ, chiến thuật mai phục bất ngờ.', players: '3,410 chơi' },
  { id: 'boss', title: 'Săn Boss Ma Thuật', tag: 'SỰ KIỆN 🎁', tagColor: COLORS.primary, tint: '#3A2410', desc: 'Đấu trùm Hắc Ám theo lượt, phối hợp giải mã trận diện...', players: '2,185 chơi' },
  { id: 'four', title: 'Đại Chiến 4 Người', tag: 'MỚI 🔥', tagColor: COLORS.accentGreen, tint: '#123A3A', desc: 'Bàn cờ chữ thập 14x14 nhỏ rộng, 4 vương quốc hỗn...', players: '5,904 chơi' },
  { id: 'chop', title: 'Đấu Chớp Nhoáng', tag: 'X2 THƯỞNG 🔥', tagColor: COLORS.secondary, tint: '#3A1A4A', desc: '30 giây mỗi bàn, nước đi siêu tốc, adrenaline tột đỉnh.', players: '8,120 chơi' },
];

const BOTS = [
  { id: 1, name: 'Tập Sự', sub: 'Bot 600 ELO' },
  { id: 2, name: 'Chiến Binh', sub: 'Bot 1200 ELO' },
  { id: 3, name: 'Kiện Tướng', sub: 'Bot 1800 ELO' },
  { id: 4, name: 'Stockfish Pro', sub: 'Bot 2500+ ELO' },
];

const TABS = [
  { id: 'home', label: 'Trang chủ', icon: '🛡️' },
  { id: 'modes', label: 'Chế độ', icon: '⚔️' },
  { id: 'puzzle', label: 'Giải đố', icon: '🧩' },
  { id: 'ranking', label: 'Xếp hạng', icon: '🏅' },
  { id: 'shop', label: 'Cửa hàng', icon: '🛒' },
];

// ============================================================
// HEADER
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
      <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>GM</Text></View>
    </View>
  </View>
  );
};

// ============================================================
// TITLE BAR
// ============================================================
const TitleBar = () => {
  const { styles } = useTheme();
  return (
  <View style={styles.titleBar}>
    <View style={styles.row}>
      <View style={styles.shieldBox}><Text style={{ fontSize: 18 }}>🛡️</Text></View>
      <View>
        <Text style={styles.eyebrow}>ĐẤU TRƯỜNG TRÍ TUỆ</Text>
        <Text style={styles.pageTitle}>CHẾ ĐỘ CHIẾN ĐẤU</Text>
      </View>
    </View>
    <View style={styles.eloPill}>
      <Text style={styles.eloPillText}>🏆 1,450 ELO</Text>
    </View>
  </View>
  );
};

// ============================================================
// RANKED CARD
// ============================================================
const RankedCard = () => {
  const { styles, colors } = useTheme();
  const [selected, setSelected] = useState('blitz');

  return (
    <View style={styles.rankedCard}>
      <View style={styles.rankedTop}>
        <View style={styles.row}>
          <View style={styles.rankAvatar}>
            <Text style={{ fontSize: 22 }}>🛡️</Text>
            <View style={styles.rankAvatarTag}><Text style={styles.rankAvatarTagText}>BẠC THẦY</Text></View>
          </View>
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={styles.rankName}>Hạng Tinh Anh <Text style={{ color: COLORS.accent }}>✓</Text></Text>
            <Text style={styles.rankSub}>Bậc Kim Cương II • Cụm Máy Chủ Châu Á</Text>
          </View>
        </View>
        <View style={styles.streakBox}>
          <Text style={styles.streakLabel}>CHUỖI THẮNG</Text>
          <Text style={styles.streakValue}>5 Trận 🔥</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TỈ LỆ THẮNG</Text>
          <Text style={styles.statValue}>68.4%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MÙA GIẢI 9</Text>
          <Text style={styles.statValue}>Top 4.2%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>ĐIỂM HẠNG</Text>
          <Text style={[styles.statValue, { color: COLORS.accentGreen }]}>+28 LP</Text>
        </View>
      </View>

      <Text style={styles.chooseLabel}>CHỌN THỂ THỨC ĐỒNG HỒ</Text>
      <View style={styles.timeRow}>
        {TIME_CONTROLS.map(t => {
          const active = selected === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.timeBtn, active && styles.timeBtnActive]}
              onPress={() => setSelected(t.id)}
            >
              <Text style={[styles.timeLabel, active && { color: COLORS.primary }]}>{t.label}</Text>
              <Text style={[styles.timeValue, active && { color: COLORS.textPrimary }]}>{t.time}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.liveRow}>
        <View style={styles.row}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Đang trực tuyến: 14,892 kỳ thủ</Text>
        </View>
        <Text style={styles.liveText}>Dự kiến: ~15s</Text>
      </View>

      <TouchableOpacity style={styles.findBtn} activeOpacity={0.85}>
        <Text style={styles.findText}>⚔️  TÌM TRẬN NGAY  ›</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// VARIANTS
// ============================================================
const VariantsSection = () => {
  const { styles } = useTheme();
  return (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>✦ Biến Thể Ma Thuật</Text>
      <Text style={styles.sectionAction}>4 ĐANG MỞ</Text>
    </View>
    <View style={styles.grid}>
      {VARIANTS.map(v => (
        <View key={v.id} style={styles.variantCard}>
          <View style={[styles.variantArt, { backgroundColor: v.tint }]}>
            <Text style={styles.variantEmoji}>♞</Text>
            <View style={[styles.variantTag, { backgroundColor: v.tagColor }]}>
              <Text style={styles.variantTagText}>{v.tag}</Text>
            </View>
          </View>
          <View style={styles.variantBody}>
            <Text style={styles.variantTitle}>{v.title}</Text>
            <Text style={styles.variantDesc} numberOfLines={3}>{v.desc}</Text>
            <View style={styles.variantFooter}>
              <Text style={styles.variantPlayers}>{v.players}</Text>
              <TouchableOpacity><Text style={styles.variantJoin}>VÀO →</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  </View>
  );
};

// ============================================================
// PRACTICE & FRIENDS
// ============================================================
const PracticeSection = () => {
  const { styles, colors } = useTheme();
  const [bot, setBot] = useState(3);
  const [spectator, setSpectator] = useState(true);

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎒 Luyện Tập & Bạn Bè</Text>
        <Text style={styles.sectionAction}>KHÔNG TÍNH ELO</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.panelIcon}><Text>🤖</Text></View>
          <View style={{ marginLeft: SPACING.md, flex: 1 }}>
            <Text style={styles.panelTitle}>Chơi Với Máy Ma Thuật</Text>
            <Text style={styles.panelSub}>Luyện tập chiến thuật cùng các linh hồn AI cổ đại</Text>
          </View>
        </View>

        <View style={styles.botGrid}>
          {BOTS.map(b => {
            const active = bot === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.botItem, active && styles.botItemActive]}
                onPress={() => setBot(b.id)}
              >
                <View style={[styles.botNum, active && styles.botNumActive]}>
                  <Text style={[styles.botNumText, active && { color: '#1A1205' }]}>{b.id}</Text>
                </View>
                <View>
                  <Text style={[styles.botName, active && { color: COLORS.primary }]}>{b.name}</Text>
                  <Text style={styles.botSub}>{b.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.botBtn}>
          <Text style={styles.botBtnText}>⚙️  CHỌN CẤP ĐỘ & VÀO ĐẤU</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.panel, { marginTop: SPACING.md }]}>
        <View style={styles.row}>
          <View style={styles.panelIcon}><Text>🚪</Text></View>
          <View style={{ marginLeft: SPACING.md, flex: 1 }}>
            <Text style={styles.panelTitle}>Phòng Tùy Chỉnh (Lobby)</Text>
            <Text style={styles.panelSub}>Tạo đấu trường riêng hoặc tham gia cùng bạn bè</Text>
          </View>
        </View>

        <View style={styles.lobbyRow}>
          <TouchableOpacity style={styles.createBtn}>
            <Text style={styles.createBtnText}>⊕ Tạo Phòng Mới</Text>
          </TouchableOpacity>
          <View style={styles.pinBox}>
            <TextInput
              style={styles.pinInput}
              placeholder="Mã PIN 6 số..."
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity style={styles.pinBtn}>
              <Text style={styles.pinBtnText}>Vào</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spectatorRow}>
          <Text style={styles.spectatorText}>👁  Khán giả quan sát (Spectator)</Text>
          <Switch
            value={spectator}
            onValueChange={setSpectator}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
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
      const active = t.id === 'modes';
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
const ModesScreen = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [isDark, setIsDark] = useState(false);
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
          <RankedCard />
          <VariantsSection />
          <PracticeSection />
          <View style={{ height: 100 }} />
        </ScrollView>
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
  headerAvatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.secondary,
    borderWidth: 2, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 10, color: '#FFF', fontWeight: FONT_WEIGHT.bold },

  // title
  titleBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  shieldBox: {
    width: 38, height: 38, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundCard,
    borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  eyebrow: { fontSize: 9, color: COLORS.primary, letterSpacing: 1, fontWeight: FONT_WEIGHT.semibold },
  pageTitle: { fontSize: FONT_SIZE.xl, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.extrabold },
  eloPill: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    borderColor: COLORS.primary + '40', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  eloPillText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  // ranked
  rankedCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.xl, ...SHADOW.md,
  },
  rankedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  rankAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 2, borderColor: COLORS.rankPlatinum, justifyContent: 'center', alignItems: 'center',
  },
  rankAvatarTag: {
    position: 'absolute', bottom: -8, backgroundColor: COLORS.rankPlatinum,
    borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 4, paddingVertical: 1,
  },
  rankAvatarTagText: { fontSize: 7, fontWeight: FONT_WEIGHT.extrabold, color: '#0D0D14' },
  rankName: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  rankSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  streakBox: { alignItems: 'flex-end' },
  streakLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 1 },
  streakValue: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, marginTop: 2 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.md, marginBottom: SPACING.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.border },

  chooseLabel: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 1, marginBottom: SPACING.sm, fontWeight: FONT_WEIGHT.semibold },
  timeRow: { flexDirection: 'row', gap: 6, marginBottom: SPACING.md },
  timeBtn: {
    flex: 1, paddingVertical: SPACING.sm + 2, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface,
    alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent',
  },
  timeBtnActive: { backgroundColor: COLORS.surfaceElevated, borderColor: COLORS.primary },
  timeLabel: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, marginBottom: 2 },
  timeValue: { fontSize: 10, color: COLORS.textMuted },

  liveRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginRight: 6 },
  liveText: { fontSize: 10, color: COLORS.textMuted },
  findBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.lg,
    alignItems: 'center', ...SHADOW.gold,
  },
  findText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 1 },

  // sections
  section: { marginBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  sectionAction: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, letterSpacing: 0.5 },

  // variants
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING.md },
  variantCard: {
    width: '48%', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  variantArt: { height: 84, justifyContent: 'center', alignItems: 'center' },
  variantEmoji: { fontSize: 40, color: 'rgba(255,255,255,0.35)' },
  variantTag: {
    position: 'absolute', top: 8, left: 8, borderRadius: BORDER_RADIUS.xs,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  variantTagText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#FFF' },
  variantBody: { padding: SPACING.md },
  variantTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary, marginBottom: 4 },
  variantDesc: { fontSize: 10, color: COLORS.textMuted, lineHeight: 14, minHeight: 42 },
  variantFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm },
  variantPlayers: { fontSize: 10, color: COLORS.textMuted },
  variantJoin: { fontSize: 10, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },

  // panels
  panel: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  panelIcon: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.accent + '40', justifyContent: 'center', alignItems: 'center',
  },
  panelTitle: { fontSize: FONT_SIZE.md + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  panelSub: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  botGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING.sm, marginTop: SPACING.lg },
  botItem: {
    width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'transparent',
  },
  botItemActive: { borderColor: COLORS.primary + '80', backgroundColor: COLORS.primary + '12' },
  botNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  botNumActive: { backgroundColor: COLORS.primary },
  botNumText: { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary },
  botName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  botSub: { fontSize: 9, color: COLORS.textMuted },
  botBtn: {
    marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  botBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.textSecondary, letterSpacing: 0.5 },

  lobbyRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, alignItems: 'center' },
  createBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center',
    backgroundColor: COLORS.accent + '15', borderWidth: 1, borderColor: COLORS.accent + '55',
  },
  createBtnText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.accent },
  pinBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingLeft: SPACING.sm,
  },
  pinInput: { flex: 1, fontSize: FONT_SIZE.xs, color: COLORS.textPrimary, paddingVertical: SPACING.sm },
  pinBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.sm, margin: 4,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  pinBtnText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  spectatorRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  spectatorText: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary },

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

export default ModesScreen;
