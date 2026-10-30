// ============================================================
// AppNavigator - Main navigation configuration
// ============================================================

import React from 'react';
import { NavigationContainer, NavigationProp, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Import Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { GameScreen } from '../screens/game/GameScreen';
import { OnlineGameScreen } from '../screens/game/OnlineGameScreen';
import { MatchmakingScreen } from '../screens/game/MatchmakingScreen';
import { ShopScreen } from '../screens/shop/ShopScreen';
import { CardsScreen } from '../screens/cards/CardsScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import ModesScreen from '../screens/modes/ModesScreen';
import PuzzleScreen from '../screens/puzzle/PuzzleScreen';
import RankingScreen from '../screens/ranking/RankingScreen';
import { Text } from 'react-native';
import { BOT_LEVELS } from '../constants/game';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

import { RootStackParamList, MainTabParamList } from './types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigateArcane = (
  navigation: NavigationProp<RootStackParamList>,
  target: string,
) => {
  switch (target) {
    case 'modes':
      navigation.navigate('ArcaneModes');
      break;
    case 'puzzle':
      navigation.navigate('ArcanePuzzle');
      break;
    case 'ranking':
      navigation.navigate('ArcaneRanking');
      break;
    case 'shop':
      navigation.navigate('MainTabs', { screen: 'Shop' });
      break;
    case 'login':
      navigation.navigate('Login');
      break;
    case 'matchmaking':
      navigation.navigate('Matchmaking');
      break;
    case 'bot':
      navigation.navigate('GamePvE', { botId: BOT_LEVELS[0].id });
      break;
    default:
      if (target.startsWith('bot:')) {
        const index = Number(target.slice(4)) - 1;
        navigation.navigate('GamePvE', { botId: BOT_LEVELS[index]?.id ?? BOT_LEVELS[0].id });
        break;
      }
      navigation.navigate('MainTabs', { screen: 'Home' });
      break;
  }
};

const ArcaneModesRoute = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return <ModesScreen onNavigate={(target) => navigateArcane(navigation, target)} />;
};

const ArcanePuzzleRoute = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return <PuzzleScreen onNavigate={(target) => navigateArcane(navigation, target)} />;
};

const ArcaneRankingRoute = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return <RankingScreen onNavigate={(target) => navigateArcane(navigation, target)} />;
};

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
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Cài Đặt' }} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgDark },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="GamePvP" component={OnlineGameScreen} />
        <Stack.Screen name="GamePvE" component={GameScreen} />
        <Stack.Screen 
          name="Matchmaking" 
          component={MatchmakingScreen}
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="ArcaneModes" component={ArcaneModesRoute} />
        <Stack.Screen name="ArcanePuzzle" component={ArcanePuzzleRoute} />
        <Stack.Screen name="ArcaneRanking" component={ArcaneRankingRoute} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
