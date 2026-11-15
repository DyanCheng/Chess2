// ============================================================
// AppNavigator - Main navigation configuration
// ============================================================

import React from 'react';
import { NavigationContainer, NavigationProp, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

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
import { BOT_LEVELS } from '../constants/game';
import { COLORS as ARCANE_COLORS, LIGHT_COLORS } from '../constants/arcane-colors';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { useAuthStore } from '../store/authStore';
import { useArcaneThemeStore } from '../store/arcaneThemeStore';

import { RootStackParamList, MainTabParamList } from './types';
import { COLORS } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const navigateArcane = (
  navigation: NavigationProp<RootStackParamList>,
  target: string,
  params?: {
    queueType: 'RANKED' | 'CASUAL';
    timeControlId: string;
    gameModeCode?: string;
  },
) => {
  switch (target) {
    case 'modes':
      navigation.navigate('MainTabs', { screen: 'Modes' });
      break;
    case 'puzzle':
      navigation.navigate('MainTabs', { screen: 'Puzzle' });
      break;
    case 'ranking':
      navigation.navigate('MainTabs', { screen: 'Ranking' });
      break;
    case 'shop':
      navigation.navigate('MainTabs', { screen: 'Shop' });
      break;
    case 'login':
      useAuthStore.getState().exitGuestMode();
      break;
    case 'matchmaking':
      if (!useAuthStore.getState().isAuthenticated) {
        const { isGuest, exitGuestMode } = useAuthStore.getState();
        Alert.alert(
          'Cần tài khoản để chơi PvP',
          'Bạn có thể tiếp tục chơi với bot ở chế độ khách hoặc đăng nhập để tìm đối thủ.',
          isGuest
            ? [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Đăng nhập', onPress: exitGuestMode },
              ]
            : [{ text: 'Đóng', style: 'cancel' }],
        );
        break;
      }
      navigation.navigate('Matchmaking', params ?? {
        queueType: 'CASUAL',
        timeControlId: 'blitz',
        gameModeCode: 'STANDARD',
      });
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
  return <ModesScreen onNavigate={(target, params) => navigateArcane(navigation, target, params)} />;
};

const MainTabs = () => {
  const isDark = useArcaneThemeStore(state => state.isDark);
  const tabColors = isDark ? ARCANE_COLORS : LIGHT_COLORS;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabColors.tabBarBg,
          borderTopColor: tabColors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: tabColors.tabBarActive,
        tabBarInactiveTintColor: tabColors.tabBarInactive,
        tabBarIcon: ({ color }) => {
          let icon = '';
          switch (route.name) {
            case 'Home': icon = '🏠'; break;
            case 'Modes': icon = '⚔️'; break;
            case 'Puzzle': icon = '🧩'; break;
            case 'Ranking': icon = '🏅'; break;
            case 'Shop': icon = '🛍️'; break;
            case 'Cards': icon = '🃏'; break;
            case 'History': icon = '📜'; break;
            case 'Profile': icon = '👤'; break;
            case 'Settings': icon = '⚙️'; break;
          }
          return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ' }} />
      <Tab.Screen name="Modes" component={ArcaneModesRoute} options={{ title: 'Chế độ' }} />
      <Tab.Screen name="Puzzle" component={PuzzleScreen} options={{ title: 'Giải đố' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Xếp hạng' }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: 'Cửa hàng' }} />
      <Tab.Screen
        name="Cards"
        component={CardsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarButton: () => null, tabBarItemStyle: { display: 'none' } }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isGuest = useAuthStore(state => state.isGuest);
  const isHydrated = useAuthStore(state => state.isHydrated);
  const canPlay = isAuthenticated || isGuest;

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgDark }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={canPlay ? 'game' : 'auth'}
        initialRouteName={canPlay ? 'MainTabs' : 'Login'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgDark },
        }}
      >
        {canPlay ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            {isAuthenticated && (
              <>
                <Stack.Screen name="GamePvP" component={OnlineGameScreen} />
                <Stack.Screen
                  name="Matchmaking"
                  component={MatchmakingScreen}
                  options={{ presentation: 'modal' }}
                />
              </>
            )}
            <Stack.Screen name="GamePvE" component={GameScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
