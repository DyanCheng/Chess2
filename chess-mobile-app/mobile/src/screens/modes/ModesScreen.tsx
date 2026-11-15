import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/arcane-theme';
import { apiService, GameModeDefinition, RankScreenData } from '../../services/api/apiService';
import { useAuthStore } from '../../store/authStore';
import { useArcaneThemeStore } from '../../store/arcaneThemeStore';

type MatchmakingNavigationOptions = {
  queueType: 'RANKED' | 'CASUAL';
  timeControlId: string;
  gameModeCode: string;
};

// ============================================================
// THEME (Dark / Light)
// ============================================================
type Palette = typeof COLORS;
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggle: () => void;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  rank: RankScreenData | null;
  onNavigate?: (id: string, params?: MatchmakingNavigationOptions) => void;
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

const MODE_PRESENTATION: Record<string, { tag: string; tagColor: string; tint: string }> = {
  FOG_OF_WAR: { tag: 'CHIẾN THUẬT', tagColor: COLORS.accentRed, tint: '#1B2A4A' },
  BOSS_HUNT: { tag: 'PVE', tagColor: COLORS.primary, tint: '#3A2410' },
  MAGIC_WAR: { tag: 'PVP & PVE', tagColor: COLORS.secondary, tint: '#3A1A4A' },
  FOUR_SEASONS: { tag: 'PVP', tagColor: COLORS.accentGreen, tint: '#123A3A' },
};

const SERVER_READY_MODE_CODES = new Set(['STANDARD']);

const BOTS = [
  { id: 1, name: 'Tập Sự', sub: 'Bot 600 ELO' },
  { id: 2, name: 'Chiến Binh', sub: 'Bot 1200 ELO' },
  { id: 3, name: 'Kiện Tướng', sub: 'Bot 1800 ELO' },
  { id: 4, name: 'Stockfish Pro', sub: 'Bot 2500+ ELO' },
];

// ============================================================
// HEADER
// ============================================================
const Header = () => {
  const { styles, isDark, toggle } = useTheme();
  const username = useAuthStore(state => state.username);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const displayName = isAuthenticated ? username || 'Tài khoản' : 'Khách';
  const initials = displayName.slice(0, 2).toUpperCase();
  return (
  <View style={styles.header}>
    <View style={styles.row}>
      <View style={styles.logoBox}><Text style={styles.logoIcon}>♚</Text></View>
      <Text style={styles.logoText}>ARCANE CHESS</Text>
    </View>
    <View style={styles.row}>
      <View style={styles.pill}><Text style={styles.pillText} numberOfLines={1}>{displayName}</Text></View>
      <TouchableOpacity style={styles.iconBtn} onPress={toggle}>
        <Text>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
      <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>{initials}</Text></View>
    </View>
  </View>
  );
};

// ============================================================
// TITLE BAR
// ============================================================
const TitleBar = () => {
  const { styles, rank } = useTheme();
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
      <Text style={styles.eloPillText}>
        {rank ? `🏆 ${rank.rank.rankPoints.toLocaleString()} ĐIỂM` : '🏆 RANK CHUNG'}
      </Text>
    </View>
  </View>
  );
};

