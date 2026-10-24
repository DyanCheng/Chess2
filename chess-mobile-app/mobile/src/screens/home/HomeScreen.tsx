import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { COLORS, LIGHT_COLORS, GRADIENTS } from '../../constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVATAR_IMG = require('../../assets/images/champion_avatar.png');
const BANNER_IMG = require('../../assets/images/season_banner.png');

// ============================================================
// THEME (Dark / Light)
// ============================================================
type Palette = typeof COLORS;
const ThemeContext = React.createContext<{ isDark: boolean; toggle: () => void; styles: ReturnType<typeof makeStyles>; onNavigate?: (id: string) => void } | null>(null);
const useTheme = () => React.useContext(ThemeContext)!;
const useStyles = () => useTheme().styles;

// ============================================================
// ICON COMPONENTS (Unicode / Text-based since no icon library)
// ============================================================
const Icon = ({ name, size = 20, color = COLORS.textSecondary }: { name: string; size?: number; color?: string }) => {
  const icons: Record<string, string> = {
    'crown': '👑',
    'trophy': '🏆',
    'star': '⭐',
    'sword': '⚔️',
    'shield': '🛡️',
    'gem': '💎',
    'fire': '🔥',
    'bolt': '⚡',
    'clock': '⏰',
    'chart': '📊',
    'gift': '🎁',
    'chess': '♟️',
    'king': '♚',
    'queen': '♛',
    'knight': '♞',
    'rook': '♜',
    'pawn': '♙',
    'home': '🏠',
    'gamepad': '🎮',
    'puzzle': '🧩',
    'rank': '🏅',
    'shop': '🛒',
    'bell': '🔔',
    'settings': '⚙️',
    'friends': '👥',
    'ai': '🤖',
    'eye': '👁️',
    'coin': '🪙',
    'scroll': '📜',
    'check': '✅',
    'arrow-right': '→',
    'chevron-right': '›',
    'play': '▶',
    'search': '🔍',
    'refresh': '🔄',
    'expand': '↗️',
    'lock': '🔒',
    'unlock': '🔓',
    'up': '▲',
    'down': '▼',
    'dot': '●',
    'circle': '○',
    'diamond': '◆',
    'sparkle': '✨',
    'medal': '🎖️',
    'flag': '🚩',
    'target': '🎯',
    'calendar': '📅',
    'money': '💰',
    'ticket': '🎫',
  };

  return (
    <Text style={{ fontSize: size, lineHeight: size + 4 }}>
      {icons[name] || '●'}
    </Text>
  );
};

// ============================================================
// HEADER SECTION
// ============================================================
const HeaderSection = () => {
  const { styles, isDark, toggle } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>♚</Text>
        </View>
        <View>
          <Text style={styles.logoText}>ARCANE CHESS</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelIcon}>⚡</Text>
          <Text style={styles.levelText}>48/50</Text>
        </View>
        <Animated.View style={[styles.headerIconBtn, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.headerBtnIcon}>🔔</Text>
          <View style={styles.notifDot} />
        </Animated.View>
        <TouchableOpacity style={styles.headerIconBtn} onPress={toggle}>
          <Text style={styles.headerBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// USER PROFILE CARD
// ============================================================
const UserProfileCard = () => {
  const styles = useStyles();
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.profileCard}>
      {/* Glow effect */}
      <Animated.View style={[styles.profileGlow, { opacity: glowOpacity }]} />
      
      <View style={styles.profileContent}>
        {/* Left: Avatar & Info */}
        <View style={styles.profileLeft}>
          <View style={styles.avatarContainer}>
            <Image source={AVATAR_IMG} style={styles.avatar} />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.username}>VortexGM</Text>
              <Text style={styles.verifiedBadge}>✓</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankIcon}>👑</Text>
              <Text style={styles.rankText}>Master</Text>
              <View style={styles.tierDivider} />
              <Text style={styles.tierText}>Tier</Text>
            </View>
          </View>
        </View>

        {/* Right: ELO */}
        <View style={styles.eloContainer}>
          <Text style={styles.eloLabel}>ARCANE ELO</Text>
          <View style={styles.eloRow}>
            <Text style={styles.eloValue}>1,450</Text>
            <Text style={styles.eloTrend}>↗</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tỉ Lệ{'\n'}Thắng</Text>
          <Text style={styles.statValue}>68.4%</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Tổng Trận</Text>
          <Text style={styles.statValue}>412</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Thắng /{'\n'}Thua</Text>
          <Text style={styles.statValue}>282/92</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Chuỗi{'\n'}Thắng</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakValue}>5</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// DAILY MISSIONS SECTION
