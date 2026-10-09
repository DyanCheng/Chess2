// ============================================================
// PlayerInfoBar - In-game player info display
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { HPBar } from '../common/HPBar';
import { PlayerHP } from '../../types/player';
import { formatTime } from '../../utils/formatCurrency';

interface PlayerInfoBarProps {
  username: string;
  avatarUrl?: string;
  level: number;
  rating: number;
  hp: PlayerHP;
  time: number;
  isCurrentTurn: boolean;
  isOpponent?: boolean;
  capturedPieces?: string[];
}

export const PlayerInfoBar: React.FC<PlayerInfoBarProps> = ({
  username,
  avatarUrl,
  level,
  rating,
  hp,
  time,
  isCurrentTurn,
  isOpponent = false,
  capturedPieces = [],
}) => {
  const isLowTime = time < 30;

  return (
    <View style={[styles.container, isCurrentTurn && styles.containerActive]}>
      <View style={styles.row}>
        {/* Avatar */}
        <PlayerAvatar
          username={username}
          avatarUrl={avatarUrl}
          level={level}
          size="small"
          showLevel={true}
        />

        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.username} numberOfLines={1}>{username}</Text>
            <Text style={styles.rating}>({rating})</Text>
          </View>
          <HPBar hp={hp} compact showLabel={false} isOpponent={isOpponent} />
        </View>

        {/* HP value */}
        <View style={styles.hpValue}>
          <Text style={styles.heartEmoji}>❤️</Text>
          <Text style={[styles.hpNumber, hp.current <= 10 && styles.hpNumberDanger]}>
            {hp.current}
          </Text>
        </View>

        {/* Timer */}
        <View style={[styles.timer, isCurrentTurn && styles.timerActive, isLowTime && styles.timerDanger]}>
          <Text style={[styles.timerText, isLowTime && styles.timerTextDanger]}>
            {formatTime(time)}
          </Text>
        </View>
      </View>

      {/* Captured pieces */}
      {capturedPieces.length > 0 && (
        <View style={styles.capturedRow}>
          {capturedPieces.map((piece, index) => (
            <Text key={index} style={styles.capturedPiece}>{piece}</Text>
          ))}
        </View>
      )}

      {/* Turn indicator */}
      {isCurrentTurn && <View style={styles.turnIndicator} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.bgGlass,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    position: 'relative',
    overflow: 'hidden',
  },
  containerActive: {
    borderColor: COLORS.primaryLight,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoSection: {
    flex: 1,
    gap: SPACING.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  username: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    maxWidth: 100,
  },
  rating: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  hpValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  heartEmoji: {
    fontSize: 12,
  },
  hpNumber: {
    color: COLORS.hpFull,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
  hpNumberDanger: {
    color: COLORS.danger,
  },
  timer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 70,
    alignItems: 'center',
  },
  timerActive: {
    backgroundColor: COLORS.primaryDark,
  },
  timerDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  timerText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    fontVariant: ['tabular-nums'],
  },
  timerTextDanger: {
    color: COLORS.danger,
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.xs,
    paddingLeft: 52,
    gap: 1,
  },
  capturedPiece: {
    fontSize: 14,
    opacity: 0.7,
  },
  turnIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
});
