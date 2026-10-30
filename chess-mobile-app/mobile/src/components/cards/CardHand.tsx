// ============================================================
// CardHand - Card hand display during game
// ============================================================

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, SHADOWS } from '../../constants/theme';
import { RARITY_CONFIG } from '../../constants/cards';
import { CardInHand } from '../../types/card';

interface CardHandProps {
  cards: CardInHand[];
  selectedCard: CardInHand | null;
  onSelectCard: (card: CardInHand | null) => void;
  onUseCard: (card: CardInHand) => void;
  isPlayerTurn: boolean;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  selectedCard,
  onSelectCard,
  onUseCard,
  isPlayerTurn,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {cards.map((cardInHand, index) => (
          <GameCard
            key={cardInHand.card.id}
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
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
};

interface GameCardProps {
  cardInHand: CardInHand;
  isSelected: boolean;
  onSelect: () => void;
  onUse: () => void;
  isUsable: boolean;
  index: number;
}

const GameCard: React.FC<GameCardProps> = ({
  cardInHand,
  isSelected,
  onSelect,
  onUse,
  isUsable,
  index,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const { card } = cardInHand;
  const rarityConfig = RARITY_CONFIG[card.rarity];

  // Card effect icons
  const getEffectIcon = () => {
    const icons: Record<string, string> = {
      shield: '🛡️',
      heal: '💚',
      double_damage: '⚔️',
      freeze: '❄️',
      resurrect: '✨',
      swap: '🔄',
      reveal: '👁️',
      time_bonus: '⏰',
      poison: '☠️',
      mirror: '🪞',
      teleport: '🌀',
      fortify: '🏰',
    };
    return icons[card.effectType] || '🃏';
  };

  React.useEffect(() => {
    if (isSelected) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.1, useNativeDriver: true, tension: 200, friction: 10 }),
        Animated.spring(translateY, { toValue: -20, useNativeDriver: true, tension: 200, friction: 10 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 200, friction: 10 }),
      ]).start();
    }
  }, [isSelected]);

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: scaleAnim }, { translateY }],
          zIndex: isSelected ? 10 : index,
        },
      ]}
    >
      <TouchableOpacity
        onPress={isSelected ? onUse : onSelect}
        disabled={!isUsable && !isSelected}
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            borderColor: isSelected ? rarityConfig.color : rarityConfig.borderColor,
            opacity: isUsable ? 1 : 0.5,
          },
          isSelected && {
            shadowColor: rarityConfig.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 12,
            elevation: 12,
          },
        ]}
      >
        {/* Card icon */}
        <Text style={styles.cardIcon}>{getEffectIcon()}</Text>

        {/* Card name */}
        <Text style={[styles.cardName, { color: rarityConfig.color }]} numberOfLines={1}>
          {card.name}
        </Text>

        {/* Uses remaining */}
        <View style={styles.usesContainer}>
          <Text style={styles.usesText}>x{cardInHand.usesRemaining}</Text>
        </View>

        {/* Cooldown overlay */}
        {cardInHand.cooldownRemaining > 0 && (
          <View style={styles.cooldownOverlay}>
            <Text style={styles.cooldownText}>{cardInHand.cooldownRemaining}</Text>
          </View>
        )}

        {/* Use button when selected */}
        {isSelected && isUsable && (
          <View style={[styles.useButton, { backgroundColor: rarityConfig.color }]}>
            <Text style={styles.useButtonText}>Dùng</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.sm,
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
    width: 80,
    height: 110,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  cardIcon: {
    fontSize: 28,
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
});
