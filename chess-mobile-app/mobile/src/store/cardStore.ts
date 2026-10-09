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
