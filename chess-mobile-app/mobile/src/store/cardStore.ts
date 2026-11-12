// ============================================================
// Card Store - Card collection and deck management
// ============================================================

import { create } from 'zustand';
import { Card, CardDeck, CardInHand } from '../types/card';
import { ALL_CARDS } from '../constants/cards';

interface CardStore {
  ownedCards: Card[];
  activeDeck: CardDeck | null;
  allCards: Card[];

  // Actions
  setOwnedCards: (cards: Card[]) => void;
  buyCard: (cardId: string) => boolean;
  syncServerCard: (card: {
    id: string;
    name: string;
    description: string;
    effectType: string;
    value: number;
    quantity: number;
  }) => void;
  setActiveDeck: (deck: CardDeck) => void;
  getHandCards: () => CardInHand[];
}

export const useCardStore = create<CardStore>()((set, get) => ({
  ownedCards: ALL_CARDS.filter((_, i) => i < 4).map(c => ({ ...c, isOwned: true, quantity: 2 })),
  activeDeck: null,
  allCards: ALL_CARDS,

  setOwnedCards: (cards) => set({ ownedCards: cards }),

  buyCard: (cardId) => {
    const card = ALL_CARDS.find(c => c.id === cardId);
    if (!card) return false;

    set(state => {
      const existing = state.ownedCards.find(c => c.id === cardId);
      if (existing) {
        return {
          ownedCards: state.ownedCards.map(c =>
            c.id === cardId ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return {
        ownedCards: [...state.ownedCards, { ...card, isOwned: true, quantity: 1 }],
      };
    });
    return true;
  },

  syncServerCard: (serverCard) => {
    const effectTypes = {
      DOUBLE_DAMAGE: 'double_damage',
      HEAL: 'heal',
      SHIELD: 'shield',
      EXTRA_MOVE: 'extra_move',
      FREEZE_PIECE: 'freeze',
    } as const;
    const effectType = effectTypes[serverCard.effectType as keyof typeof effectTypes];
    if (!effectType) throw new Error(`Unsupported server card effect: ${serverCard.effectType}`);

    set(state => {
      const catalogIndexExact = state.allCards.findIndex(card =>
        card.id === serverCard.id || card.serverId === serverCard.id,
      );
      const catalogIndex = catalogIndexExact >= 0
        ? catalogIndexExact
        : state.allCards.findIndex(card =>
            card.name === serverCard.name && card.effectType === effectType,
          );
      const existingIndex = state.ownedCards.findIndex(card =>
        card.id === serverCard.id || card.serverId === serverCard.id,
      );
      const matchingIndex = existingIndex >= 0
        ? existingIndex
        : state.ownedCards.findIndex(card =>
            card.name === serverCard.name && card.effectType === effectType,
          );
      const template = matchingIndex >= 0
        ? state.ownedCards[matchingIndex]
        : catalogIndex >= 0
          ? state.allCards[catalogIndex]
          : ALL_CARDS.find(card => card.effectType === effectType);

      const syncedCard: Card = {
        ...(template ?? {
          rarity: 'common',
          manaCost: 0,
          iconUrl: 'card',
          effectAnimation: '',
          price: 0,
          currencyType: 'gold',
          maxPerGame: 1,
          cooldownTurns: 0,
        }),
        id: serverCard.id,
        serverId: serverCard.id,
        name: serverCard.name,
        description: serverCard.description,
        effectType,
        value: serverCard.value,
        isOwned: serverCard.quantity > 0,
        quantity: serverCard.quantity,
      };

      const ownedCards = matchingIndex >= 0
        ? state.ownedCards.map((card, index) => index === matchingIndex ? syncedCard : card)
        : serverCard.quantity > 0 ? [...state.ownedCards, syncedCard] : state.ownedCards;
      const allCards = catalogIndex >= 0
        ? state.allCards.map((card, index) => index === catalogIndex ? syncedCard : card)
        : [...state.allCards, syncedCard];
      return { ownedCards, allCards };
    });
  },

  setActiveDeck: (deck) => set({ activeDeck: deck }),

  getHandCards: () => {
    const { ownedCards } = get();
    return ownedCards
      .filter(c => c.quantity > 0)
      .slice(0, 3)
      .map(card => ({
        card,
        isUsable: true,
        cooldownRemaining: 0,
        usesRemaining: card.maxPerGame,
      }));
  },
}));
