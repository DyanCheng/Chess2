// ============================================================
// AppNavigator - Main navigation configuration
// ============================================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { GameScreen } from '../screens/game/GameScreen';
import { MatchmakingScreen } from '../screens/game/MatchmakingScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { CardsScreen } from '../screens/cards/CardsScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { AuthNavigator } from './AuthNavigator';
import { View, Text } from 'react-native';

import { RootStackParamList, MainTabParamList } from './types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.bgCard,
          borderTopColor: COLORS.surfaceBorder,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarIcon: ({ color, size }) => {
          let icon = '';
          switch (route.name) {
            case 'Home': icon = '🏠'; break;
            case 'Shop': icon = '🛍️'; break;
            case 'Cards': icon = '🃏'; break;
            case 'History': icon = '📜'; break;
            case 'Profile': icon = '👤'; break;
            case 'Settings': icon = '⚙️'; break;
          }
          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang Chủ' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Cửa Hàng' }} />
      <Tab.Screen name="Cards" component={CardsScreen} options={{ title: 'Thẻ Bài' }} />
      <Tab.Screen name="History" component={HistoryScreen} options={{ title: 'Lịch Sử' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Hồ Sơ' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgDark },
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="GamePvP" component={GameScreen} />
        <Stack.Screen name="GamePvE" component={GameScreen} />
        <Stack.Screen 
          name="Matchmaking" 
          component={MatchmakingScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
