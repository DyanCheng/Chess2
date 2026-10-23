// ============================================================
// ShopItemCard - Shop item display card
// ============================================================

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { ShopItem } from '../../store/shopStore';
import { RARITY_CONFIG } from '../../constants/cards';

interface ShopItemCardProps {
  item: ShopItem;
  onPress: () => void;
  onBuy: () => void;
}

export const ShopItemCard: React.FC<ShopItemCardProps> = ({ item, onPress, onBuy }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getCategoryIcon = () => {
    switch (item.category) {
      case 'skin': return '👑';
      case 'card': return '🃏';
      case 'bundle': return '📦';
      case 'currency': return '💰';
      default: return '🎁';
    }
  };

  const getPriceIcon = () => {
    switch (item.currencyType) {
      case 'gold': return '🪙';
      case 'gems': return '💎';
      case 'real': return '💵';
    }
  };

  const rarityColor = item.rarity ? RARITY_CONFIG[item.rarity]?.color : COLORS.textMuted;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[
          styles.card,
          {
            borderColor: item.rarity ? RARITY_CONFIG[item.rarity]?.borderColor : COLORS.surfaceBorder,
          },
        ]}
      >
        {/* New badge */}
        {item.isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newText}>MỚI</Text>
          </View>
        )}

        {/* Discount badge */}
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        )}

        {/* Item icon */}
        <Text style={styles.itemIcon}>{getCategoryIcon()}</Text>

        {/* Item name */}
        <Text style={[styles.itemName, { color: rarityColor }]} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Description */}
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Price */}
        {!item.isOwned ? (
          <TouchableOpacity onPress={onBuy} style={styles.buyButton}>
            <Text style={styles.priceIcon}>{getPriceIcon()}</Text>
            <Text style={styles.priceText}>
              {item.currencyType === 'real' ? `$${(item.price / 100).toFixed(2)}` : item.price}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.ownedLabel}>
            <Text style={styles.ownedText}>✅ Đã mua</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.small,
    position: 'relative',
    overflow: 'hidden',
  },
  newBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  newText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: FONT_WEIGHTS.bold,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.danger,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  discountText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs - 1,
    fontWeight: FONT_WEIGHTS.bold,
  },
  itemIcon: {
    fontSize: 40,
    marginTop: SPACING.sm,
  },
  itemName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  itemDescription: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.xs,
  },
  priceIcon: {
    fontSize: 14,
  },
  priceText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  ownedLabel: {
    marginTop: SPACING.xs,
  },
  ownedText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
});
