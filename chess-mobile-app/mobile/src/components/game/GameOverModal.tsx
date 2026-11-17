// ============================================================
// GameOverModal - Game result display modal
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { GradientButton } from '../common/GradientButton';
import { PieceColor } from '../../types/chess';
import { admobService } from '../../services/ads/admobService';

const RESULT_REASONS: Record<string, string> = {
  CHECKMATE: 'Chiếu hết',
  DRAW: 'Ván đấu hòa',
  STALEMATE: 'Hòa do hết nước đi',
  HP: 'Đối thủ đã hết sinh mệnh',
  RESIGN: 'Một người chơi đã đầu hàng',
  TIMEOUT: 'Hết thời gian',
  DISCONNECT_TIMEOUT: 'Đối thủ mất kết nối',
};

interface GameOverModalProps {
  visible: boolean;
  winner: PieceColor | 'draw' | null;
  reason: string;
  playerColor: PieceColor;
  goldEarned?: number;
  xpEarned?: number;
  ratingChange?: number;
  matchId?: string;
  playAgainLabel?: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  winner,
  reason,
  playerColor,
  goldEarned = 0,
  xpEarned = 0,
  ratingChange = 0,
  matchId,
  playAgainLabel = 'Chơi lại',
  onPlayAgain,
  onGoHome,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isWin = winner === playerColor;
  const isDraw = winner === 'draw';
  const hasRewards = goldEarned > 0 || xpEarned > 0 || ratingChange !== 0;

  useEffect(() => {
    if (!visible) {
      scaleAnim.setValue(0.94);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      return undefined;
    }

    const entrance = Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 110,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();

    const accentMotion = isWin ? Animated.sequence([
      Animated.timing(rotateAnim, { toValue: 0.04, duration: 180, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: -0.03, duration: 180, useNativeDriver: true }),
      Animated.timing(rotateAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
    ]) : null;
    accentMotion?.start();

    const adTimer = matchId
      ? setTimeout(() => { void admobService.showAfterMatch(matchId); }, 650)
      : undefined;

    return () => {
      entrance.stop();
      accentMotion?.stop();
      if (adTimer) clearTimeout(adTimer);
    };
  }, [isWin, matchId, opacityAnim, rotateAnim, scaleAnim, visible]);

  const getResultTitle = () => {
    if (isWin) return 'CHIẾN THẮNG!';
    if (isDraw) return 'HÒA!';
    return 'THẤT BẠI';
  };

  const getResultEmoji = () => {
    if (isWin) return '♛';
    if (isDraw) return '½';
    return '♟';
  };

  const getResultColor = () => {
    if (isWin) return COLORS.accent;
    if (isDraw) return COLORS.info;
    return COLORS.danger;
  };

  const reasonText = RESULT_REASONS[reason] || reason || 'Ván đấu đã kết thúc.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onGoHome}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: getResultColor(),
            },
          ]}
          accessibilityViewIsModal
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                styles.resultMark,
                { backgroundColor: `${getResultColor()}22` },
                {
                  transform: [{
                    rotate: rotateAnim.interpolate({
                      inputRange: [-0.1, 0.1],
                      outputRange: ['-10deg', '10deg'],
                    }),
                  }],
                },
              ]}
            >
              <Text style={[styles.resultMarkText, { color: getResultColor() }]}>{getResultEmoji()}</Text>
            </Animated.View>

            <Text accessibilityRole="header" style={[styles.title, { color: getResultColor() }]}>
              {getResultTitle()}
            </Text>
            <Text style={styles.reason}>{reasonText}</Text>

            {hasRewards && (
              <View style={styles.rewardsPanel}>
                <Text style={styles.rewardsTitle}>Phần thưởng ván đấu</Text>
                {goldEarned > 0 && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardLabel}>Vàng</Text>
                    <Text style={styles.rewardValue}>+{goldEarned}</Text>
                  </View>
                )}
                {xpEarned > 0 && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardLabel}>Kinh nghiệm</Text>
                    <Text style={styles.rewardValue}>+{xpEarned} XP</Text>
                  </View>
                )}
                {ratingChange !== 0 && (
                  <View style={styles.rewardRow}>
                    <Text style={styles.rewardLabel}>Xếp hạng</Text>
                    <Text style={[styles.rewardValue, { color: ratingChange > 0 ? COLORS.success : COLORS.danger }]}>
                      {ratingChange > 0 ? '+' : ''}{ratingChange}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.buttonsContainer}>
              <GradientButton
                title={playAgainLabel}
                onPress={onPlayAgain}
                variant="primary"
                size="large"
                fullWidth
              />
              <GradientButton
                title="Về trang chủ"
                onPress={onGoHome}
                variant="outline"
                size="medium"
                fullWidth
              />
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  scroll: {
    width: '100%',
  },
  content: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  resultMark: {
    width: 76,
    height: 76,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  resultMarkText: {
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.bold,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  reason: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  rewardsPanel: {
    width: '100%',
    backgroundColor: COLORS.bgCardLight,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xxxl,
  },
  rewardsTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 34,
  },
  rewardLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  rewardValue: {
    color: COLORS.textGold,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  buttonsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
});
