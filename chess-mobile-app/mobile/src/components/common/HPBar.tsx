// ============================================================
// HPBar - Health Points bar with shield and animation
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { PlayerHP } from '../../types/player';

interface HPBarProps {
  hp: PlayerHP;
  maxHP?: number;
  showLabel?: boolean;
  compact?: boolean;
  isOpponent?: boolean;
}

export const HPBar: React.FC<HPBarProps> = ({
  hp,
  maxHP,
  showLabel = true,
  compact = false,
  isOpponent = false,
}) => {
  const animWidth = useRef(new Animated.Value(hp.current / (maxHP || hp.max))).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const percentage = hp.current / (maxHP || hp.max);

  useEffect(() => {
    // Animate HP bar width
    Animated.spring(animWidth, {
      toValue: percentage,
      useNativeDriver: false,
      tension: 50,
      friction: 12,
    }).start();

    // Shake effect when HP changes
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [hp.current]);

  // Low HP pulse effect
  useEffect(() => {
    if (percentage <= 0.25) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [percentage]);

  const getHPColor = () => {
    if (percentage > 0.6) return COLORS.hpFull;
    if (percentage > 0.3) return COLORS.hpMedium;
    return COLORS.hpLow;
  };

  const barHeight = compact ? 8 : 14;

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        { transform: [{ translateX: shakeAnim }, { scale: pulseAnim }] },
      ]}
    >
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={styles.heartIcon}>❤️</Text>
          <Text style={[styles.hpText, percentage <= 0.25 && styles.hpTextDanger]}>
            {hp.current}
            <Text style={styles.hpMaxText}>/{maxHP || hp.max}</Text>
          </Text>
          {hp.shield > 0 && (
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldIcon}>🛡️</Text>
              <Text style={styles.shieldText}>{hp.shield}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.barBackground, { height: barHeight }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              height: barHeight,
              backgroundColor: getHPColor(),
              width: animWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />

        {/* Shield overlay */}
        {hp.shield > 0 && (
          <View
            style={[
              styles.shieldOverlay,
              {
                height: barHeight,
                width: `${(hp.shield / (maxHP || hp.max)) * 100}%`,
              },
            ]}
          />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerCompact: {
    paddingHorizontal: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  heartIcon: {
    fontSize: FONT_SIZES.sm,
  },
  hpText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  hpTextDanger: {
    color: COLORS.danger,
  },
  hpMaxText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.regular,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    gap: 2,
  },
  shieldIcon: {
    fontSize: 10,
  },
  shieldText: {
    color: COLORS.hpShield,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  barBackground: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: BORDER_RADIUS.full,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  shieldOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderRadius: BORDER_RADIUS.full,
  },
});
