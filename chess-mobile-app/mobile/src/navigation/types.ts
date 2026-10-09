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
  Auth: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  GamePvP: undefined;
  GamePvE: { botId: string };
  Matchmaking: undefined;
};
