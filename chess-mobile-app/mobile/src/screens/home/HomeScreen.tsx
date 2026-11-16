import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS as DARK_COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { BOT_LEVELS } from '../../constants/game';
import { RootStackParamList } from '../../navigation/types';
import { apiService } from '../../services/api/apiService';
import { LeaderboardEntry } from '../../types/player';
import { useArcaneThemeStore } from '../../store/arcaneThemeStore';
import { useAuthStore } from '../../store/authStore';
import { useDailyMissionStore } from '../../store/dailyMissionStore';
import { useHistoryStore, LocalHistoryEntry } from '../../store/historyStore';
import { usePlayerStore } from '../../store/playerStore';

const LOGO = require('../../assets/images/arcane-chess-logo.png');
const CHAMPION_AVATAR = require('../../assets/images/champion_avatar.jpg');
const SEASON_BANNER = require('../../assets/images/season_banner.jpg');

type HomeNavigation = NativeStackNavigationProp<RootStackParamList>;
type Palette = typeof DARK_COLORS;

interface OnlineMatch {
  id: string;
  status: string;
  winner_id: string | null;
  created_at: string;
  match_players: Array<{ user_id: string; color: 'WHITE' | 'BLACK' }>;
}

interface RecentMatch {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss' | 'draw' | 'playing';
  detail: string;
}

interface DailyTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  goal: number;
  reward: { gold?: number; gems?: number; experience?: number };
}

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isSameLocalDay = (value: string, dateKey: string) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && localDateKey(date) === dateKey;
};

const relativeDate = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return 'Vừa xong';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes}p trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
};

