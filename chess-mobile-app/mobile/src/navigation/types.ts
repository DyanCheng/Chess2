// ============================================================
// Navigation Types
// ============================================================

import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Shop: undefined;
  Cards: undefined;
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  Login: undefined;
  Register: undefined;
  GamePvP: { gameId: string; color: 'w' | 'b'; opponentId: string; playerId: string };
  GamePvE: { botId: string };
  Matchmaking: undefined;
  ArcaneModes: undefined;
  ArcanePuzzle: undefined;
  ArcaneRanking: undefined;
};
