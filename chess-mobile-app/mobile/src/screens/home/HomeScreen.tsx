// ============================================================
// HomeScreen - Main dashboard
// ============================================================

import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { usePlayerStore } from '../../store/playerStore';
import { PlayerAvatar } from '../../components/common/PlayerAvatar';
import { CurrencyDisplay } from '../../components/common/CurrencyDisplay';
import { GradientButton } from '../../components/common/GradientButton';
import { GlassCard } from '../../components/common/GlassCard';
import { HPBar } from '../../components/common/HPBar';
import { RootStackParamList } from '../../navigation/types';
import { BOT_LEVELS } from '../../constants/game';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { profile, stats } = usePlayerStore();

  if (!profile || !stats) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background} />
      
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header - Player Info */}
        <View style={styles.header}>
          <PlayerAvatar
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            level={profile.level}
            size="large"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{profile.username}</Text>
            <CurrencyDisplay gold={profile.gold} gems={profile.gems} />
          </View>
        </View>

        {/* HP Status */}
        <GlassCard style={styles.hpCard}>
          <Text style={styles.sectionTitle}>Sinh Mệnh Hiện Tại</Text>
          <HPBar hp={{ current: profile.currentHP, max: profile.maxHP, shield: 0 }} />
          <Text style={styles.hpDesc}>Hồi phục 1 HP mỗi 5 phút</Text>
        </GlassCard>

        {/* Play Buttons */}
        <View style={styles.playSection}>
          <GradientButton
            title="Đấu Với Người (PvP)"
            onPress={() => navigation.navigate('Matchmaking')}
            icon="⚔️"
            size="large"
            fullWidth
            style={styles.playButton}
          />
          <GradientButton
            title="Đấu Với Bot (PvE)"
            onPress={() => navigation.navigate('GamePvE', { botId: BOT_LEVELS[0].id })}
            icon="🤖"
            variant="accent"
            size="large"
            fullWidth
          />
        </View>

        {/* Stats Summary */}
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>{profile.rating}</Text>
            <Text style={styles.statLabel}>Điểm Elo</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{stats.winRate.toFixed(1)}%</Text>
            <Text style={styles.statLabel}>Tỉ lệ thắng</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={SPACING.md}>
            <Text style={styles.statIcon}>⚔️</Text>
            <Text style={styles.statValue}>{stats.totalGames}</Text>
            <Text style={styles.statLabel}>Trận đã chơi</Text>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bgDark,
    // We would use an image or gradient background here
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.lg,
  },
  headerInfo: {
    flex: 1,
    gap: SPACING.sm,
  },
  username: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
  hpCard: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  hpDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  playSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  playButton: {
    marginBottom: SPACING.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
});
