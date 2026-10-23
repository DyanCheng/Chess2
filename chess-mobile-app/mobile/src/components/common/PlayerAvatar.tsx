// ============================================================
// PlayerAvatar - Avatar with level badge and online indicator
// ============================================================

import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';

interface PlayerAvatarProps {
  avatarUrl?: string;
  username: string;
  level: number;
  size?: 'small' | 'medium' | 'large';
  isOnline?: boolean;
  showLevel?: boolean;
  style?: ViewStyle;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarUrl,
  username,
  level,
  size = 'medium',
  isOnline = false,
  showLevel = true,
  style,
}) => {
  const getDimension = () => {
    switch (size) {
      case 'small': return 40;
      case 'large': return 80;
      default: return 56;
    }
  };

  const dimension = getDimension();

  const getInitials = () => {
    return username.slice(0, 2).toUpperCase();
  };

  const getLevelColor = () => {
    if (level >= 20) return COLORS.rarityLegendary;
    if (level >= 15) return COLORS.rarityEpic;
    if (level >= 10) return COLORS.rarityRare;
    return COLORS.rarityCommon;
  };

  return (
    <View style={[styles.container, style]}>
      {/* Avatar frame with glow */}
      <View
        style={[
          styles.avatarFrame,
          {
            width: dimension + 6,
            height: dimension + 6,
            borderColor: getLevelColor(),
            borderRadius: (dimension + 6) / 2,
          },
          SHADOWS.small,
        ]}
      >
        <View
          style={[
            styles.avatarInner,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
            },
          ]}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={[styles.avatarImage, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
            />
          ) : (
            <Text style={[styles.initials, { fontSize: dimension * 0.35 }]}>
              {getInitials()}
            </Text>
          )}
        </View>
      </View>

      {/* Online indicator */}
      {isOnline && (
        <View style={[styles.onlineIndicator, { right: size === 'small' ? -1 : 2 }]} />
      )}

      {/* Level badge */}
      {showLevel && (
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
  },
  avatarFrame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    backgroundColor: COLORS.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    resizeMode: 'cover',
  },
  initials: {
    color: COLORS.textPrimary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  onlineIndicator: {
    position: 'absolute',
    top: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bgDark,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.bgDark,
    minWidth: 24,
    alignItems: 'center',
  },
  levelText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
});
