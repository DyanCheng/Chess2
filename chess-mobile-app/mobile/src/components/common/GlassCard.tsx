// ============================================================
// GlassCard - Glassmorphism card container
// ============================================================

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, SHADOWS } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'accent' | 'danger';
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = SPACING.lg,
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: COLORS.bgCardLight,
          borderColor: COLORS.surfaceBorder,
          ...SHADOWS.medium,
        };
      case 'accent':
        return {
          backgroundColor: COLORS.bgCard,
          borderColor: COLORS.accentGlow,
          ...SHADOWS.glow,
        };
      case 'danger':
        return {
          backgroundColor: COLORS.bgCard,
          borderColor: COLORS.dangerGlow,
          ...SHADOWS.danger,
        };
      default:
        return {
          backgroundColor: COLORS.bgGlass,
          borderColor: COLORS.surfaceBorder,
          ...SHADOWS.small,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), { padding }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