const botNames = new Set(BOT_LEVELS.map(bot => bot.name.toLowerCase()));
const isBotMatch = (entry: LocalHistoryEntry) =>
  botNames.has(entry.opponent.toLowerCase()) || entry.opponent.toLowerCase().includes('bot');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigation>();
  const isDark = useArcaneThemeStore(state => state.isDark);
  const toggleTheme = useArcaneThemeStore(state => state.toggleTheme);
  const colors: Palette = isDark ? DARK_COLORS : LIGHT_COLORS;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const profile = usePlayerStore(state => state.profile);
  const stats = usePlayerStore(state => state.stats);
  const addGold = usePlayerStore(state => state.addGold);
  const addGems = usePlayerStore(state => state.addGems);
  const addExperience = usePlayerStore(state => state.addExperience);
  const historyEntries = useHistoryStore(state => state.entries);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isGuest = useAuthStore(state => state.isGuest);
  const userId = useAuthStore(state => state.userId);
  const username = useAuthStore(state => state.username);
  const claimDate = useDailyMissionStore(state => state.claimDate);
  const claimedIds = useDailyMissionStore(state => state.claimedIds);
  const claimReward = useDailyMissionStore(state => state.claimReward);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [onlineMatches, setOnlineMatches] = useState<OnlineMatch[]>([]);
  const [onlineHistoryLoading, setOnlineHistoryLoading] = useState(false);
  const [onlineHistoryError, setOnlineHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => () => {
    isMounted.current = false;
  }, []);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);
    try {
      const response = await apiService.getLeaderboard(3);
      if (response.error || !response.data) {
        if (isMounted.current) {
          setLeaderboardError(response.error || 'Không thể tải bảng xếp hạng server.');
        }
        return;
      }
      if (!Array.isArray(response.data)) {
        if (isMounted.current) setLeaderboardError('Dữ liệu xếp hạng server không hợp lệ.');
        return;
      }
      const validEntries = response.data.every(entry =>
        Boolean(entry) &&
        typeof entry.rank === 'number' &&
        typeof entry.rating === 'number' &&
        Boolean(entry.player) &&
        typeof entry.player.id === 'string' &&
        typeof entry.player.username === 'string',
      );
      if (!validEntries) {
        if (isMounted.current) setLeaderboardError('Dữ liệu xếp hạng server không hợp lệ.');
        return;
      }
      if (isMounted.current) setLeaderboard(response.data);
    } catch (error) {
      if (isMounted.current) {
        setLeaderboardError(error instanceof Error ? error.message : 'Không thể tải bảng xếp hạng server.');
      }
    } finally {
      if (isMounted.current) setLeaderboardLoading(false);
    }
  }, []);

  const loadOnlineHistory = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      setOnlineMatches([]);
      setOnlineHistoryError(null);
      return;
    }
    setOnlineHistoryLoading(true);
    setOnlineHistoryError(null);
    try {
      const response = await apiService.getGameHistory(1, 3);
      if (response.error || !response.data) {
        if (isMounted.current) {
          setOnlineHistoryError(response.error || 'Không thể tải lịch sử trận online.');
        }
        return;
      }
      if (!Array.isArray(response.data.matches)) {
        if (isMounted.current) setOnlineHistoryError('Dữ liệu lịch sử trận online không hợp lệ.');
        return;
      }
      if (isMounted.current) setOnlineMatches(response.data.matches);
    } catch (error) {
      if (isMounted.current) {
        setOnlineHistoryError(error instanceof Error ? error.message : 'Không thể tải lịch sử trận online.');
      }
    } finally {
      if (isMounted.current) setOnlineHistoryLoading(false);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  useEffect(() => {
    void loadOnlineHistory();
  }, [loadOnlineHistory]);

  const refreshDashboard = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadLeaderboard(), loadOnlineHistory()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadLeaderboard, loadOnlineHistory]);

  const todayKey = localDateKey(new Date());
  const todayGames = useMemo(
    () => historyEntries.filter(entry => isSameLocalDay(entry.date, todayKey)),
    [historyEntries, todayKey],
  );
  const todayWins = todayGames.filter(entry => entry.result === 'win').length;
  const todayBotWins = todayGames.filter(entry => entry.result === 'win' && isBotMatch(entry)).length;

  const tasks: DailyTask[] = [
    {
      id: 'win-two-today',
      title: 'Chiến thắng 2 trận hôm nay',
      description: '+300 Vàng  •  +50 EXP',
      icon: '⚔',
      progress: todayWins,
      goal: 2,
      reward: { gold: 300, experience: 50 },
    },
    {
      id: 'play-five-today',
      title: 'Hoàn thành 5 ván cờ',
      description: '+50 Kim Cương',
      icon: '♛',
      progress: todayGames.length,
      goal: 5,
      reward: { gems: 50 },
    },
    {
      id: 'win-three-bots',
      title: 'Thắng 3 trận với Bot',
      description: '+100 Vàng',
      icon: '♙',
      progress: todayBotWins,
      goal: 3,
      reward: { gold: 100 },
    },
  ];

  const recentMatches = useMemo<RecentMatch[]>(() => {
    const local: RecentMatch[] = historyEntries.map(entry => ({
      id: entry.id,
      date: entry.date,
      opponent: entry.opponent,
      result: entry.result,
      detail: 'Ván cục bộ',
    }));
    const online: RecentMatch[] = onlineMatches.map(match => {
      const opponent = match.match_players.find(player => player.user_id !== userId);
      const result = !match.winner_id
        ? (match.status === 'DRAW' ? 'draw' : 'playing')
        : match.winner_id === userId ? 'win' : 'loss';
      return {
        id: match.id,
        date: match.created_at,
        opponent: opponent ? 'Đối thủ PvP' : 'Ván PvP',
        result,
        detail: 'PvP online',
      };
    });
    const unique = new Map<string, RecentMatch>();
    [...online, ...local]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .forEach(match => unique.set(match.id, match));
    return [...unique.values()].slice(0, 3);
  }, [historyEntries, onlineMatches, userId]);

  const currentServerEntry = leaderboard?.find(
    entry => entry.player.id === userId || entry.player.username === (username || profile?.username),
  );

  const handlePvPPress = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Cần tài khoản để chơi PvP',
        'Chế độ khách có thể chơi với bot. Đăng nhập để tìm đối thủ trực tuyến.',
        isGuest
          ? [
              { text: 'Để sau', style: 'cancel' },
              { text: 'Đăng nhập', onPress: () => useAuthStore.getState().exitGuestMode() },
            ]
          : [{ text: 'Đóng', style: 'cancel' }],
      );
      return;
    }
    navigation.navigate('Matchmaking');
  };

  const handleMissionAction = (task: DailyTask, complete: boolean, claimed: boolean) => {
    if (!complete) {
      navigation.navigate('GamePvE', { botId: BOT_LEVELS[0].id });
      return;
    }
    if (claimed) return;
    if (!claimReward(task.id, todayKey)) return;
    if (task.reward.gold) addGold(task.reward.gold);
    if (task.reward.gems) addGems(task.reward.gems);
    if (task.reward.experience) addExperience(task.reward.experience);
    Alert.alert('Đã nhận thưởng', task.description);
  };

  const displayName = isAuthenticated && username ? username : profile?.username || 'Khách';
  const experienceProgress = profile
    ? Math.min(100, Math.max(0, (profile.experience / Math.max(1, profile.experienceToNextLevel)) * 100))
    : 0;
  const avatarSource = profile?.avatarUrl ? { uri: profile.avatarUrl } : CHAMPION_AVATAR;

  if (!profile || !stats) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Đang tải hồ sơ kỳ thủ…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundDark}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshDashboard} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <Image source={LOGO} style={styles.logo} accessibilityLabel="Arcane Chess" />
            <Text style={styles.brandName}>ARCANE CHESS</Text>
          </View>
          <View style={styles.topActions}>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>✦ {profile.experience} XP</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              style={styles.themeButton}
              onPress={toggleTheme}
            >
              <Text style={styles.themeButtonText}>{isDark ? '☀' : '☾'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Mở hồ sơ"
              onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
            >
              <Image source={avatarSource} style={styles.headerAvatar} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.accountCard}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
        >
          <View style={styles.accountTop}>
            <Image source={avatarSource} style={styles.playerAvatar} />
            <View style={styles.playerInfo}>
              <View style={styles.playerNameRow}>
                <Text numberOfLines={1} style={styles.playerName}>{displayName}</Text>
                <Text style={styles.verifiedMark}>✦</Text>
              </View>
              <View style={styles.playerBadges}>
                <Text style={styles.levelBadge}>LV {profile.level}</Text>
                <Text numberOfLines={1} style={styles.playerTitle}>
                  {profile.level >= 20 ? 'Đại Kiện Tướng' : profile.level >= 10 ? 'Kiện Tướng' : 'Tân Thủ'}
                </Text>
              </View>
              <Text style={styles.serverRank}>
                {currentServerEntry ? `Hạng #${currentServerEntry.rank} Server` : 'Hồ sơ kỳ thủ'}
              </Text>
            </View>
            <View style={styles.eloCard}>
              <Text style={styles.eloLabel}>ARCANE ELO</Text>
              <Text style={styles.eloValue}>{profile.rating.toLocaleString('vi-VN')}</Text>
              <Text style={styles.eloCaption}>Điểm cá nhân</Text>
            </View>
          </View>
          <View style={styles.accountStats}>
            <View style={styles.accountStat}>
              <Text style={styles.statLabel}>TỈ LỆ THẮNG</Text>
              <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            </View>
            <View style={styles.accountStat}>
              <Text style={styles.statLabel}>TỔNG TRẬN</Text>
              <Text style={styles.statValue}>{stats.totalGames}</Text>
            </View>
            <View style={styles.accountStat}>
              <Text style={styles.statLabel}>THẮNG / THUA</Text>
              <Text style={styles.statValue}>{profile.wins}/{profile.losses}</Text>
            </View>
            <View style={styles.accountStat}>
              <Text style={styles.statLabel}>CHUỖI THẮNG</Text>
              <Text style={styles.streakValue}>♨ {stats.currentWinStreak}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>▤  Nhiệm Vụ Hằng Ngày</Text>
            <Text style={styles.sectionHint}>Làm mới mỗi ngày</Text>
          </View>
          <View style={styles.taskList}>
            {tasks.map(task => {
              const complete = task.progress >= task.goal;
              const claimed = claimDate === todayKey && claimedIds.includes(task.id);
              const progress = Math.min(100, (task.progress / task.goal) * 100);
              return (
                <View key={task.id} style={[styles.taskCard, complete && styles.taskCardComplete]}>
                  <View style={[styles.taskIcon, complete && styles.taskIconComplete]}>
                    <Text style={[styles.taskIconText, complete && styles.taskIconTextComplete]}>{task.icon}</Text>
                  </View>
                  <View style={styles.taskMain}>
                    <Text numberOfLines={1} style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskReward}>{task.description}</Text>
                    <View style={styles.taskProgressTrack}>
                      <View style={[styles.taskProgress, { width: `${progress}%` }]} />
                    </View>
                  </View>
                  <View style={styles.taskRight}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ disabled: complete && claimed }}
                      disabled={complete && claimed}
                      style={[styles.taskAction, complete && styles.taskActionComplete, claimed && styles.taskActionClaimed]}
                      onPress={() => handleMissionAction(task, complete, claimed)}
                    >
                      <Text style={[styles.taskActionText, complete && styles.taskActionTextComplete]}>
                        {claimed ? 'Đã nhận' : complete ? 'Nhận thưởng' : 'Vào trận'}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.taskCount}>{Math.min(task.progress, task.goal)}/{task.goal}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.seasonCard}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Modes' })}
        >
          <Image source={SEASON_BANNER} style={styles.seasonImage} />
          <View style={styles.seasonShade} />
          <View style={styles.seasonContent}>
            <Text style={styles.seasonTag}>SỰ KIỆN ARCANE</Text>
            <Text style={styles.seasonTitle}>SEASON 4: SHADOW CROWN MASTERS</Text>
            <Text numberOfLines={1} style={styles.seasonSubtitle}>Khám phá thử thách và chế độ chiến đấu mới</Text>
            <View style={styles.seasonBottom}>
              <Text style={styles.seasonReward}>♛  Mùa giải Arcane</Text>
              <Text style={styles.seasonButton}>Khám phá  ›</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.passCard}>
          <View style={styles.passLevel}>
            <Text style={styles.passLevelCaption}>LV</Text>
            <Text style={styles.passLevelValue}>{profile.level}</Text>
          </View>
          <View style={styles.passMain}>
            <View style={styles.passTextRow}>
              <Text style={styles.passTitle}>Arcane Pass: Hữu Vệ</Text>
              <Text style={styles.passXp}>{profile.experience}/{profile.experienceToNextLevel} XP</Text>
            </View>
            <View style={styles.passTrack}>
              <View style={[styles.passProgress, { width: `${experienceProgress}%` }]} />
            </View>
          </View>
          <Text style={styles.passIcon}>♙</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>♧  Chế Độ Chiến Đấu</Text>
            <Text style={styles.onlineStatus}>{isAuthenticated ? '● PvP trực tuyến' : '● Chế độ khách'}</Text>
          </View>

          <View style={styles.rankedCard}>
            <View style={styles.rankedTitleRow}>
              <View style={styles.modeIconGold}><Text style={styles.modeIconText}>♜</Text></View>
              <View style={styles.modeTitleGroup}>
                <View style={styles.modeNameRow}>
                  <Text style={styles.modeTitle}>ĐẤU XẾP HẠNG</Text>
                  <Text style={styles.rankedBadge}>RANKED</Text>
                </View>
                <Text style={styles.modeCaption}>Chiến đấu tăng ELO trên toàn server</Text>
              </View>
            </View>
            <View style={styles.timeControls}>
              <View style={[styles.timeOption, styles.timeOptionActive]}>
                <Text style={styles.timeOptionName}>BLITZ</Text>
                <Text style={styles.timeOptionValue}>3m | 2s</Text>
              </View>
              <View style={styles.timeOption}>
                <Text style={styles.timeOptionName}>RAPID</Text>
                <Text style={styles.timeOptionValue}>10m</Text>
              </View>
              <View style={styles.timeOption}>
                <Text style={styles.timeOptionName}>BULLET</Text>
                <Text style={styles.timeOptionValue}>1m</Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.primaryButton}
              onPress={handlePvPPress}
            >
              <Text style={styles.primaryButtonText}>⊙  TÌM TRẬN NGAY</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.modeRow}
            onPress={() => navigation.navigate('GamePvE', { botId: BOT_LEVELS[0].id })}
          >
            <View style={styles.modeIconBlue}><Text style={styles.modeIconText}>♟</Text></View>
            <View style={styles.modeRowText}>
              <Text style={styles.modeRowTitle}>CHƠI VỚI MÁY <Text style={styles.pveTag}>AI PvE</Text></Text>
              <Text numberOfLines={1} style={styles.modeCaption}>Học viện • Kiện tướng • Stockfish</Text>
            </View>
            <Text style={styles.modeAction}>Chọn Bot  ›</Text>
          </TouchableOpacity>

          <View style={styles.modeRow}>
            <View style={styles.modeIconNeutral}><Text style={styles.modeIconText}>♙</Text></View>
            <View style={styles.modeRowText}>
              <Text style={styles.modeRowTitle}>TẠO PHÒNG BẠN BÈ</Text>
              <Text numberOfLines={1} style={styles.modeCaption}>Giao hữu riêng • Mời bạn bè</Text>
            </View>
            <Text style={styles.comingSoon}>SẮP RA MẮT</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.modeRow, styles.variantRow]}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Modes' })}
          >
            <View style={styles.modeIconRed}><Text style={styles.modeIconText}>◈</Text></View>
            <View style={styles.modeRowText}>
              <Text style={styles.modeRowTitle}>CHẾ ĐỘ BIẾN THỂ</Text>
              <Text numberOfLines={1} style={styles.modeCaption}>Cờ Sương Mù • Cột Máu HP</Text>
            </View>
            <Text style={styles.modeAction}>Trải nghiệm  ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>♜  Đỉnh Bảng Server</Text>
            <Text style={styles.seeAll}>TOP 3</Text>
          </View>

          {leaderboardLoading && !leaderboard ? (
            <View style={[styles.leaderboardState, styles.stateRow]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.mutedText}>Đang tải xếp hạng server…</Text>
            </View>
          ) : leaderboardError && !leaderboard ? (
            <View style={styles.leaderboardState}>
              <Text style={styles.stateText}>{leaderboardError}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => { void loadLeaderboard(); }}>
                <Text style={styles.seeAll}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : leaderboard?.length ? (
            <>
              {leaderboardError ? <Text style={styles.inlineNotice}>Không thể cập nhật. Đang hiển thị dữ liệu đã tải.</Text> : null}
              <View style={styles.podium}>
                {[leaderboard[1], leaderboard[0], leaderboard[2]].filter(Boolean).map(entry => (
                  <View key={entry.player.id} style={[styles.podiumItem, entry.rank === 1 && styles.podiumChampion]}>
                    {entry.rank === 1 ? <Text style={styles.crown}>♛</Text> : <Text style={styles.podiumRank}>#{entry.rank}</Text>}
                    <Image
                      source={entry.player.avatarUrl ? { uri: entry.player.avatarUrl } : CHAMPION_AVATAR}
                      style={[styles.podiumAvatar, entry.rank === 1 && styles.podiumAvatarChampion]}
                    />
                    <Text numberOfLines={1} style={[styles.podiumName, entry.rank === 1 && styles.podiumNameChampion]}>
                      {entry.player.username}
                    </Text>
                    <Text style={styles.podiumScore}>{entry.rating.toLocaleString('vi-VN')}</Text>
                    <Text style={styles.podiumLabel}>ELO</Text>
                  </View>
                ))}
              </View>
              <View style={styles.myRankStrip}>
                <Text style={styles.myRankValue}>
                  {currentServerEntry ? `#${currentServerEntry.rank}` : 'ELO'}
                </Text>
                <View style={styles.myRankInfo}>
                  <Text numberOfLines={1} style={styles.myRankName}>{displayName}</Text>
                  <Text style={styles.myRankCaption}>
                    {currentServerEntry ? 'Hạng trên bảng server' : 'Điểm xếp hạng cá nhân'}
                  </Text>
                </View>
                <Text style={styles.myRankRating}>{profile.rating.toLocaleString('vi-VN')} ELO</Text>
              </View>
            </>
          ) : (
            <View style={styles.leaderboardState}>
              <Text style={styles.stateText}>Chưa có kỳ thủ trên bảng xếp hạng server.</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => { void loadLeaderboard(); }}>
                <Text style={styles.seeAll}>Tải lại</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>◴  Lịch Sử Trận Đấu</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}>
              <Text style={styles.sectionHint}>3 trận gần nhất</Text>
            </TouchableOpacity>
          </View>

          {recentMatches.length ? (
            <>
              {onlineHistoryError && isAuthenticated ? (
                <View style={styles.inlineErrorRow}>
                  <Text style={styles.inlineErrorText}>{onlineHistoryError}</Text>
                  <TouchableOpacity accessibilityRole="button" onPress={() => { void loadOnlineHistory(); }}>
                    <Text style={styles.seeAll}>Thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              <View style={styles.historyList}>
                {recentMatches.map(match => {
                  const won = match.result === 'win';
                  const lost = match.result === 'loss';
                  return (
                    <TouchableOpacity
                      key={match.id}
                      accessibilityRole="button"
                      style={styles.historyCard}
                      onPress={() => navigation.navigate('MainTabs', { screen: 'History' })}
                    >
                      <View style={[styles.resultBadge, won ? styles.resultWin : lost ? styles.resultLoss : styles.resultDraw]}>
                        <Text style={styles.resultIcon}>{won ? '✓' : lost ? '×' : '•'}</Text>
                        <Text style={styles.resultLabel}>
                          {won ? 'THẮNG' : lost ? 'THUA' : match.result === 'playing' ? 'ĐANG CHƠI' : 'HÒA'}
                        </Text>
                      </View>
                      <View style={styles.matchInfo}>
                        <Text numberOfLines={1} style={styles.matchOpponent}>vs. {match.opponent}</Text>
                        <Text style={styles.matchDetail}>{match.detail}</Text>
                      </View>
                      <View style={styles.matchTime}>
                        <Text style={styles.matchRelativeTime}>{relativeDate(match.date)}</Text>
                        <Text style={styles.matchLink}>› Xem lại</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : onlineHistoryLoading ? (
            <View style={[styles.historyEmpty, styles.stateRow]}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.mutedText}>Đang tải lịch sử trận…</Text>
            </View>
          ) : onlineHistoryError && isAuthenticated ? (
            <View style={styles.historyEmpty}>
              <Text style={styles.stateText}>{onlineHistoryError}</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => { void loadOnlineHistory(); }}>
                <Text style={styles.seeAll}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.historyEmpty}>
              <Text style={styles.stateText}>Chưa có trận nào. Hãy bắt đầu một ván với Bot.</Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.emptyAction}
                onPress={() => navigation.navigate('GamePvE', { botId: BOT_LEVELS[0].id })}
              >
                <Text style={styles.emptyActionText}>Chơi ngay  ›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: Palette) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  content: { paddingHorizontal: 10, paddingTop: 4, paddingBottom: 22, gap: 12 },
  topBar: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logo: { width: 30, height: 30, borderRadius: 8 },
  brandName: { color: colors.primary, fontSize: 13, fontWeight: '900', letterSpacing: 0.8 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  xpPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 99,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  xpPillText: { color: colors.accent, fontSize: 10, fontWeight: '800' },
  themeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeButtonText: { color: colors.primary, fontSize: 17, fontWeight: '700' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.primary },
  accountCard: {
    padding: 9,
    borderRadius: 14,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  playerAvatar: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: colors.primary },
  playerInfo: { flex: 1, gap: 3, minWidth: 0 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', maxWidth: '90%' },
  verifiedMark: { color: colors.accent, fontSize: 12, fontWeight: '900' },
  playerBadges: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  levelBadge: {
    color: colors.backgroundDark,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: '900',
  },
  playerTitle: { color: colors.textSecondary, fontSize: 9, flexShrink: 1 },
  serverRank: { color: colors.textMuted, fontSize: 9 },
  eloCard: {
    width: 87,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '66',
  },
  eloLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '800', letterSpacing: 0.5 },
  eloValue: { color: colors.primary, fontSize: 20, fontWeight: '900', lineHeight: 23 },
  eloCaption: { color: colors.textMuted, fontSize: 8 },
  accountStats: { flexDirection: 'row', gap: 5 },
  accountStat: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  statLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '800', textAlign: 'center' },
  statValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '800', marginTop: 3 },
  streakValue: { color: colors.primary, fontSize: 11, fontWeight: '800', marginTop: 3 },
  section: { gap: 7 },
  sectionHeading: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  sectionHint: { color: colors.textMuted, fontSize: 9 },
  taskList: { gap: 6 },
  taskCard: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 8,
    borderRadius: 11,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskCardComplete: { borderColor: colors.primary + '88' },
  taskIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskIconComplete: { borderColor: colors.primary },
  taskIconText: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  taskIconTextComplete: { color: colors.primary },
  taskMain: { flex: 1, gap: 3, minWidth: 0 },
  taskTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '700' },
  taskReward: { color: colors.accent, fontSize: 8, fontWeight: '700' },
  taskProgressTrack: { height: 5, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden', marginTop: 2 },
  taskProgress: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  taskRight: { width: 72, alignItems: 'flex-end', gap: 5 },
  taskAction: {
    minWidth: 66,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: colors.surface,
  },
  taskActionComplete: { backgroundColor: colors.primary },
  taskActionClaimed: { opacity: 0.65 },
  taskActionText: { color: colors.textSecondary, fontSize: 8, fontWeight: '800' },
  taskActionTextComplete: { color: colors.backgroundDark },
  taskCount: { color: colors.textPrimary, fontSize: 9, fontWeight: '700' },
  seasonCard: { height: 142, overflow: 'hidden', borderRadius: 13, backgroundColor: colors.backgroundCard },
  seasonImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  seasonShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.42)' },
  seasonContent: { flex: 1, justifyContent: 'flex-end', padding: 10, gap: 5 },
  seasonTag: {
    alignSelf: 'flex-start',
    color: '#1A1205',
    backgroundColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontSize: 8,
    fontWeight: '900',
  },
  seasonTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', lineHeight: 18 },
  seasonSubtitle: { color: '#E7E1D9', fontSize: 9 },
  seasonBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  seasonReward: { color: colors.primaryLight, fontSize: 9, fontWeight: '800' },
  seasonButton: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.primary,
    color: '#1A1205',
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '900',
  },
  passCard: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passLevel: { width: 28, alignItems: 'center' },
  passLevelCaption: { color: colors.textMuted, fontSize: 7, fontWeight: '800' },
  passLevelValue: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  passMain: { flex: 1, gap: 5 },
  passTextRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  passTitle: { color: colors.textPrimary, fontSize: 9, fontWeight: '700' },
  passXp: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  passTrack: { height: 4, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.surface },
  passProgress: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  passIcon: { color: colors.primary, fontSize: 18 },
  onlineStatus: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  rankedCard: {
    padding: 9,
    borderRadius: 13,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.primary + '88',
    gap: 8,
  },
  rankedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modeIconGold: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  modeIconBlue: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  modeIconNeutral: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  modeIconRed: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  modeIconText: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  modeTitleGroup: { flex: 1, gap: 2 },
  modeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  modeTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  rankedBadge: { color: '#1A1205', backgroundColor: colors.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, fontSize: 7, fontWeight: '900' },
  modeCaption: { color: colors.textMuted, fontSize: 8 },
  timeControls: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 4,
    backgroundColor: colors.surface,
    gap: 4,
  },
  timeOption: { flex: 1, minHeight: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 7 },
  timeOptionActive: { backgroundColor: colors.backgroundCard, borderWidth: 1, borderColor: colors.primary + '88' },
  timeOptionName: { color: colors.textSecondary, fontSize: 8, fontWeight: '800' },
  timeOptionValue: { color: colors.textPrimary, fontSize: 10, fontWeight: '800', marginTop: 1 },
  primaryButton: { minHeight: 38, justifyContent: 'center', alignItems: 'center', borderRadius: 9, backgroundColor: colors.primary },
  primaryButtonText: { color: '#1A1205', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  modeRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantRow: { backgroundColor: colors.surface, borderColor: colors.primary + '55' },
  modeRowText: { flex: 1, gap: 3, minWidth: 0 },
  modeRowTitle: { color: colors.textPrimary, fontSize: 10, fontWeight: '900' },
  pveTag: { color: colors.accent, fontSize: 8 },
  modeAction: { color: colors.accent, backgroundColor: colors.surface, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 6, fontSize: 8, fontWeight: '800' },
  comingSoon: { color: colors.textMuted, fontSize: 7, fontWeight: '900' },
  seeAll: { color: colors.accent, fontSize: 9, fontWeight: '800' },
  leaderboardState: {
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 11,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateRow: { flexDirection: 'row' },
  stateText: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  mutedText: { color: colors.textMuted, fontSize: 10 },
  inlineNotice: { color: colors.textMuted, fontSize: 9, marginBottom: 5 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 5 },
  podiumItem: {
    flex: 1,
    minHeight: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  podiumChampion: { minHeight: 116, borderColor: colors.primary, backgroundColor: colors.surface },
  crown: { color: colors.primary, fontSize: 15, fontWeight: '900' },
  podiumRank: { color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  podiumAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border },
  podiumAvatarChampion: { width: 45, height: 45, borderColor: colors.primary },
  podiumName: { color: colors.textPrimary, fontSize: 8, fontWeight: '700', maxWidth: '100%' },
  podiumNameChampion: { color: colors.primary, fontSize: 9, fontWeight: '900' },
  podiumScore: { color: colors.textPrimary, fontSize: 13, fontWeight: '900' },
  podiumLabel: { color: colors.textMuted, fontSize: 7, fontWeight: '800' },
  myRankStrip: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myRankValue: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  myRankInfo: { flex: 1, gap: 2 },
  myRankName: { color: colors.textPrimary, fontSize: 9, fontWeight: '800' },
  myRankCaption: { color: colors.textMuted, fontSize: 8 },
  myRankRating: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  historyList: { gap: 6 },
  inlineErrorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  inlineErrorText: { color: colors.textMuted, flex: 1, fontSize: 8 },
  historyCard: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultBadge: { width: 36, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  resultWin: { backgroundColor: colors.accentGreen + '18', borderColor: colors.accentGreen + '55' },
  resultLoss: { backgroundColor: colors.accentRed + '18', borderColor: colors.accentRed + '55' },
  resultDraw: { backgroundColor: colors.surface, borderColor: colors.border },
  resultIcon: { color: colors.textPrimary, fontSize: 12, fontWeight: '900', lineHeight: 13 },
  resultLabel: { color: colors.textPrimary, fontSize: 6, fontWeight: '900' },
  matchInfo: { flex: 1, gap: 3, minWidth: 0 },
  matchOpponent: { color: colors.textPrimary, fontSize: 9, fontWeight: '700' },
  matchDetail: { color: colors.textMuted, fontSize: 8 },
  matchTime: { alignItems: 'flex-end', gap: 4 },
  matchRelativeTime: { color: colors.textMuted, fontSize: 8 },
  matchLink: { color: colors.accent, fontSize: 8, fontWeight: '800' },
  historyEmpty: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyAction: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, backgroundColor: colors.primary },
  emptyActionText: { color: '#1A1205', fontSize: 9, fontWeight: '900' },
});
