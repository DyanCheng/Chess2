// ============================================================
// GameOverModal - Game result display modal
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { GradientButton } from '../common/GradientButton';
import { PieceColor } from '../../types/chess';

interface GameOverModalProps {
  visible: boolean;
  winner: PieceColor | 'draw' | null;
  reason: string;
  playerColor: PieceColor;
  goldEarned?: number;
  xpEarned?: number;
  ratingChange?: number;
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
  onPlayAgain,
  onGoHome,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isWin = winner === playerColor;
  const isDraw = winner === 'draw';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Trophy rotation for wins
      if (isWin) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, { toValue: 0.05, duration: 1000, useNativeDriver: true }),
            Animated.timing(rotateAnim, { toValue: -0.05, duration: 1000, useNativeDriver: true }),
          ])
        ).start();
      }
    }
  }, [visible]);

  const getResultTitle = () => {
    if (isWin) return 'CHIẾN THẮNG!';
    if (isDraw) return 'HÒA!';
    return 'THẤT BẠI';
  };

  const getResultEmoji = () => {
    if (isWin) return '🏆';
    if (isDraw) return '🤝';
    return '💔';
  };

  const getResultColor = () => {
    if (isWin) return COLORS.accent;
    if (isDraw) return COLORS.info;
    return COLORS.danger;
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              borderColor: getResultColor(),
            },
          ]}
        >
          {/* Result emoji */}
          <Animated.Text
            style={[
              styles.emoji,
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
            {getResultEmoji()}
          </Animated.Text>

          {/* Result title */}
          <Text style={[styles.title, { color: getResultColor() }]}>
            {getResultTitle()}
          </Text>

          {/* Reason */}
          <Text style={styles.reason}>{reason}</Text>

          {/* Rewards */}
          <View style={styles.rewardsContainer}>
            {goldEarned > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🪙</Text>
                <Text style={styles.rewardText}>+{goldEarned}</Text>
              </View>
            )}
            {xpEarned > 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardText}>+{xpEarned} XP</Text>
              </View>
            )}
            {ratingChange !== 0 && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>📊</Text>
                <Text style={[styles.rewardText, { color: ratingChange > 0 ? COLORS.success : COLORS.danger }]}>
                  {ratingChange > 0 ? '+' : ''}{ratingChange}
                </Text>
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            <GradientButton
              title="Chơi lại"
              onPress={onPlayAgain}
              variant="primary"
              size="large"
              icon="🔄"
              fullWidth
            />
            <GradientButton
              title="Trang chủ"
              onPress={onGoHome}
              variant="outline"
              size="medium"
              fullWidth
            />
          </View>
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
  },
  container: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 2,
    padding: SPACING.xxxl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  emoji: {
    fontSize: 72,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: FONT_WEIGHTS.extrabold,
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },
  reason: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xxl,
  },
  rewardsContainer: {
    flexDirection: 'row',
    gap: SPACING.xl,
    marginBottom: SPACING.xxxl,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  rewardIcon: {
    fontSize: 18,
  },
  rewardText: {
    color: COLORS.textGold,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  buttonsContainer: {
    width: '100%',
    gap: SPACING.md,
  },
});
