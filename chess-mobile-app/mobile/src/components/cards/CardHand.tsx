// ============================================================
// CardHand - Card hand display during game
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme';
import { RARITY_CONFIG } from '../../constants/cards';
import { CardInHand } from '../../types/card';
import { SKILL_CARD_BY_ID } from '../../constants/skillCards';

interface CardHandProps {
  cards: CardInHand[];
  selectedCard: CardInHand | null;
  onSelectCard: (card: CardInHand | null) => void;
  onUseCard: (card: CardInHand) => void;
  isPlayerTurn: boolean;
  targetingCardId?: string | null;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  selectedCard,
  onSelectCard,
  onUseCard,
  isPlayerTurn,
  targetingCardId,
}) => {
  const selectedSkill = selectedCard ? SKILL_CARD_BY_ID[selectedCard.card.id] : null;
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.headingText}>BỘ BÀI KỸ NĂNG</Text>
        <Text style={styles.countText}>{cards.length} lá</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {cards.map((cardInHand, index) => (
          <GameCard
            key={cardInHand.instanceId ?? cardInHand.card.id}
            cardInHand={cardInHand}
            isSelected={selectedCard?.card.id === cardInHand.card.id}
            onSelect={() => {
              if (selectedCard?.card.id === cardInHand.card.id) {
                onSelectCard(null);
              } else {
                onSelectCard(cardInHand);
              }
            }}
            onUse={() => onUseCard(cardInHand)}
            isUsable={cardInHand.isUsable && isPlayerTurn && cardInHand.usesRemaining > 0 && cardInHand.cooldownRemaining === 0}
            targeting={targetingCardId === cardInHand.card.id}
            index={index}
          />
        ))}
      </ScrollView>
      {selectedCard && (
        <View style={styles.details}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsName} numberOfLines={1}>
              {selectedSkill?.illustration ?? '✦'}  {selectedCard.card.name}
            </Text>
            <Text style={[styles.rarityText, { color: RARITY_CONFIG[selectedCard.card.rarity].color }]}>
              {RARITY_CONFIG[selectedCard.card.rarity].label}
            </Text>
          </View>
          <Text style={styles.description}>{selectedCard.card.description}</Text>
          <Text style={styles.detailMeta}>
            {selectedSkill?.effectLabel ?? selectedCard.card.effectType} · {selectedSkill?.durationLabel ?? 'Tức thì'}
          </Text>
          <Text style={styles.statusText}>
            {targetingCardId === selectedCard.card.id
              ? 'Chọn quân hoặc ô trên bàn cờ'
              : !selectedCard.isUsable
                ? 'Chưa đủ điều kiện để sử dụng'
              : !isPlayerTurn
                ? 'Chưa tới lượt của bạn'
                : selectedCard.usesRemaining > 0
                  ? 'Nhấn lần nữa để kích hoạt'
                  : 'Đã sử dụng'}
          </Text>
        </View>
      )}
    </View>
  );
};

interface GameCardProps {
  cardInHand: CardInHand;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  isUsable: boolean;
  targeting: boolean;
  index: number;
}

const GameCard: React.FC<GameCardProps> = ({
  cardInHand,
  isSelected,
  onSelect,
  onUse,
  isUsable,
  targeting,
  index,
}) => {
  const { card } = cardInHand;
  const rarityConfig = RARITY_CONFIG[card.rarity];
  const skill = SKILL_CARD_BY_ID[card.id];

  return (
    <View
      style={[
        styles.cardWrapper,
        { zIndex: isSelected ? 10 : index },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${card.name}. ${card.description}. ${isUsable ? 'Có thể sử dụng' : 'Đang bị vô hiệu hóa'}`}
        onPress={isSelected ? onUse : onSelect}
        disabled={!isUsable && !isSelected}
        style={[
          styles.card,
          {
            borderColor: isSelected ? rarityConfig.color : rarityConfig.borderColor,
            opacity: isUsable || isSelected ? 1 : 0.45,
          },
          targeting && styles.targetingCard,
        ]}
      >
        <Text style={styles.cardIcon}>{skill?.illustration ?? '✦'}</Text>
        <Text style={[styles.cardRarity, { color: rarityConfig.color }]} numberOfLines={1}>
          {rarityConfig.label}
        </Text>
        <Text style={[styles.cardName, { color: rarityConfig.color }]} numberOfLines={2}>
          {card.name}
        </Text>
        <View style={styles.usesContainer}>
          <Text style={styles.usesText}>{cardInHand.usesRemaining > 0 ? `x${cardInHand.usesRemaining}` : '✓'}</Text>
        </View>
        {cardInHand.cooldownRemaining > 0 && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>{cardInHand.cooldownRemaining}</Text>
          </View>
        )}
        {isSelected && isUsable && (
          <View style={[styles.useButton, { backgroundColor: rarityConfig.color }]}>
            <Text style={styles.useButtonText}>{targeting ? 'Chọn mục tiêu' : 'Kích hoạt'}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  headingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 1,
  },
  countText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
  },
  scrollContent: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  cardWrapper: {
    marginHorizontal: SPACING.xs,
  },
  card: {
    width: 88,
    height: 116,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  cardIcon: {
    fontSize: 24,
  },
  cardRarity: {
    fontSize: 8,
    fontWeight: FONT_WEIGHTS.bold,
    textTransform: 'uppercase',
  },
  cardName: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  usesContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.bgGlass,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  usesText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
  },
  cooldownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: BORDER_RADIUS.md - 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cooldownText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
  useButton: {
    position: 'absolute',
    bottom: -8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
  },
  useButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  details: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.bgCard,
    gap: 3,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  detailsName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    flex: 1,
  },
  rarityText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  detailMeta: {
    color: COLORS.accentLight,
    fontSize: 9,
    fontWeight: FONT_WEIGHTS.bold,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 9,
  },
  targetingCard: {
    borderWidth: 2.5,
  },
});
