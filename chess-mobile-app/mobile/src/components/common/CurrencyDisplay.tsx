// ============================================================
// CurrencyDisplay - Gold and Gems display
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { COLORS as DARK_COLORS, LIGHT_COLORS } from '../../constants/arcane-colors';
import { formatCurrency } from '../../utils/formatCurrency';

interface CurrencyDisplayProps {
  gold: number;
  gems: number;
  compact?: boolean;
  isDark?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  gold,
  gems,
  compact = false,
  isDark = true,
}) => {
  const goldPulse = useRef(new Animated.Value(1)).current;
  const gemPulse = useRef(new Animated.Value(1)).current;
  const prevGold = useRef(gold);
  const prevGems = useRef(gems);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

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

const makeStyles = (COLORS: typeof DARK_COLORS, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: isDark ? '#FCD34D' : '#A16207',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  gemText: {
    color: isDark ? '#C084FC' : '#7E22CE',
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: COLORS.border,
  },
});
