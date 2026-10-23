// ============================================================
// CardDetail - Full card detail modal view
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { RARITY_CONFIG } from '../../constants/cards';
import { Card } from '../../types/card';
import { GradientButton } from '../common/GradientButton';

interface CardDetailProps {
  card: Card | null;
  visible: boolean;
  onClose: () => void;
  onBuy?: (card: Card) => void;
  showBuyButton?: boolean;
}

export const CardDetail: React.FC<CardDetailProps> = ({
  card,
  visible,
  onClose,
  onBuy,
  showBuyButton = false,
}) => {
  if (!card) return null;

  const rarity = RARITY_CONFIG[card.rarity];

  const getEffectIcon = () => {
    const icons: Record<string, string> = {
      shield: '🛡️', heal: '💚', double_damage: '⚔️', freeze: '❄️',
      resurrect: '✨', swap: '🔄', reveal: '👁️', time_bonus: '⏰',
      poison: '☠️', mirror: '🪞', teleport: '🌀', fortify: '🏰',
    };
    return icons[card.effectType] || '🃏';
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity activeOpacity={1} style={styles.cardModal}>
          {/* Card */}
          <View style={[styles.cardContainer, { borderColor: rarity.color }]}>
            {/* Rarity glow */}
            <View style={[styles.rarityGlow, { backgroundColor: rarity.glowColor }]} />

            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={[styles.rarityBadge, { backgroundColor: rarity.color }]}>
                <Text style={styles.rarityText}>{rarity.label}</Text>
              </View>
              {card.duration && (
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>⏱ {card.duration} lượt</Text>
                </View>
              )}
            </View>

            {/* Card icon (large) */}
            <Text style={styles.cardIconLarge}>{getEffectIcon()}</Text>

            {/* Card name */}
            <Text style={[styles.cardName, { color: rarity.color }]}>{card.name}</Text>

            {/* Description */}
            <Text style={styles.cardDescription}>{card.description}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {card.value && (
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Giá trị</Text>
                  <Text style={styles.statValue}>{card.value}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Giới hạn/trận</Text>
                <Text style={styles.statValue}>{card.maxPerGame}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Hồi chiêu</Text>
                <Text style={styles.statValue}>{card.cooldownTurns} lượt</Text>
              </View>
            </View>

            {/* Price / Buy button */}
            {showBuyButton && !card.isOwned && (
              <View style={styles.buySection}>
                <View style={styles.priceTag}>
                  <Text style={styles.priceIcon}>
                    {card.currencyType === 'gold' ? '🪙' : '💎'}
                  </Text>
                  <Text style={[styles.priceText, { color: card.currencyType === 'gold' ? COLORS.gold : COLORS.gems }]}>
                    {card.price}
                  </Text>
                </View>
                <GradientButton
                  title="Mua Ngay"
                  onPress={() => onBuy?.(card)}
                  variant="accent"
                  size="medium"
                />
              </View>
            )}

            {card.isOwned && (
              <View style={styles.ownedBadge}>
                <Text style={styles.ownedText}>✅ Đã sở hữu ({card.quantity})</Text>
              </View>
            )}
          </View>

          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardModal: {
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 2,
    padding: SPACING.xl,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  rarityGlow: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.lg,
  },
  rarityBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  rarityText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  durationBadge: {
    backgroundColor: COLORS.bgGlass,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  durationText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  cardIconLarge: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  cardName: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
    marginBottom: SPACING.sm,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
  },
  buySection: {
    width: '100%',
    alignItems: 'center',
    gap: SPACING.md,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  priceIcon: {
    fontSize: 20,
  },
  priceText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
  ownedBadge: {
    backgroundColor: COLORS.successGlow,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
  },
  ownedText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  closeButton: {
    marginTop: SPACING.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.bgGlass,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
  },
});
