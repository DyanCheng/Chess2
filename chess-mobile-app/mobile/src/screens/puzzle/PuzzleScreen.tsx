import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/arcane-theme';
import { useArcaneThemeStore } from '../../store/arcaneThemeStore';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { BoardPosition } from '../../types/chess';
import { apiService, PuzzleProgressResponse } from '../../services/api/apiService';
import {
  getDailyPuzzleBoard,
  getDailyPuzzleLegalMoves,
  getPuzzleById,
  playDailyPuzzleMove,
  TACTICAL_PUZZLES,
  TacticalPuzzle,
} from '../../services/game/dailyPuzzle';
import { useAuthStore } from '../../store/authStore';

// ============================================================
// THEME (Dark / Light) - same pattern as Home & Modes screens
// ============================================================
type Palette = typeof COLORS;
const ThemeContext = React.createContext<{
  isDark: boolean;
  toggle: () => void;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
} | null>(null);
const useTheme = () => React.useContext(ThemeContext)!;

// ============================================================
// DATA
// ============================================================
const LEADERS = [
  { rank: 1, name: 'GrandMaster_Zen', sub: 'Bậc Thầy Bơm Phối Hợp', score: 52, crown: true },
  { rank: 2, name: 'QueenGambit99', sub: 'Chiến Binh Tia Chớp', score: 48 },
  { rank: 3, name: 'ShadowKnight', sub: 'Sát Thủ Tàn Cuộc', score: 46 },
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
        <View style={styles.headerAvatar}><Text style={styles.headerAvatarText}>GM</Text></View>
      </View>
    </View>
  );
};

const TitleBar = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.titleBar}>
      <View style={styles.row}>
        <View style={styles.titleIcon}><Text style={{ fontSize: 18 }}>🧩</Text></View>
        <View>
          <Text style={styles.pageTitle}>GIẢI ĐỐ MA THUẬT</Text>
          <Text style={styles.pageSub}>Rèn Luyện Nhãn Quan Chiến Thuật</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.rulesBtn}>
        <Text style={styles.rulesText}>📖 Luật Chơi</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// STATS
// ============================================================
const StatCards = () => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.statRow}>
      <View style={styles.statCard}>
        <View style={styles.statIcon}><Text>🏆</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statLabel}>TACTICS ELO</Text>
          <Text style={styles.statValue}>1,620</Text>
        </View>
        <View style={styles.statTag}><Text style={styles.statTagText}>Cao Thủ</Text></View>
      </View>
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { borderColor: colors.accent + '55' }]}><Text>⚡</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.statLabel}>THỂ LỰC GIẢI ĐỐ</Text>
          <Text style={[styles.statValue, { fontSize: FONT_SIZE.md + 1 }]}>3 Miễn Phí</Text>
        </View>
        <Text style={styles.statNote}>⚡2/Ngày</Text>
      </View>
    </View>
  );
};

// ============================================================
// STREAK
// ============================================================
const StreakCard = ({ progress }: { progress: PuzzleProgressResponse }) => {
  const { styles, colors } = useTheme();
  const todaySolved = progress.lastDailySolvedOn === progress.today;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeadRow}>
        <Text style={styles.streakTitle}>🔥 CHUỖI {progress.currentStreak} NGÀY GIẢI ĐỐ</Text>
        <Text style={styles.streakNote}>
          Hôm nay: {todaySolved ? 'Đã giải' : 'Chưa giải'}
        </Text>
      </View>
      <View style={styles.streakStats}>
        <Text style={styles.streakStatText}>Kỷ lục cao nhất</Text>
        <Text style={[styles.streakRecord, { color: colors.accent }]}>{progress.bestStreak} ngày</Text>
      </View>
    </View>
  );
};

// ============================================================
// DAILY PUZZLE
// ============================================================
const formatDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-');
  return `${day}/${month}/${year}`;
};

