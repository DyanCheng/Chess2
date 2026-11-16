import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DailyMissionState {
  claimDate: string | null;
  claimedIds: string[];
  claimReward: (missionId: string, date: string) => boolean;
}

export const useDailyMissionStore = create<DailyMissionState>()(persist((set) => ({
  claimDate: null,
  claimedIds: [],
  claimReward: (missionId, date) => {
    let claimed = false;
    set(state => {
      const claimedIds = state.claimDate === date ? state.claimedIds : [];
      if (claimedIds.includes(missionId)) return state;
      claimed = true;
      return { claimDate: date, claimedIds: [...claimedIds, missionId] };
    });
    return claimed;
  },
}), {
  name: 'arcane-daily-missions-v1',
  storage: createJSONStorage(() => AsyncStorage),
}));
