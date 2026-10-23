// ============================================================
// CurrencyDisplay - Gold and Gems display
// ============================================================

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { formatCurrency } from '../../utils/formatCurrency';

interface CurrencyDisplayProps {
  gold: number;
  gems: number;
  compact?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  gold,
  gems,
  compact = false,
}) => {
  const goldPulse = useRef(new Animated.Value(1)).current;
  const gemPulse = useRef(new Animated.Value(1)).current;
  const prevGold = useRef(gold);
  const prevGems = useRef(gems);

  useEffect(() => {
    if (gold !== prevGold.current) {
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(goldPulse, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
      ]).start();
      prevGold.current = gold;
    }
  }, [gold]);

  useEffect(() => {
    if (gems !== prevGems.current) {
      Animated.sequence([
        Animated.timing(gemPulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.spring(gemPulse, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
      ]).start();
      prevGems.current = gems;
    }
  }, [gems]);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {/* Gold */}
      <Animated.View style={[styles.currencyItem, { transform: [{ scale: goldPulse }] }]}>
        <Text style={styles.goldIcon}>🪙</Text>
        <Text style={styles.goldText}>{formatCurrency(gold)}</Text>
      </Animated.View>

      <View style={styles.divider} />

      {/* Gems */}
      <Animated.View style={[styles.currencyItem, { transform: [{ scale: gemPulse }] }]}>
        <Text style={styles.gemIcon}>💎</Text>
        <Text style={styles.gemText}>{formatCurrency(gems)}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgGlass,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    gap: SPACING.sm,
  },
  containerCompact: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  goldIcon: {
    fontSize: 14,
  },
  gemIcon: {
    fontSize: 14,
  },
  goldText: {
    color: COLORS.gold,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  gemText: {
    color: COLORS.gems,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.surfaceBorder,
  },
});
