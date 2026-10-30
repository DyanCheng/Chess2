// ============================================================
// Player Store - Player profile, currency, level
// ============================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerProfile, PlayerStats, PlayerCurrency } from '../types/player';
import { LEVEL_XP_TABLE } from '../constants/game';

interface PlayerStore {
  profile: PlayerProfile | null;
  stats: PlayerStats | null;
  isLoading: boolean;

  // Actions
  setProfile: (profile: PlayerProfile) => void;
  setStats: (stats: PlayerStats) => void;
  addGold: (amount: number) => void;
  addGems: (amount: number) => void;
  setCurrency: (gold: number, gems: number) => void;
  spendGold: (amount: number) => boolean;
  spendGems: (amount: number) => boolean;
  addExperience: (amount: number) => void;
  updateRating: (change: number) => void;
  recordWin: () => void;
  recordLoss: () => void;
  recordDraw: () => void;
}

export const usePlayerStore = create<PlayerStore>()(persist((set, get) => ({
  profile: {
    id: 'player_1',
    username: 'Khách',
    avatarUrl: '',
    level: 1,
    experience: 0,
    experienceToNextLevel: 100,
    rating: 1000,
    gold: 0,
    gems: 0,
    maxHP: 40,
    currentHP: 40,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date().toISOString(),
    lastOnline: new Date().toISOString(),
  },
  stats: {
    totalGames: 0,
    winRate: 0,
    avgGameDuration: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    favoriteOpening: '',
    totalCardsUsed: 0,
    totalPiecesCaptured: 0,
  },
  isLoading: false,

  setProfile: (profile) => set({ profile }),
  setStats: (stats) => set({ stats }),

  addGold: (amount) => {
    set(state => ({
      profile: state.profile ? {
        ...state.profile,
        gold: state.profile.gold + amount,
      } : null,
    }));
  },

  addGems: (amount) => {
    set(state => ({
      profile: state.profile ? {
        ...state.profile,
        gems: state.profile.gems + amount,
      } : null,
    }));
  },

  setCurrency: (gold, gems) => {
    set(state => ({
      profile: state.profile ? {
        ...state.profile,
        gold: Math.max(0, gold),
        gems: Math.max(0, gems),
      } : null,
    }));
  },

  spendGold: (amount) => {
    const { profile } = get();
    if (!profile || profile.gold < amount) return false;
    set({ profile: { ...profile, gold: profile.gold - amount } });
    return true;
  },

  spendGems: (amount) => {
    const { profile } = get();
    if (!profile || profile.gems < amount) return false;
    set({ profile: { ...profile, gems: profile.gems - amount } });
    return true;
  },

  addExperience: (amount) => {
    set(state => {
      if (!state.profile) return {};
      let xp = state.profile.experience + amount;
      let level = state.profile.level;
      let xpNeeded = LEVEL_XP_TABLE[level] || level * 1000;

      while (xp >= xpNeeded && level < 25) {
        xp -= xpNeeded;
        level++;
        xpNeeded = LEVEL_XP_TABLE[level] || level * 1000;
      }

      return {
        profile: {
          ...state.profile,
          experience: xp,
          experienceToNextLevel: xpNeeded,
          level,
        },
      };
    });
  },

  updateRating: (change) => {
    set(state => ({
      profile: state.profile ? {
        ...state.profile,
        rating: Math.max(100, state.profile.rating + change),
      } : null,
    }));
  },

  recordWin: () => {
    set(state => ({
      profile: state.profile ? { ...state.profile, wins: state.profile.wins + 1 } : null,
      stats: state.stats ? {
        ...state.stats,
        totalGames: state.stats.totalGames + 1,
        winRate: ((state.stats.totalGames * state.stats.winRate / 100 + 1) / (state.stats.totalGames + 1)) * 100,
        currentWinStreak: state.stats.currentWinStreak + 1,
        longestWinStreak: Math.max(state.stats.longestWinStreak, state.stats.currentWinStreak + 1),
      } : null,
    }));
  },

  recordLoss: () => {
    set(state => ({
      profile: state.profile ? { ...state.profile, losses: state.profile.losses + 1 } : null,
      stats: state.stats ? {
        ...state.stats,
        totalGames: state.stats.totalGames + 1,
        winRate: ((state.stats.totalGames * state.stats.winRate / 100) / (state.stats.totalGames + 1)) * 100,
        currentWinStreak: 0,
      } : null,
    }));
  },

  recordDraw: () => {
    set(state => ({
      profile: state.profile ? { ...state.profile, draws: state.profile.draws + 1 } : null,
      stats: state.stats ? {
        ...state.stats,
        totalGames: state.stats.totalGames + 1,
      } : null,
    }));
  },
}), {
  name: 'arcane-guest-profile-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));