const DailyPuzzle = ({ puzzle, date, isSolved, onStart }: {
  puzzle: TacticalPuzzle;
  date: string;
  isSolved: boolean;
  onStart: () => void;
}) => {
  const { styles } = useTheme();
  const [boardWidth, setBoardWidth] = useState(0);
  const board = useMemo(() => getDailyPuzzleBoard(puzzle.fen), [puzzle.fen]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeadRow}>
        <Text style={styles.dailyTitle}>♟ THẾ CỜ NGÀY · {formatDate(date)}</Text>
        <View style={styles.legendTag}><Text style={styles.legendTagText}>{puzzle.difficulty.toUpperCase()}</Text></View>
      </View>

      <View style={styles.boardWrap}>
        <View
          style={styles.board}
          onLayout={event => setBoardWidth(event.nativeEvent.layout.width)}
        >
          {boardWidth > 0 && (
            <ChessBoard
              board={board}
              selectedSquare={null}
              validMoves={[]}
              lastMove={null}
              onSquarePress={() => undefined}
              isInteractive={false}
              maxBoardWidth={boardWidth}
            />
          )}
        </View>
      </View>

      <Text style={styles.turnText}>{puzzle.theme.toUpperCase()}</Text>
      <Text style={styles.dailyDesc}>
        {puzzle.prompt}
      </Text>

      <View style={styles.rewardRow}>
        <View style={styles.rewardChip}><Text style={styles.rewardText}>⚡ +50 EXP</Text></View>
        <View style={styles.rewardChip}><Text style={styles.rewardText}>🪙 +100</Text></View>
        <View style={styles.rewardChip}><Text style={styles.rewardText}>↗ +15 ELO</Text></View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.startBtn}
        activeOpacity={0.85}
        onPress={onStart}
      >
        <Text style={styles.startText}>
          {isSolved ? '✓  BÀI HÔM NAY ĐÃ GIẢI' : '▶  BẮT ĐẦU GIẢI CỜ'}
          {!isSolved && <Text style={styles.startSub}> (~2 phút)</Text>}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const PuzzleGameModal = ({
  visible,
  puzzle,
  dailyDate,
  puzzleIndex,
  saveError,
  onClose,
  onSolved,
  onNext,
}: {
  visible: boolean;
  puzzle: TacticalPuzzle;
  dailyDate: string | null;
  puzzleIndex: number;
  saveError: string | null;
  onClose: () => void;
  onSolved: (puzzleId: string, solutionUci: string, isDaily: boolean) => Promise<boolean>;
  onNext: () => void;
}) => {
  const { styles, colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [fen, setFen] = useState(puzzle.fen);
  const [selectedSquare, setSelectedSquare] = useState<BoardPosition | null>(null);
  const [lastMove, setLastMove] = useState<{ from: BoardPosition; to: BoardPosition } | null>(null);
  const [boardWidth, setBoardWidth] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSolution, setPendingSolution] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('Chọn một quân trắng để xem các nước đi hợp lệ.');
  const board = useMemo(() => getDailyPuzzleBoard(fen), [fen]);
  const validMoves = useMemo(
    () => selectedSquare ? getDailyPuzzleLegalMoves(fen, selectedSquare) : [],
    [fen, selectedSquare],
  );

  useEffect(() => {
    if (!visible) return;
    setFen(puzzle.fen);
    setSelectedSquare(null);
    setLastMove(null);
    setIsSolved(false);
    setIsSaving(false);
    setPendingSolution(null);
    setFeedback('Chọn một quân trắng để xem các nước đi hợp lệ.');
  }, [puzzle.id, puzzle.fen, visible]);

  const saveSolution = async (solutionUci: string) => {
    setIsSaving(true);
    const saved = await onSolved(puzzle.id, solutionUci, Boolean(dailyDate));
    setIsSaving(false);
    if (!saved) {
      setFeedback('Đã giải đúng nhưng chưa lưu được. Hãy thử lưu lại.');
      return;
    }
    setIsSolved(true);
    setPendingSolution(null);
    setFeedback('Chính xác! Tiến độ đã được lưu vào tài khoản.');
  };

  const handleSquarePress = (position: BoardPosition) => {
    if (isSolved || isSaving || pendingSolution) return;

    const isLegalDestination = validMoves.some(
      move => move.row === position.row && move.col === position.col,
    );
    if (selectedSquare && isLegalDestination) {
      const move = playDailyPuzzleMove(fen, selectedSquare, position);
      setSelectedSquare(null);
      if (!move || move.uci !== puzzle.solution || !move.isCheckmate) {
        setFeedback('Nước đi hợp lệ, nhưng chưa phải lời giải. Hãy thử lại.');
        return;
      }

      setFen(move.fen);
      setLastMove({ from: selectedSquare, to: position });
      setPendingSolution(move.uci);
      setFeedback('Chính xác! Đang lưu tiến độ...');
      void saveSolution(move.uci);
      return;
    }

    if (board[position.row]?.[position.col]?.color === 'white') {
      setSelectedSquare(position);
      setFeedback('Chọn ô được đánh dấu để đi quân.');
      return;
    }

    setFeedback(selectedSquare
      ? 'Ô này không phải nước đi hợp lệ. Chọn một ô được đánh dấu.'
      : 'Hãy chọn một quân trắng.');
  };

  const resetPuzzle = () => {
    setFen(puzzle.fen);
    setSelectedSquare(null);
    setLastMove(null);
    setIsSolved(false);
    setPendingSolution(null);
    setIsSaving(false);
    setFeedback('Chọn một quân trắng để xem các nước đi hợp lệ.');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.puzzleGameScreen,
          { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.md },
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
        />
        <View style={styles.puzzleGameHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quay lại trang giải đố"
            onPress={onClose}
            style={styles.puzzleGameIconButton}
          >
            <Text style={styles.puzzleGameIcon}>‹</Text>
          </Pressable>
          <View style={styles.puzzleGameHeaderTitle}>
            <Text style={styles.puzzleGameTitle}>
              {dailyDate ? `THẾ CỜ NGÀY · ${formatDate(dailyDate)}` : puzzle.title.toUpperCase()}
            </Text>
            <Text style={styles.puzzleGameSubtitle}>
              BÀI {puzzleIndex + 1}/{TACTICAL_PUZZLES.length} · {puzzle.difficulty.toUpperCase()}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đặt lại bài giải"
            onPress={resetPuzzle}
            style={styles.puzzleGameIconButton}
          >
            <Text style={styles.puzzleGameIcon}>↻</Text>
          </Pressable>
        </View>

        <View style={styles.puzzlePrompt}>
          <Text style={styles.puzzlePromptLabel}>NHIỆM VỤ</Text>
          <Text style={styles.puzzlePromptText}>{puzzle.prompt}</Text>
        </View>

        <View
          testID="puzzle-board-area"
          style={styles.puzzleGameBoardArea}
          onLayout={event => setBoardWidth(event.nativeEvent.layout.width)}
        >
          {boardWidth > 0 && (
            <ChessBoard
              board={board}
              selectedSquare={selectedSquare}
              validMoves={validMoves}
              lastMove={lastMove}
              onSquarePress={handleSquarePress}
              isInteractive={!isSolved && !isSaving && !pendingSolution}
              maxBoardWidth={boardWidth}
            />
          )}
        </View>

        <View style={styles.puzzleGameFooter}>
          <View style={[styles.puzzleResult, isSolved && styles.puzzleResultSuccess]}>
            <Text style={[styles.puzzleFeedback, { color: isSolved ? colors.accentGreen : colors.textSecondary }]}>
              {saveError || feedback}
            </Text>
          </View>
          <View style={styles.puzzleGameActions}>
            {isSolved ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onNext}
                style={styles.puzzleResetButton}
              >
                <Text style={styles.puzzleResetText}>
                  {puzzleIndex + 1 < TACTICAL_PUZZLES.length ? 'Bài tiếp theo →' : 'Hoàn thành bộ bài'}
                </Text>
              </TouchableOpacity>
            ) : pendingSolution ? (
              <TouchableOpacity
                accessibilityRole="button"
                disabled={isSaving}
                onPress={() => void saveSolution(pendingSolution)}
                style={[styles.puzzleResetButton, isSaving && styles.puzzleButtonDisabled]}
              >
                <Text style={styles.puzzleResetText}>{isSaving ? 'Đang lưu...' : 'Thử lưu lại'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={resetPuzzle}
                style={styles.puzzleResetButton}
              >
                <Text style={styles.puzzleResetText}>Đặt lại</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onClose}
              style={styles.puzzleExitButton}
            >
              <Text style={styles.puzzleExitText}>Thoát bài</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================
// PUZZLE MODES
// ============================================================
const ModeCard = (props: {
  icon: string;
  iconColor: string;
  title: string;
  tag: string;
  tagColor: string;
  desc: string;
  meta?: { left: string; right: string };
  progress?: { label: string; value: string; pct: number };
  warn?: string;
  cta: string;
  ctaPrimary?: boolean;
}) => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.card}>
      <View style={styles.cardHeadRow}>
        <View style={[styles.modeIcon, { backgroundColor: props.iconColor }]}><Text style={{ fontSize: 18 }}>{props.icon}</Text></View>
        <View style={[styles.modeTag, { backgroundColor: props.tagColor + '22', borderColor: props.tagColor + '66' }]}>
          <Text style={[styles.modeTagText, { color: props.tagColor }]}>{props.tag}</Text>
        </View>
      </View>
      <Text style={styles.modeTitle}>{props.title}</Text>
      <Text style={styles.modeDesc}>{props.desc}</Text>

      {props.meta && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{props.meta.left}</Text>
          <Text style={[styles.metaText, { color: colors.primary }]}>{props.meta.right}</Text>
        </View>
      )}
      {props.progress && (
        <View style={{ marginTop: SPACING.md }}>
          <View style={styles.metaRowPlain}>
            <Text style={styles.metaText}>{props.progress.label}</Text>
            <Text style={[styles.metaText, { color: colors.accent }]}>{props.progress.value}</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${props.progress.pct}%` }]} />
          </View>
        </View>
      )}
      {props.warn && (
        <View style={styles.warnBox}><Text style={styles.warnText}>⚠️ {props.warn}</Text></View>
      )}

      <TouchableOpacity style={styles.ctaBtn}>
        <Text style={styles.ctaText}>{props.cta}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ModesSection = () => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🧩 CHẾ ĐỘ GIẢI CỜ</Text>
        <Text style={styles.sectionNote}>4 Đấu Trường</Text>
      </View>
      <ModeCard
        icon="⏱" iconColor={colors.primary + '33'} title="Giải Cờ Tính Giờ" tag="CỰC HOT 🔥" tagColor={colors.accentRed}
        desc="3 phút ranh tới giải cố đến đập. Mỗi nước chiếc đúng cộng thêm thời gian của bạn."
        meta={{ left: 'Kỷ lục cá nhân 38 Điểm', right: 'Đang chơi 4,520 người' }}
        cta="Vào Thi Đấu  ›"
      />
      <ModeCard
        icon="🧭" iconColor={colors.accent + '33'} title="Hành Trình Chiến Thuật" tag="CHƯƠNG 4/12" tagColor={colors.accent}
        desc="Vượt ải theo chủ đề: Đòn Xiên, Đòn Đỡ, Chiếu Mà và Thu Hút Vua vào tối bị mức."
        progress={{ label: 'Tiến độ ải', value: '26/40 Bài (65%)', pct: 65 }}
        cta="Tiếp Tục Ải 27  →"
      />
      <ModeCard
        icon="🛡" iconColor={colors.accentRed + '33'} title="Phân Tích Sai Lầm" tag="TỪ ĐẤU RANK" tagColor={colors.accentRed}
        desc="Tái hiện các nước đi 'Blunder' tái hại trong 10 ván gần nhất của bạn để rút ra bài học."
        warn="3 thế cờ cần phục hồi điểm ELO"
        cta="Sửa Lỗi Ngay  ›"
      />
      <ModeCard
        icon="🏛" iconColor={colors.secondary + '33'} title="Tàn Cuộc Kinh Điển" tag="CHUYÊN SÂU" tagColor={colors.primary}
        desc="Rèn luyện tàn cuộc Vua - Tốt, Tàn cuộc Luciana & Phế dọn đối khủng AI Arcane."
        meta={{ left: 'Giáo trình AI', right: '18 Bài Thực Chiến' }}
        cta="Luyện Tập  ›"
      />
    </View>
  );
};

const PuzzleCollection = ({ progress, onStart }: {
  progress: PuzzleProgressResponse;
  onStart: (puzzle: TacticalPuzzle) => void;
}) => {
  const { styles, colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📚 BỘ SƯU TẬP THẾ CỜ</Text>
        <Text style={styles.sectionNote}>
          {progress.completedPuzzleIds.length}/{TACTICAL_PUZZLES.length} đã giải
        </Text>
      </View>
      <View style={styles.card}>
        {TACTICAL_PUZZLES.map((puzzle, index) => {
          const isSolved = progress.completedPuzzleIds.includes(puzzle.id);
          const isUnlocked = isSolved || progress.unlockedPuzzleId === puzzle.id;
          const statusStyle = isSolved
            ? styles.puzzleListCompleted
            : isUnlocked ? styles.puzzleListUnlocked : styles.puzzleListLocked;
          return (
            <TouchableOpacity
              key={puzzle.id}
              accessibilityRole="button"
              accessibilityLabel={`Bài ${index + 1}: ${puzzle.title}${isSolved ? ', đã giải' : isUnlocked ? ', đã mở khóa' : ', chưa mở khóa'}`}
              accessibilityState={{ disabled: !isUnlocked }}
              disabled={!isUnlocked}
              onPress={() => onStart(puzzle)}
              style={[styles.puzzleListItem, index > 0 && styles.puzzleListItemBorder]}
            >
              <View style={[styles.puzzleListNumber, statusStyle]}>
                <Text style={[
                  styles.puzzleListNumberText,
                  isSolved && styles.puzzleListCompletedNumberText,
                  !isUnlocked && styles.puzzleListLockedText,
                ]}>
                  {isSolved ? '✓' : index + 1}
                </Text>
              </View>
              <View style={styles.puzzleListInfo}>
                <Text style={[
                  styles.puzzleListTitle,
                  isSolved && styles.puzzleListCompletedText,
                  isUnlocked && !isSolved && styles.puzzleListUnlockedText,
                  !isUnlocked && styles.puzzleListLockedText,
                ]}>{puzzle.title}</Text>
                <Text style={[
                  styles.puzzleListMeta,
                  isSolved && styles.puzzleListCompletedText,
                  isUnlocked && !isSolved && styles.puzzleListUnlockedText,
                  !isUnlocked && styles.puzzleListLockedText,
                ]}>
                  {puzzle.theme} · {puzzle.difficulty}
                </Text>
              </View>
              <Text style={[styles.puzzleListAction, {
                color: isSolved ? colors.primary : isUnlocked ? colors.accentBlue : colors.textMuted,
              }]}>
                {isSolved ? 'Đã giải' : isUnlocked ? 'Giải ›' : 'Đã khóa'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ============================================================
// WEEKLY LEADERBOARD
// ============================================================
const Leaderboard = () => {
  const { styles } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🏆 BẢNG VÀNG TUẦN</Text>
        <Text style={styles.sectionAction}>Xem Top 100 ›</Text>
      </View>
      <View style={styles.card}>
        {LEADERS.map(l => (
          <View key={l.rank} style={styles.leaderRow}>
            <View style={[styles.rankBadge, l.rank === 1 && styles.rankBadgeGold]}>
              <Text style={[styles.rankBadgeText, l.rank === 1 && { color: '#1A1205' }]}>{l.rank}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <Text style={styles.leaderName}>{l.name} {l.crown ? '👑' : ''}</Text>
              <Text style={styles.leaderSub}>{l.sub}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.leaderScore}>{l.score}</Text>
              <Text style={styles.leaderUnit}>điểm</Text>
            </View>
          </View>
        ))}
        <View style={styles.meRow}>
          <Text style={styles.meRank}>#128</Text>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={styles.leaderName}>Bạn (VortexGM) <Text style={styles.meTag}>Top 5%</Text></Text>
            <Text style={styles.leaderSub}>Kỷ lục tuần 28 điểm</Text>
          </View>
          <TouchableOpacity style={styles.challengeBtn}>
            <Text style={styles.challengeText}>🔥 THÁCH ĐẤU</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// TAB BAR
// ============================================================
// ============================================================
// SCREEN
// ============================================================
const PuzzleScreen = () => {
  const isDark = useArcaneThemeStore(state => state.isDark);
  const toggleTheme = useArcaneThemeStore(state => state.toggleTheme);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isGuest = useAuthStore(state => state.isGuest);
  const userId = useAuthStore(state => state.userId);
  const exitGuestMode = useAuthStore(state => state.exitGuestMode);
  const [storedProgress, setStoredProgress] = useState<PuzzleProgressResponse | null>(null);
  const [progressOwner, setProgressOwner] = useState<string | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPuzzleOpen, setIsPuzzleOpen] = useState(false);
  const [activePuzzle, setActivePuzzle] = useState<TacticalPuzzle>(TACTICAL_PUZZLES[0]);
  const [dailyDate, setDailyDate] = useState<string | null>(null);
  const progress = progressOwner === userId ? storedProgress : null;
  const shouldShowProgressLoading = isProgressLoading || (
    isAuthenticated && Boolean(userId) && !progress && !progressError
  );
  const dailyPuzzle = progress ? getPuzzleById(progress.dailyPuzzleId) : null;
  const puzzleIndex = TACTICAL_PUZZLES.findIndex(puzzle => puzzle.id === activePuzzle.id);
  const colors: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(colors), [isDark]);
  const ctx = React.useMemo(
    () => ({ isDark, toggle: toggleTheme, colors, styles }),
    [isDark, styles, toggleTheme],
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setStoredProgress(null);
      setProgressOwner(null);
      setProgressError(null);
      setIsProgressLoading(false);
      return;
    }

    let active = true;
    setIsProgressLoading(true);
    setProgressError(null);
    apiService.getPuzzleProgress().then(response => {
      if (!active) return;
      if (!response.data) {
        setProgressError(response.error || 'Không thể tải tiến độ giải đố.');
        return;
      }
      setStoredProgress(response.data);
      setProgressOwner(userId);
    }).catch(error => {
      if (active) setProgressError(error instanceof Error ? error.message : 'Không thể tải tiến độ giải đố.');
    }).finally(() => {
      if (active) setIsProgressLoading(false);
    });

    return () => {
      active = false;
    };
  }, [isAuthenticated, retryCount, userId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleUtcRefresh = () => {
      const now = new Date();
      const nextUtcMidnight = Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
      ) + 1000;
      timeout = setTimeout(() => {
        setRetryCount(count => count + 1);
        scheduleUtcRefresh();
      }, Math.max(1000, nextUtcMidnight - now.getTime()));
    };
    scheduleUtcRefresh();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') setRetryCount(count => count + 1);
    });
    return () => {
      clearTimeout(timeout);
      subscription.remove();
    };
  }, [isAuthenticated]);

  const savePuzzleSolution = async (
    puzzleId: string,
    solutionUci: string,
    isDaily: boolean,
  ): Promise<boolean> => {
    if (!userId || !isAuthenticated) return false;
    setSaveError(null);
    const response = await apiService.completePuzzle(puzzleId, solutionUci, isDaily);
    if (!response.data) {
      setSaveError(response.error || 'Không thể lưu tiến độ. Hãy thử lại.');
      return false;
    }
    setStoredProgress(response.data);
    setProgressOwner(userId);
    return true;
  };

  const openPuzzle = (puzzle: TacticalPuzzle, selectedDailyDate: string | null = null) => {
    setActivePuzzle(puzzle);
    setDailyDate(selectedDailyDate);
    setSaveError(null);
    setIsPuzzleOpen(true);
  };

  const handleNextPuzzle = () => {
    const nextPuzzle = TACTICAL_PUZZLES[puzzleIndex + 1];
    if (!nextPuzzle) {
      setIsPuzzleOpen(false);
      return;
    }
    setActivePuzzle(nextPuzzle);
    setDailyDate(null);
  };

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.backgroundDark} />
        <Header />
        {!isAuthenticated ? (
          <View style={styles.accountGate}>
            <Text style={styles.accountGateTitle}>Đăng nhập để lưu tiến độ</Text>
            <Text style={styles.accountGateText}>
              Chuỗi ngày và bài đã mở khóa được đồng bộ riêng cho tài khoản Supabase của bạn.
            </Text>
            {isGuest && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={exitGuestMode}
                style={styles.startBtn}
              >
                <Text style={styles.startText}>ĐĂNG NHẬP</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : shouldShowProgressLoading && !progress ? (
          <View style={styles.progressState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.progressStateText}>Đang tải tiến độ từ máy chủ...</Text>
          </View>
        ) : !progress ? (
          <View style={styles.accountGate}>
            <Text style={styles.accountGateTitle}>Không tải được tiến độ</Text>
            <Text style={styles.accountGateText}>{progressError || 'Vui lòng thử lại.'}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setRetryCount(count => count + 1)}
              style={styles.startBtn}
            >
              <Text style={styles.startText}>THỬ LẠI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <TitleBar />
            <StatCards />
            {progressError && (
              <View style={styles.progressError}>
                <Text style={styles.progressErrorText}>{progressError}</Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setRetryCount(count => count + 1)}
                >
                  <Text style={styles.progressRetry}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            )}
            <StreakCard progress={progress} />
            {dailyPuzzle ? (
              <>
                <DailyPuzzle
                  puzzle={dailyPuzzle}
                  date={progress.today}
                  isSolved={progress.lastDailySolvedOn === progress.today}
                  onStart={() => openPuzzle(dailyPuzzle, progress.today)}
                />
                <PuzzleCollection
                  progress={progress}
                  onStart={puzzle => openPuzzle(puzzle)}
                />
                <ModesSection />
                <Leaderboard />
              </>
            ) : (
              <View style={styles.progressError}>
                <Text style={styles.progressErrorText}>Máy chủ trả về mã bài giải đố không hợp lệ.</Text>
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}
        <PuzzleGameModal
          visible={isPuzzleOpen}
          puzzle={activePuzzle}
          dailyDate={dailyDate}
          puzzleIndex={puzzleIndex}
          saveError={saveError}
          onClose={() => setIsPuzzleOpen(false)}
          onSolved={savePuzzleSolution}
          onNext={handleNextPuzzle}
        />
      </View>
    </ThemeContext.Provider>
  );
};

// `COLORS` param intentionally shadows the import so styles follow the active theme.
const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  accentText: { color: COLORS.accent },

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
  titleIcon: {
    width: 38, height: 38, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '25',
    borderWidth: 1, borderColor: COLORS.primary + '55', justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md,
  },
  pageTitle: { fontSize: FONT_SIZE.xl, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.extrabold },
  pageSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
  rulesBtn: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.full, borderWidth: 1,
    borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  rulesText: { fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.semibold },

  // stat cards
  statRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: BORDER_RADIUS.sm, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.primary + '55', justifyContent: 'center', alignItems: 'center',
  },
  statLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5, fontWeight: FONT_WEIGHT.semibold },
  statValue: { fontSize: FONT_SIZE.xl, color: COLORS.textPrimary, fontWeight: FONT_WEIGHT.extrabold },
  statTag: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.xs, paddingHorizontal: 6, paddingVertical: 2 },
  statTagText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },
  statNote: { fontSize: 9, color: COLORS.textMuted },

  // generic card
  card: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, borderWidth: 1,
    borderColor: COLORS.border, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOW.sm,
  },
  cardHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },

  // streak
  streakTitle: { fontSize: 10, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary, letterSpacing: 0.5, flex: 1 },
  streakNote: { fontSize: 10, color: COLORS.textMuted },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.md,
  },
  streakStatText: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  streakRecord: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold },
  accountGate: { flex: 1, justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md },
  accountGateTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, textAlign: 'center' },
  accountGateText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm, lineHeight: 20, textAlign: 'center' },
  progressState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  progressStateText: { color: COLORS.textSecondary, fontSize: FONT_SIZE.sm },
  progressError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.accentRed + '15',
  },
  progressErrorText: { color: COLORS.accentRed, fontSize: FONT_SIZE.xs, flex: 1 },
  progressRetry: { color: COLORS.primary, fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold },

  // daily puzzle
  dailyTitle: { fontSize: 11, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, letterSpacing: 0.5 },
  legendTag: {
    backgroundColor: COLORS.accentRed + '22', borderRadius: BORDER_RADIUS.xs, borderWidth: 1,
    borderColor: COLORS.accentRed + '66', paddingHorizontal: 6, paddingVertical: 2,
  },
  legendTagText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.accentRed },
  boardWrap: { alignItems: 'center', width: '100%', marginBottom: SPACING.md },
  board: { width: '100%', alignItems: 'center' },
  turnText: { fontSize: 11, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.accent, textAlign: 'center', letterSpacing: 0.5 },
  puzzleFeedback: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, textAlign: 'center', marginTop: SPACING.xs },
  dailyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 18, marginVertical: SPACING.md },
  puzzleGameScreen: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  puzzleGameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  puzzleGameIconButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puzzleGameIcon: { color: COLORS.textPrimary, fontSize: 28, lineHeight: 30, fontWeight: FONT_WEIGHT.bold },
  puzzleGameHeaderTitle: { flex: 1, minWidth: 0 },
  puzzleGameTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold },
  puzzleGameSubtitle: { color: COLORS.textMuted, fontSize: 9, fontWeight: FONT_WEIGHT.bold, marginTop: 3 },
  puzzlePrompt: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puzzlePromptLabel: { color: COLORS.primary, fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 1 },
  puzzlePromptText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold, marginTop: 4 },
  puzzleGameBoardArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleGameFooter: { gap: SPACING.md, paddingTop: SPACING.sm },
  puzzleResult: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puzzleResultSuccess: { borderColor: COLORS.accentGreen },
  puzzleGameActions: { flexDirection: 'row', gap: SPACING.md },
  puzzleResetButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  puzzleButtonDisabled: { opacity: 0.55 },
  puzzleResetText: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  puzzleExitButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  puzzleExitText: { color: '#1A1205', fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold },
  rewardRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  rewardChip: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm, borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, paddingVertical: 5,
  },
  rewardText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  startBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.lg, paddingVertical: SPACING.lg, alignItems: 'center', ...SHADOW.gold },
  startText: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205', letterSpacing: 0.5 },
  startSub: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.medium },

  // sections
  section: { marginTop: SPACING.sm, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, letterSpacing: 0.5 },
  sectionNote: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  sectionAction: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },

  // mode cards
  modeIcon: { width: 40, height: 40, borderRadius: BORDER_RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  modeTag: { borderRadius: BORDER_RADIUS.xs, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  modeTagText: { fontSize: 8, fontWeight: FONT_WEIGHT.extrabold },
  modeTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textPrimary, marginBottom: 4 },
  modeDesc: { fontSize: FONT_SIZE.xs + 1, color: COLORS.textMuted, lineHeight: 16 },
  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginTop: SPACING.md,
  },
  metaRowPlain: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaText: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, fontWeight: FONT_WEIGHT.semibold },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: COLORS.surface, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  warnBox: {
    marginTop: SPACING.md, backgroundColor: COLORS.accentRed + '15', borderRadius: BORDER_RADIUS.md, borderWidth: 1,
    borderColor: COLORS.accentRed + '40', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  warnText: { fontSize: FONT_SIZE.xs, color: COLORS.accentRed, fontWeight: FONT_WEIGHT.semibold },
  ctaBtn: {
    marginTop: SPACING.md, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  ctaText: { fontSize: FONT_SIZE.sm + 1, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  puzzleListItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.md },
  puzzleListItemBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  puzzleListNumber: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center',
  },
  puzzleListCompleted: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  puzzleListUnlocked: { backgroundColor: COLORS.accentBlue + '22', borderColor: COLORS.accentBlue },
  puzzleListLocked: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  puzzleListNumberText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold },
  puzzleListCompletedNumberText: { color: '#1A1205' },
  puzzleListCompletedText: { color: COLORS.primary },
  puzzleListUnlockedText: { color: COLORS.accentBlue },
  puzzleListLockedText: { color: COLORS.textMuted },
  puzzleListInfo: { flex: 1, gap: 3 },
  puzzleListTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  puzzleListMeta: { color: COLORS.textMuted, fontSize: FONT_SIZE.xs },
  puzzleListAction: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold },

  // leaderboard
  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm },
  rankBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.surface, borderWidth: 1,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  rankBadgeGold: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  rankBadgeText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textSecondary },
  leaderName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.textPrimary },
  leaderSub: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
  leaderScore: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.primary },
  leaderUnit: { fontSize: 9, color: COLORS.textMuted },
  meRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  meRank: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.extrabold, color: COLORS.textMuted },
  meTag: { fontSize: 9, color: COLORS.primary, fontWeight: FONT_WEIGHT.extrabold },
  challengeBtn: { backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  challengeText: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.extrabold, color: '#1A1205' },

});

export default PuzzleScreen;
