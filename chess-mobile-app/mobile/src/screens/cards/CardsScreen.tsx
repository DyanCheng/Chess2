// ============================================================
// CardsScreen - Deck management and collection
// ============================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../constants/theme';
import { useCardStore } from '../../store/cardStore';
import { CardDetail } from '../../components/cards/CardDetail';
import { RARITY_CONFIG } from '../../constants/cards';

export const CardsScreen: React.FC = () => {
  const { ownedCards, allCards } = useCardStore();
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // Group by rarity for collection view
  const groupedCards = allCards.reduce((acc, card) => {
    if (!acc[card.rarity]) acc[card.rarity] = [];
    acc[card.rarity].push(card);
    return acc;
  }, {} as Record<string, any[]>);

  const getEffectIcon = (effectType: string) => {
    const icons: Record<string, string> = {
      shield: '🛡️', heal: '💚', double_damage: '⚔️', freeze: '❄️',
      resurrect: '✨', swap: '🔄', reveal: '👁️', time_bonus: '⏰',
      poison: '☠️', mirror: '🪞', teleport: '🌀', fortify: '🏰',
    };
    return icons[effectType] || '🃏';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bộ Sưu Tập Thẻ Bài</Text>
        <Text style={styles.headerSubtitle}>
          Sở hữu: {ownedCards.length}/{allCards.length}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selected Deck Section (Preview) */}
        <View style={styles.deckSection}>
          <Text style={styles.sectionTitle}>Bộ Bài Trang Bị (Tối đa 3 loại)</Text>
          <View style={styles.deckSlots}>
            {[0, 1, 2].map((slot) => {
              const card = ownedCards[slot];
              return (
                <View key={slot} style={styles.deckSlot}>
                  {card ? (
                    <TouchableOpacity onPress={() => setSelectedCard(card)} style={[styles.equippedCard, { borderColor: RARITY_CONFIG[card.rarity].color }]}>
                      <Text style={styles.cardIconSmall}>{getEffectIcon(card.effectType)}</Text>
                      <View style={styles.qtyBadge}><Text style={styles.qtyText}>{card.quantity}</Text></View>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.emptySlotText}>+</Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Collection Grid */}
        <View style={styles.collectionSection}>
          {['legendary', 'epic', 'rare', 'common'].map((rarityKey) => {
            const cards = groupedCards[rarityKey];
            if (!cards || cards.length === 0) return null;
            
            const config = RARITY_CONFIG[rarityKey as keyof typeof RARITY_CONFIG];
            
            return (
              <View key={rarityKey} style={styles.rarityGroup}>
                <Text style={[styles.rarityTitle, { color: config.color }]}>
                  {config.label}
                </Text>
                <View style={styles.cardGrid}>
                  {cards.map(card => {
                    const owned = ownedCards.find(c => c.id === card.id);
                    const isOwned = !!owned;
                    
                    return (
                      <TouchableOpacity
                        key={card.id}
                        style={[
                          styles.collectionCard,
                          !isOwned && styles.collectionCardLocked,
                          { borderColor: isOwned ? config.color : COLORS.surfaceBorder }
                        ]}
                        onPress={() => setSelectedCard({ ...card, isOwned, quantity: owned?.quantity || 0 })}
                      >
                        <Text style={[styles.collectionCardIcon, !isOwned && { opacity: 0.3 }]}>
                          {getEffectIcon(card.effectType)}
                        </Text>
                        <Text style={styles.collectionCardName} numberOfLines={1}>
                          {card.name}
                        </Text>
                        {isOwned && (
                          <View style={styles.ownedBadgeSmall}>
                            <Text style={styles.ownedBadgeText}>x{owned.quantity}</Text>
                          </View>
                        )}
                        {!isOwned && <View style={styles.lockOverlay}><Text style={styles.lockIcon}>🔒</Text></View>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <CardDetail
        card={selectedCard}
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        showBuyButton={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.extrabold,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  deckSection: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
  },
  deckSlots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
  },
  deckSlot: {
    width: 70,
    height: 90,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.bgCard,
    borderWidth: 2,
    borderColor: COLORS.surfaceBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlotText: {
    color: COLORS.surfaceBorder,
    fontSize: 24,
  },
  equippedCard: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md - 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardLight,
  },
  cardIconSmall: {
    fontSize: 32,
  },
  qtyBadge: {
    position: 'absolute',
    bottom: -6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  qtyText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  collectionSection: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },
  rarityGroup: {
    marginBottom: SPACING.xl,
  },
  rarityTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  collectionCard: {
    width: '30%',
    aspectRatio: 0.75,
    backgroundColor: COLORS.bgCard,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    padding: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  collectionCardLocked: {
    backgroundColor: COLORS.bgDark,
    opacity: 0.6,
  },
  collectionCardIcon: {
    fontSize: 36,
    marginBottom: SPACING.sm,
  },
  collectionCardName: {
    color: COLORS.textPrimary,
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  ownedBadgeSmall: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.surfaceBorder,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  ownedBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 9,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 24,
  }
});