// ============================================================
const DailyMissionsSection = () => {
  const styles = useStyles();
  const missions = [
    {
      title: 'Chiến thắng 2 trận Rank',
      rewards: [
        { icon: '🪙', text: '+200 Vàng', color: COLORS.primary },
        { icon: '⭐', text: '+50 EXP', color: COLORS.accent },
      ],
      progress: 1,
      total: 2,
      type: 'progress',
      actionText: 'Tiếp tục',
    },
    {
      title: 'Ăn 10 quân Hậu bất kỳ',
      rewards: [
        { icon: '💎', text: '+50 Kim Cương', color: COLORS.accentBlue },
      ],
      progress: 5,
      total: 10,
      type: 'progress',
      actionText: 'Vào trận',
    },
    {
      title: 'Giải 3 bài toán thế cờ',
      subtitle: '✨ Hoàn thành mỹ mãn!',
      rewards: [],
      progress: 3,
      total: 3,
      type: 'completed',
      actionText: 'Nhận Thưởng',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>📋</Text>
          <Text style={styles.sectionTitle}>Nhiệm Vụ Hàng Ngày</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerIcon}>⏰</Text>
          <Text style={styles.timerText}>Làm mới sau: 05h 42m</Text>
        </View>
      </View>

      {/* Mission Cards */}
      {missions.map((mission, index) => (
        <View key={index} style={[
          styles.missionCard,
          mission.type === 'completed' && styles.missionCardCompleted,
        ]}>
          <View style={styles.missionContent}>
            <View style={styles.missionLeft}>
              <View style={[
                styles.missionCheckbox,
                mission.type === 'completed' && styles.missionCheckboxCompleted,
              ]}>
                {mission.type === 'completed' ? (
                  <Text style={styles.missionCheckmark}>✓</Text>
                ) : (
                  <Text style={styles.missionProgress}>{mission.progress}/{mission.total}</Text>
                )}
              </View>
              <View style={styles.missionInfo}>
                <Text style={[
                  styles.missionTitle,
                  mission.type === 'completed' && styles.missionTitleCompleted,
                ]}>
                  {mission.title}
                </Text>
                {mission.rewards.length > 0 && (
                  <View style={styles.rewardsRow}>
                    {mission.rewards.map((reward, rIdx) => (
                      <View key={rIdx} style={styles.rewardItem}>
                        <Text style={styles.rewardIcon}>{reward.icon}</Text>
                        <Text style={[styles.rewardText, { color: reward.color }]}>{reward.text}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {mission.subtitle && (
                  <Text style={styles.missionSubtitle}>{mission.subtitle}</Text>
                )}
              </View>
            </View>
            <TouchableOpacity style={[
              styles.missionActionBtn,
              mission.type === 'completed' && styles.missionActionBtnCompleted,
            ]}>
              <Text style={[
                styles.missionActionText,
                mission.type === 'completed' && styles.missionActionTextCompleted,
              ]}>
                {mission.actionText}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          {mission.type === 'progress' && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <View style={[
                  styles.progressBarFill,
                  { width: `${(mission.progress / mission.total) * 100}%` },
                ]} />
              </View>
              <Text style={styles.progressText}>{mission.progress}/{mission.total}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

// ============================================================
// SEASON EVENT BANNER
// ============================================================
const SeasonEventBanner = () => {
  const styles = useStyles();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View style={styles.seasonBanner}>
      {/* Background gradient overlay */}
      <ImageBackground source={BANNER_IMG} style={styles.seasonBannerBg} resizeMode="cover">
        <View style={styles.seasonBannerOverlay} />
      </ImageBackground>

      {/* Badge */}
      <View style={styles.seasonBadge}>
        <Text style={styles.seasonBadgeIcon}>🏆</Text>
        <Text style={styles.seasonBadgeText}>MAJOR ESPORTS EVENT</Text>
        <View style={styles.seasonCountdown}>
          <Text style={styles.seasonCountdownText}>Còn 3 ngày</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.seasonTitle}>SEASON 4: SHADOW CROWN{'\n'}MASTERS</Text>
      <Text style={styles.seasonDescription}>
        Tổng giải thưởng $10,000 USD & Bảng cờ Đại Hắc Ám độc quyền
      </Text>

      {/* Prize Pool */}
      <View style={styles.seasonPrizeRow}>
        <View style={styles.prizeTag}>
          <Text style={styles.prizeTagIcon}>💰</Text>
          <Text style={styles.prizeTagText}>$10,000 POOL</Text>
        </View>
        <TouchableOpacity style={styles.joinBtn}>
          <Text style={styles.joinBtnText}>Tham Gia Ngay</Text>
        </TouchableOpacity>
      </View>

      {/* Shimmer effect */}
      <Animated.View style={[
        styles.shimmerOverlay,
        { transform: [{ translateX: shimmerTranslate }] },
      ]} />
    </View>
  );
};

// ============================================================
// ARCANE PASS PROGRESS
// ============================================================
const ArcanePassProgress = () => {
  const styles = useStyles();
  return (
    <View style={styles.arcanePass}>
      <View style={styles.arcanePassLeft}>
        <Text style={styles.arcanePassIcon}>🎫</Text>
        <Text style={styles.arcanePassTitle}>Arcane Pass Hùng Vũ</Text>
      </View>
      <View style={styles.arcanePassRight}>
        <View style={styles.arcanePassBarBg}>
          <View style={[styles.arcanePassBarFill, { width: '82%' }]} />
        </View>
        <Text style={styles.arcanePassXP}>820/1000 XP</Text>
      </View>
      <View style={styles.arcanePassLevel}>
        <Text style={styles.arcanePassLevelIcon}>⭐</Text>
        <Text style={styles.arcanePassLevelText}>24</Text>
      </View>
    </View>
  );
};

// ============================================================
// BATTLE MODE SECTION
// ============================================================
const BattleModeSection = () => {
  const styles = useStyles();
  const [selectedMode, setSelectedMode] = useState('rapid');

  return (
    <View style={styles.sectionContainer}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>⚔️</Text>
          <Text style={styles.sectionTitle}>Chế Độ Chiến Đấu</Text>
        </View>
        <View style={styles.onlineCountBadge}>
          <View style={styles.onlineDotSmall} />
          <Text style={styles.onlineCountText}>14,892 Đang Trực Tuyến</Text>
        </View>
      </View>

      {/* ĐẤU XẾP HẠNG */}
      <View style={styles.rankedCard}>
        <View style={styles.rankedHeader}>
          <View style={styles.rankedTitleRow}>
            <Text style={styles.rankedIcon}>🏅</Text>
            <Text style={styles.rankedTitle}>ĐẤU XẾP HẠNG</Text>
            <View style={styles.rankedBadge}>
              <Text style={styles.rankedBadgeText}>RANKED</Text>
            </View>
          </View>
          <Text style={styles.rankedSubtitle}>Chiến đấu nâng ELO trên bảng xếp hạng</Text>
        </View>

        {/* Time Control Options */}
        <View style={styles.timeControlRow}>
          {[
            { id: 'blitz', label: 'BLITZ', time: '3m | 2s', color: '#FFB347' },
            { id: 'rapid', label: 'RAPID', time: '10m', color: '#22D3EE' },
            { id: 'bullet', label: 'BULLET', time: '1m', color: '#EF4444' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.timeControlBtn,
                selectedMode === mode.id && [styles.timeControlBtnActive, { borderColor: mode.color }],
              ]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <Text style={[
                styles.timeControlLabel,
                selectedMode === mode.id && { color: mode.color },
              ]}>
                {mode.label}
              </Text>
              <Text style={[
                styles.timeControlTime,
                selectedMode === mode.id && { color: COLORS.textPrimary },
              ]}>
                {mode.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Find Match Button */}
        <TouchableOpacity style={styles.findMatchBtn}>
          <View style={styles.findMatchGlow} />
          <Text style={styles.findMatchIcon}>🔍</Text>
          <Text style={styles.findMatchText}>TÌM TRẬN NGAY</Text>
        </TouchableOpacity>
      </View>

      {/* CHƠI VỚI MÁY */}
      <TouchableOpacity style={styles.modeCard}>
        <View style={styles.modeCardLeft}>
          <View style={[styles.modeIconContainer, { backgroundColor: '#1A2940' }]}>
            <Text style={styles.modeIcon}>🤖</Text>
          </View>
          <View>
            <View style={styles.modeNameRow}>
              <Text style={styles.modeName}>CHƠI VỚI MÁY</Text>
              <View style={styles.modeTag}>
                <Text style={styles.modeTagText}>AI PvE</Text>
              </View>
            </View>
            <Text style={styles.modeDesc}>Học viên • Kiện tướng • Stockfish</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.modeActionBtn}>
          <Text style={styles.modeActionText}>Chọn Bot</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* TẠO PHÒNG BẠN BÈ */}
      <TouchableOpacity style={styles.modeCard}>
        <View style={styles.modeCardLeft}>
          <View style={[styles.modeIconContainer, { backgroundColor: '#1A2940' }]}>
            <Text style={styles.modeIcon}>👥</Text>
          </View>
          <View>
            <Text style={styles.modeName}>TẠO PHÒNG BẠN BÈ</Text>
            <Text style={styles.modeDesc}>Giao hữu • Tùy chỉnh • Mời bạn FBE</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.modeActionBtn, styles.modeActionBtnOutline]}>
          <Text style={[styles.modeActionText, styles.modeActionTextOutline]}>Vào phòng bè</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* CHẾ ĐỘ BIẾN THỂ */}
      <TouchableOpacity style={styles.modeCard}>
        <View style={styles.modeCardLeft}>
          <View style={[styles.modeIconContainer, { backgroundColor: '#2A1A40' }]}>
            <Text style={styles.modeIcon}>✨</Text>
          </View>
          <View>
            <View style={styles.modeNameRow}>
              <Text style={styles.modeName}>CHẾ ĐỘ BIẾN THỂ</Text>
              <View style={[styles.modeTag, { backgroundColor: '#7C3AED20' }]}>
                <Text style={[styles.modeTagText, { color: '#A78BFA' }]}>MỚI</Text>
              </View>
            </View>
            <Text style={styles.modeDesc}>Cờ đang Mù • Cờ Mash HP...</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.modeActionBtn, styles.modeActionBtnPurple]}>
          <Text style={styles.modeActionText}>Thử ngay nhỉ...</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// LEADERBOARD SECTION
// ============================================================
const LeaderboardSection = () => {
  const styles = useStyles();
  const topPlayers = [
    { rank: 1, name: 'Magnus_Arc...', elo: 2840, change: '+12', avatar: 'M' },
    { rank: 2, name: 'Levy_Storm', elo: 2810, change: '+5', avatar: 'L' },
    { rank: 3, name: 'VeleyDragon...', elo: 2790, change: '-3', avatar: 'V' },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>🏆</Text>
          <Text style={styles.sectionTitle}>Bảng Xếp Hạng Server</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.seeAllLink}>Xem tất cả ›</Text>
        </TouchableOpacity>
      </View>

      {/* Top 3 Podium */}
      <View style={styles.podiumContainer}>
        {/* 2nd place */}
        <View style={[styles.podiumItem, styles.podiumSecond]}>
          <View style={[styles.podiumAvatar, styles.podiumAvatarSilver]}>
            <Text style={styles.podiumAvatarText}>L</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>Levy_Storm</Text>
          <View style={styles.podiumEloContainer}>
            <Text style={styles.podiumElo}>2,810</Text>
          </View>
          <View style={[styles.podiumBase, styles.podiumBaseSilver]}>
            <Text style={styles.podiumRank}>2</Text>
          </View>
        </View>

        {/* 1st place */}
        <View style={[styles.podiumItem, styles.podiumFirst]}>
          <Text style={styles.crownIcon}>👑</Text>
          <View style={[styles.podiumAvatar, styles.podiumAvatarGold]}>
            <Image source={AVATAR_IMG} style={styles.podiumAvatarImg} />
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>Magnus_Arc...</Text>
          <View style={styles.podiumEloContainer}>
            <Text style={[styles.podiumElo, styles.podiumEloGold]}>2,840</Text>
          </View>
          <Text style={styles.podiumSubtext}>Đương kim Vô{'\n'}địch</Text>
          <View style={[styles.podiumBase, styles.podiumBaseGold]}>
            <Text style={styles.podiumRank}>1</Text>
          </View>
        </View>

        {/* 3rd place */}
        <View style={[styles.podiumItem, styles.podiumThird]}>
          <View style={[styles.podiumAvatar, styles.podiumAvatarBronze]}>
            <Text style={styles.podiumAvatarText}>V</Text>
          </View>
          <Text style={styles.podiumName} numberOfLines={1}>VeleyDragon...</Text>
          <View style={styles.podiumEloContainer}>
            <Text style={styles.podiumElo}>2,790</Text>
          </View>
          <View style={[styles.podiumBase, styles.podiumBaseBronze]}>
            <Text style={styles.podiumRank}>3</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ============================================================
// PLAYER RANK CARD
// ============================================================
const PlayerRankCard = () => {
  const styles = useStyles();
  return (
    <View style={styles.playerRankCard}>
      <View style={styles.playerRankLeft}>
        <Text style={styles.playerRankNumber}>#142</Text>
        <Image source={AVATAR_IMG} style={styles.playerRankAvatar} />
        <View>
          <Text style={styles.playerRankName}>VortexGM (Bạn)</Text>
          <Text style={styles.playerRankTier}>Top 4.5% Server</Text>
        </View>
      </View>
      <View style={styles.playerRankRight}>
        <Text style={styles.playerRankElo}>1,450 ELO</Text>
      </View>
    </View>
  );
};

// ============================================================
// MATCH HISTORY SECTION
// ============================================================
const MatchHistorySection = () => {
  const styles = useStyles();
  const matches = [
    {
      result: 'THẮNG',
      resultColor: COLORS.accentGreen,
      opponent: 'DarkBishop (1420)',
      details: '+18 ELO  •  Chiếu hết  •  Blitz 3m',
      time: '25 phút trước',
    },
    {
      result: 'THẮNG',
      resultColor: COLORS.accentGreen,
      opponent: 'GrandTactician (1445)',
      details: '+22 ELO  •  Hết giờ  •  Rapid 10m',
      time: '1 giờ trước',
    },
    {
      result: 'THUA',
      resultColor: COLORS.accentRed,
      opponent: 'KnightRider (1510)',
      details: '-14 ELO  •  Bỏ cuộc  •  Blitz 3m',
      time: 'Hôm qua',
    },
  ];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>📜</Text>
          <Text style={styles.sectionTitle}>Lịch Sử Trận Đấu</Text>
        </View>
        <View style={styles.historyTabs}>
          <TouchableOpacity style={styles.historyTabActive}>
            <Text style={styles.historyTabTextActive}>3 Trận Gần Nhất</Text>
          </TouchableOpacity>
        </View>
      </View>

      {matches.map((match, index) => (
        <View key={index} style={styles.matchCard}>
          <View style={styles.matchLeft}>
            <View style={[styles.matchResultBadge, { backgroundColor: match.resultColor + '20' }]}>
              <Text style={[styles.matchResultText, { color: match.resultColor }]}>{match.result}</Text>
            </View>
            <View style={styles.matchInfo}>
              <Text style={styles.matchOpponent}>vs. {match.opponent}</Text>
              <Text style={styles.matchDetails}>{match.details}</Text>
            </View>
          </View>
          <View style={styles.matchRight}>
            <Text style={styles.matchTime}>{match.time}</Text>
            <TouchableOpacity>
              <Text style={styles.matchReview}>Xem lại ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
};

// ============================================================
// BOTTOM TAB BAR
// ============================================================
const BottomTabBar = () => {
  const styles = useStyles();
  const { onNavigate } = useTheme();
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', label: 'Trang chủ', icon: '🏠' },
    { id: 'modes', label: 'Chế độ', icon: '⚔️' },
    { id: 'puzzle', label: 'Giải đố', icon: '🧩' },
    { id: 'ranking', label: 'Xếp hạng', icon: '🏅' },
    { id: 'shop', label: 'Cửa hàng', icon: '🛒' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => { setActiveTab(tab.id); onNavigate?.(tab.id); }}
        >
          <Text style={[
            styles.tabIcon,
            { opacity: activeTab === tab.id ? 1 : 0.5 },
          ]}>
            {tab.icon}
          </Text>
          <Text style={[
            styles.tabLabel,
            activeTab === tab.id ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}>
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.tabActiveIndicator} />}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================================
// MAIN HOME SCREEN
// ============================================================
const HomeScreen = ({ onNavigate }: { onNavigate?: (id: string) => void }) => {
  const [isDark, setIsDark] = useState(true);
  const palette: Palette = isDark ? COLORS : LIGHT_COLORS;
  const styles = React.useMemo(() => makeStyles(palette), [isDark]);
  const ctx = React.useMemo(() => ({ isDark, toggle: () => setIsDark(v => !v), styles, onNavigate }), [isDark, styles, onNavigate]);

  return (
    <ThemeContext.Provider value={ctx}>
      <View style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={palette.backgroundDark} />

        {/* Fixed Header */}
        <HeaderSection />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <UserProfileCard />
          <DailyMissionsSection />
          <SeasonEventBanner />
          <ArcanePassProgress />
          <BattleModeSection />
          <LeaderboardSection />
          <PlayerRankCard />
          <MatchHistorySection />

          {/* Bottom spacing for tab bar */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Fixed Bottom Tab Bar */}
        <BottomTabBar />
      </View>
    </ThemeContext.Provider>
  );
};

// ============================================================
// STYLES
// ============================================================
// `COLORS` param intentionally shadows the import so styles follow the active theme.
const makeStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },

  // === HEADER ===
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.xxl + 20, // Status bar offset
    backgroundColor: COLORS.backgroundDark,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  logoIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  logoText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  levelIcon: {
    fontSize: 12,
  },
  levelText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBtnIcon: {
    fontSize: 16,
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentRed,
    borderWidth: 1.5,
    borderColor: COLORS.backgroundDark,
  },

  // === PROFILE CARD ===
  profileCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  profileGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primary,
    opacity: 0.1,
  },
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  podiumAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  avatarText: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.online,
    borderWidth: 2.5,
    borderColor: COLORS.backgroundCard,
  },
  profileInfo: {
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  username: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  verifiedBadge: {
    fontSize: 12,
    color: COLORS.accent,
    backgroundColor: COLORS.accent + '20',
    borderRadius: BORDER_RADIUS.full,
    width: 18,
    height: 18,
    textAlign: 'center',
    lineHeight: 18,
    overflow: 'hidden',
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
    alignSelf: 'flex-start',
  },
  rankIcon: {
    fontSize: 12,
  },
  rankText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  tierDivider: {
    width: 1,
    height: 10,
    backgroundColor: COLORS.primary + '40',
    marginHorizontal: 2,
  },
  tierText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary + 'AA',
  },
  eloContainer: {
    alignItems: 'flex-end',
  },
  eloLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 1,
    marginBottom: 2,
  },
  eloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eloValue: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },
  eloTrend: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.accentGreen,
    fontWeight: FONT_WEIGHT.bold,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 14,
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakIcon: {
    fontSize: 14,
  },
  streakValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.accentRed,
  },

  // === SECTION GENERIC ===
  sectionContainer: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  seeAllLink: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // Timer
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  timerIcon: {
    fontSize: 11,
  },
  timerText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },

  // === MISSIONS ===
  missionCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionCardCompleted: {
    borderColor: COLORS.accentGreen + '40',
    backgroundColor: COLORS.accentGreen + '08',
  },
  missionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  missionCheckbox: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionCheckboxCompleted: {
    backgroundColor: COLORS.accentGreen + '20',
    borderColor: COLORS.accentGreen,
  },
  missionCheckmark: {
    fontSize: 16,
    color: COLORS.accentGreen,
    fontWeight: FONT_WEIGHT.bold,
  },
  missionProgress: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.bold,
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  missionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  missionSubtitle: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accentGreen,
    marginTop: 2,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: 2,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardIcon: {
    fontSize: 12,
  },
  rewardText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.medium,
  },
  missionActionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionActionBtnCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  missionActionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  missionActionTextCompleted: {
    color: COLORS.backgroundDark,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },

  // === SEASON BANNER ===
  seasonBanner: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: '#1A0A3E',
    borderWidth: 1,
    borderColor: COLORS.secondary + '40',
    position: 'relative',
  },
  seasonBannerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A0A3E',
  },
  // dark scrim keeps text readable over the artwork in both themes
  seasonBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 5, 30, 0.55)',
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  seasonBadgeIcon: {
    fontSize: 14,
  },
  seasonBadgeText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.secondaryLight,
    letterSpacing: 1.5,
  },
  seasonCountdown: {
    backgroundColor: COLORS.accentRed + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
  },
  seasonCountdownText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.accentRed,
    fontWeight: FONT_WEIGHT.semibold,
  },
  seasonTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  seasonDescription: {
    fontSize: FONT_SIZE.sm,
    color: '#D1D5DB',
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  seasonPrizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prizeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  prizeTagIcon: {
    fontSize: 14,
  },
  prizeTagText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  joinBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOW.gold,
  },
  joinBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#1A1205',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    transform: [{ skewX: '-20deg' }],
  },

  // === ARCANE PASS ===
  arcanePass: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  arcanePassLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  arcanePassIcon: {
    fontSize: 16,
  },
  arcanePassTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },
  arcanePassRight: {
    flex: 1,
    gap: 4,
  },
  arcanePassBarBg: {
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  arcanePassBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  arcanePassXP: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  arcanePassLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  arcanePassLevelIcon: {
    fontSize: 12,
  },
  arcanePassLevelText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },

  // === ONLINE COUNT ===
  onlineCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accentGreen + '10',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.accentGreen + '30',
  },
  onlineDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentGreen,
  },
  onlineCountText: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.accentGreen,
    fontWeight: FONT_WEIGHT.medium,
  },

  // === RANKED CARD ===
  rankedCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rankedHeader: {
    marginBottom: SPACING.lg,
  },
  rankedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  rankedIcon: {
    fontSize: 18,
  },
  rankedTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  rankedBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.xs,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  rankedBadgeText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  rankedSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },

  // Time Controls
  timeControlRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  timeControlBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  timeControlBtnActive: {
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
  },
  timeControlLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  timeControlTime: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textSecondary,
  },

  // Find Match
  findMatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.sm,
    overflow: 'hidden',
    ...SHADOW.gold,
  },
  findMatchGlow: {
    position: 'absolute',
    top: -20,
    left: '30%',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  findMatchIcon: {
    fontSize: 18,
  },
  findMatchText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: '#1A1205',
    letterSpacing: 1,
  },

  // === MODE CARDS ===
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  modeIconContainer: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 20,
  },
  modeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  modeName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  modeTag: {
    backgroundColor: COLORS.accentGreen + '15',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.xs,
  },
  modeTagText: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.accentGreen,
    letterSpacing: 0.5,
  },
  modeDesc: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  modeActionBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  modeActionText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  modeActionBtnOutline: {
    backgroundColor: 'transparent',
    borderColor: COLORS.textMuted + '40',
  },
  modeActionTextOutline: {
    color: COLORS.textSecondary,
  },
  modeActionBtnPurple: {
    backgroundColor: COLORS.secondary + '15',
    borderColor: COLORS.secondary + '30',
  },

  // === LEADERBOARD ===
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    paddingTop: SPACING.xxxl,
    paddingBottom: 0,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
  },
  podiumFirst: {
    marginBottom: 0,
  },
  podiumSecond: {
    marginBottom: 0,
  },
  podiumThird: {
    marginBottom: 0,
  },
  crownIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    borderWidth: 2.5,
  },
  podiumAvatarGold: {
    backgroundColor: '#3A2800',
    borderColor: COLORS.primary,
  },
  podiumAvatarSilver: {
    backgroundColor: '#1A1A2E',
    borderColor: '#94A3B8',
    width: 42,
    height: 42,
  },
  podiumAvatarBronze: {
    backgroundColor: '#2A1A0A',
    borderColor: '#CD7F32',
    width: 42,
    height: 42,
  },
  podiumAvatarText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  podiumName: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 4,
    textAlign: 'center',
  },
  podiumEloContainer: {
    marginBottom: SPACING.sm,
  },
  podiumElo: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  podiumEloGold: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.lg,
  },
  podiumSubtext: {
    fontSize: FONT_SIZE.xs - 1,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 14,
  },
  podiumBase: {
    width: '100%',
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderTopLeftRadius: BORDER_RADIUS.sm,
    borderTopRightRadius: BORDER_RADIUS.sm,
  },
  podiumBaseGold: {
    backgroundColor: COLORS.primary + '25',
    paddingVertical: SPACING.xl,
  },
  podiumBaseSilver: {
    backgroundColor: '#94A3B815',
    paddingVertical: SPACING.lg,
  },
  podiumBaseBronze: {
    backgroundColor: '#CD7F3215',
    paddingVertical: SPACING.md,
  },
  podiumRank: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.textMuted,
  },

  // === PLAYER RANK ===
  playerRankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  playerRankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  playerRankNumber: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textMuted,
  },
  playerRankAvatar: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  playerRankAvatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  playerRankName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textPrimary,
  },
  playerRankTier: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  playerRankRight: {},
  playerRankElo: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.primary,
  },

  // === MATCH HISTORY ===
  historyTabs: {
    flexDirection: 'row',
  },
  historyTabActive: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  historyTabTextActive: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.primary,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  matchResultBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.xs,
    minWidth: 50,
    alignItems: 'center',
  },
  matchResultText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.bold,
  },
  matchInfo: {
    flex: 1,
  },
  matchOpponent: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  matchDetails: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  matchRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  matchTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
  },
  matchReview: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },

  // === TAB BAR ===
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.tabBarBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: SPACING.lg, // Safe area
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: FONT_WEIGHT.medium,
  },
  tabLabelActive: {
    color: COLORS.tabBarActive,
  },
  tabLabelInactive: {
    color: COLORS.tabBarInactive,
  },
  tabActiveIndicator: {
    position: 'absolute',
    top: -SPACING.sm - 1,
    width: 24,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 1.5,
  },
});

export default HomeScreen;
