// ============================================================
// GradientButton - Premium animated button with gradient
// ============================================================

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { COLORS, GRADIENTS, SHADOWS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'accent' | 'danger' | 'success' | 'outline';
  size?: 'small' | 'medium' | 'large';
  icon?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyle = (): ViewStyle => {
    if (variant === 'outline') {
      return {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: COLORS.primary,
      };
    }

    const bgColors: Record<string, string> = {
      primary: COLORS.primary,
      accent: COLORS.accent,
      danger: COLORS.danger,
      success: COLORS.success,
    };

    return {
      backgroundColor: bgColors[variant] || COLORS.primary,
    };
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, minHeight: 36 };
      case 'large':
        return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl, minHeight: 56 };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, minHeight: 46 };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'small': return FONT_SIZES.sm;
      case 'large': return FONT_SIZES.xl;
      default: return FONT_SIZES.lg;
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'accent': return SHADOWS.glow;
      case 'danger': return SHADOWS.danger;
      default: return SHADOWS.medium;
    }
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
        style={[
          styles.button,
          getVariantStyle(),
          getSizeStyle(),
          getShadow(),
          disabled && styles.disabled,
          fullWidth && { width: '100%' },
          style,
        ]}
      >
        {icon && (
          <Text style={[styles.icon, { fontSize: getTextSize() + 2 }]}>{icon}</Text>
        )}
        <Text
          style={[
            styles.text,
            {
              fontSize: getTextSize(),
              color: variant === 'outline' ? COLORS.primary : COLORS.textPrimary,
            },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  text: {
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  icon: {
    color: COLORS.textPrimary,
  },
  disabled: {
    opacity: 0.5,
  },
});