// ============================================================
// RANKED CARD
// ============================================================
const RankedCard = ({
  rankLoading,
  rankError,
  onRetryRank,
  selectedTimeControl,
  onSelectTimeControl,
  selectedModeCode,
  selectedModeName,
  modePlayable,
}: {
  rankLoading: boolean;
  rankError: string | null;
  onRetryRank: () => void;
  selectedTimeControl: string;
  onSelectTimeControl: (id: string) => void;
  selectedModeCode: string;
  selectedModeName: string;
  modePlayable: boolean;
}) => {
  const { styles, onNavigate, rank } = useTheme();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const wins = rank?.rank.wins ?? 0;
  const losses = rank?.rank.losses ?? 0;
  const draws = rank?.rank.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : '—';

  return (
    <View style={styles.rankedCard}>
      <View style={styles.rankedTop}>
        <View style={styles.row}>
          <View style={styles.rankAvatar}>
            <Text style={{ fontSize: 22 }}>♚</Text>
            {rank && (
              <View style={styles.rankAvatarTag}>
                <Text style={styles.rankAvatarTagText}>{rank.rank.tier.code}</Text>
              </View>
            )}
          </View>
          <View style={{ marginLeft: SPACING.md }}>
            <Text style={styles.rankName}>
              {rankLoading ? 'Đang tải rank...' : rank?.rank.tier.name ?? (isAuthenticated ? 'Chưa có rank' : 'Chế độ khách')}
            </Text>
            <Text style={styles.rankSub}>
              {rank ? `${rank.season.name} • Rank chung mọi chế độ` : 'Đăng nhập để xem rank và chơi PvP'}
            </Text>
          </View>
        </View>
        <Text style={styles.streakValue}>{rank ? `${rank.rank.rankPoints} điểm` : '—'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>TỈ LỆ THẮNG</Text>
          <Text style={styles.statValue}>{winRate}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>THẮNG / THUA</Text>
          <Text style={styles.statValue}>{rank ? `${wins} / ${losses}` : '—'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>HÒA</Text>
          <Text style={[styles.statValue, { color: COLORS.accentGreen }]}>{rank ? draws : '—'}</Text>
        </View>
      </View>

      {rankError && (
        <TouchableOpacity onPress={onRetryRank} style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{rankError} · Nhấn để thử lại</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.chooseLabel}>CHỌN THỂ THỨC ĐỒNG HỒ</Text>
      <View style={styles.timeRow}>
        {TIME_CONTROLS.map(t => {
          const active = selectedTimeControl === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.timeBtn, active && styles.timeBtnActive]}
              onPress={() => onSelectTimeControl(t.id)}
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
          <Text style={styles.liveText}>Ghép trận cùng bậc rank</Text>
        </View>
        <Text style={styles.liveText}>{selectedModeName}</Text>
      </View>

      <TouchableOpacity
        style={[styles.findBtn, (rankLoading || !modePlayable) && styles.disabledButton]}
        activeOpacity={0.85}
        disabled={rankLoading || !modePlayable}
        onPress={() => {
          if (!isAuthenticated) {
            onNavigate?.('login');
          } else if (rank) {
            onNavigate?.('matchmaking', {
              queueType: 'RANKED',
              timeControlId: selectedTimeControl,
              gameModeCode: selectedModeCode,
            });
          } else {
            onRetryRank();
          }
        }}
      >
        <Text style={styles.findText}>
          {rankLoading
            ? 'ĐANG TẢI RANK...'
            : !modePlayable
              ? 'LUẬT CHẾ ĐỘ ĐANG HOÀN THIỆN'
            : rank
              ? '⚔️  TÌM TRẬN XẾP HẠNG  ›'
              : isAuthenticated
                ? 'THỬ TẢI LẠI RANK'
                : 'ĐĂNG NHẬP ĐỂ XẾP HẠNG'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.casualButton, !modePlayable && styles.disabledButton]}
        activeOpacity={0.75}
        disabled={!modePlayable}
        onPress={() => onNavigate?.('matchmaking', {
          queueType: 'CASUAL',
          timeControlId: selectedTimeControl,
          gameModeCode: selectedModeCode,
        })}
      >
        <Text style={styles.casualButtonText}>
          {modePlayable ? 'Chơi thường · không tính điểm rank' : 'Chế độ chưa thể vào trận'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// VARIANTS
// ============================================================
const VariantsSection = ({
  modes,
  loading,
  error,
  selectedModeCode,
  onSelect,
  onRetry,
}: {
  modes: GameModeDefinition[];
  loading: boolean;
  error: string | null;
  selectedModeCode: string;
  onSelect: (code: string) => void;
  onRetry: () => void;
}) => {
  const { styles, colors } = useTheme();
  return (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>✦ Biến Thể Ma Thuật</Text>
      <Text style={styles.sectionAction}>{loading ? 'ĐANG TẢI' : `${modes.length} CHẾ ĐỘ`}</Text>
    </View>
    {loading && modes.length === 0 ? (
      <ActivityIndicator color={colors.primary} />
    ) : error && modes.length === 0 ? (
      <TouchableOpacity onPress={onRetry} style={styles.inlineError}>
        <Text style={styles.inlineErrorText}>{error} · Nhấn để thử lại</Text>
      </TouchableOpacity>
    ) : modes.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.variantDesc}>Chưa có chế độ nào được mở trong mùa hiện tại.</Text>
      </View>
    ) : (
      <View style={styles.grid}>
        {modes.map(mode => {
          const presentation = MODE_PRESENTATION[mode.code] ?? {
            tag: 'CHẾ ĐỘ',
            tagColor: COLORS.primary,
            tint: '#243044',
          };
          const preview = mode.demoPreview;
          const selected = selectedModeCode === mode.code;
          const modePlayable = SERVER_READY_MODE_CODES.has(mode.code);
          return (
            <View key={mode.id} style={[styles.variantCard, selected && styles.variantCardSelected]}>
              <View style={[styles.variantArt, { backgroundColor: presentation.tint }]}>
                <Text style={styles.variantEmoji}>♞</Text>
                <View style={[styles.variantTag, { backgroundColor: presentation.tagColor }]}>
                  <Text style={styles.variantTagText}>{presentation.tag}</Text>
                </View>
              </View>
              <View style={styles.variantBody}>
                <Text style={styles.variantTitle}>{mode.name}</Text>
                <Text style={styles.variantDesc} numberOfLines={3}>
                  {mode.description || 'Chế độ chơi do máy chủ quản lý.'}
                </Text>
                <View style={styles.variantFooter}>
                  <Text style={styles.variantPlayers} numberOfLines={1}>
                    {preview ? `Minh họa: ${preview.displayName} · ${preview.tierName}` : 'Không có rank minh họa'}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => onSelect(mode.code)}
                  >
                    <Text style={styles.variantJoin}>{selected ? 'ĐÃ CHỌN' : 'CHỌN →'}</Text>
                  </TouchableOpacity>
                </View>
                {preview && (
                  <Text style={styles.demoLabel}>
                    Demo · {preview.rankPoints.toLocaleString()} điểm · {preview.wins}T/{preview.losses}B/{preview.draws}H
                  </Text>
                )}
                {!modePlayable && (
                  <Text style={styles.demoLabel}>Luật phía máy chủ đang được triển khai</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    )}
    {error && modes.length > 0 && (
      <TouchableOpacity onPress={onRetry} style={styles.inlineError}>
        <Text style={styles.inlineErrorText}>Không thể làm mới danh sách. Nhấn để thử lại.</Text>
      </TouchableOpacity>
    )}
  </View>
  );
};

// ============================================================
// PRACTICE & FRIENDS
// ============================================================
const PracticeSection = () => {
  const { styles, colors, onNavigate } = useTheme();
  const [bot, setBot] = useState(3);

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

        <TouchableOpacity style={styles.botBtn} onPress={() => onNavigate?.(`bot:${bot}`)}>
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
          <TouchableOpacity
            style={[styles.createBtn, styles.disabledButton]}
            disabled
            accessibilityState={{ disabled: true }}
          >
            <Text style={styles.createBtnText}>Phòng tùy chỉnh sắp ra mắt</Text>
          </TouchableOpacity>
          <View style={styles.pinBox}>
            <TextInput
              style={styles.pinInput}
              placeholder="Mã PIN (sắp ra mắt)"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              editable={false}
            />
            <TouchableOpacity style={[styles.pinBtn, styles.disabledButton]} disabled>
              <Text style={styles.pinBtnText}>Vào</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spectatorRow}>
          <Text style={styles.spectatorText}>
            Chế độ khán giả sẽ khả dụng khi phòng tùy chỉnh được triển khai.
          </Text>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// SCREEN
// ============================================================
const ModesScreen = ({
  onNavigate,
}: {
  onNavigate?: (id: string, params?: MatchmakingNavigationOptions) => void;
}) => {
  const isDark = useArcaneThemeStore(state => state.isDark);
  const toggleTheme = useArcaneThemeStore(state => state.toggleTheme);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [rank, setRank] = useState<RankScreenData | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);
  const [modes, setModes] = useState<GameModeDefinition[]>([]);
  const [modesLoading, setModesLoading] = useState(false);
  const [modesError, setModesError] = useState<string | null>(null);
  const [selectedTimeControl, setSelectedTimeControl] = useState('blitz');
  const [selectedModeCode, setSelectedModeCode] = useState('STANDARD');
  const mountedRef = useRef(false);
  const modesRequestRef = useRef(0);
  const rankRequestRef = useRef(0);
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors), [isDark]);
  const loadModes = useCallback(async () => {
    const requestId = ++modesRequestRef.current;
    setModesLoading(true);
    setModesError(null);
    const response = await apiService.getActiveModes();
    if (!mountedRef.current || requestId !== modesRequestRef.current) return;
    if (response.error || !response.data) {
      setModesError(response.error || 'Không tải được chế độ chơi');
    } else {
      const availableModes = response.data.modes;
      setModes(availableModes);
      setSelectedModeCode(current =>
        current === 'STANDARD' || availableModes.some(mode => mode.code === current)
          ? current
          : 'STANDARD',
      );
    }
    setModesLoading(false);
  }, []);
  const loadRank = useCallback(async () => {
    const requestId = ++rankRequestRef.current;
    if (!isAuthenticated) {
      setRank(null);
      setRankError(null);
      setRankLoading(false);
      return;
    }
    setRankLoading(true);
    setRankError(null);
    const response = await apiService.getMyRank();
    if (!mountedRef.current || requestId !== rankRequestRef.current) return;
    if (response.error || !response.data) {
      setRank(null);
      setRankError(response.error || 'Không tải được rank');
    } else {
      setRank(response.data);
    }
    setRankLoading(false);
  }, [isAuthenticated]);

  useEffect(() => {
    mountedRef.current = true;
    void loadModes();
    return () => {
      mountedRef.current = false;
    };
  }, [loadModes]);

  useEffect(() => {
    void loadRank();
  }, [loadRank]);

  const ctx = React.useMemo(
    () => ({ isDark, toggle: toggleTheme, colors, styles, onNavigate, rank }),
    [isDark, toggleTheme, colors, styles, onNavigate, rank],
  );
  const selectedModeName = modes.find(mode => mode.code === selectedModeCode)?.name ?? 'Cờ tiêu chuẩn';
  const modePlayable = SERVER_READY_MODE_CODES.has(selectedModeCode);

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
        <Header />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <TitleBar />
          <RankedCard
            rankLoading={rankLoading}
            rankError={rankError}
            onRetryRank={() => void loadRank()}
            selectedTimeControl={selectedTimeControl}
            onSelectTimeControl={setSelectedTimeControl}
            selectedModeCode={selectedModeCode}
            selectedModeName={selectedModeName}
            modePlayable={modePlayable}
          />
          <VariantsSection
            modes={modes}
            loading={modesLoading}
            error={modesError}
            selectedModeCode={selectedModeCode}
            onSelect={setSelectedModeCode}
            onRetry={() => void loadModes()}
          />
          <PracticeSection />
          <View style={{ height: 100 }} />
        </ScrollView>
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
  disabledButton: { opacity: 0.55 },
  findText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 1 },
  casualButton: { alignItems: 'center', paddingVertical: SPACING.md },
  casualButtonText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
  inlineError: {
    backgroundColor: COLORS.accentRed + '14', borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  inlineErrorText: { color: COLORS.accentRed, fontSize: FONT_SIZE.sm },

  // sections
  section: { marginBottom: SPACING.xl },
  emptyState: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  sectionAction: { fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary, letterSpacing: 0.5 },

  // variants
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: SPACING.md },
  variantCard: {
    width: '48%', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  variantCardSelected: { borderColor: COLORS.primary },
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
  demoLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: SPACING.xs },

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

});

export default ModesScreen;
