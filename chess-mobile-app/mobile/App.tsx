import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/home/HomeScreen';
import ModesScreen from './src/screens/modes/ModesScreen';
import PuzzleScreen from './src/screens/puzzle/PuzzleScreen';
import RankingScreen from './src/screens/ranking/RankingScreen';
import ShopScreen from './src/screens/shop/ShopScreen';
import LoginScreen from './src/screens/auth/LoginScreen';

type ScreenId = 'home' | 'modes' | 'puzzle' | 'ranking' | 'shop' | 'login';
const SCREENS: ScreenId[] = ['home', 'modes', 'puzzle', 'ranking', 'shop', 'login'];

export default function App() {
  const [screen, setScreen] = useState<ScreenId>('login');

  const navigate = (id: string) => {
    if (SCREENS.includes(id as ScreenId)) setScreen(id as ScreenId);
  };

  return (
    <View style={styles.root}>
      <View style={styles.phone}>
        {screen === 'home' ? (
          <HomeScreen key="home" onNavigate={navigate} />
        ) : screen === 'modes' ? (
          <ModesScreen key="modes" onNavigate={navigate} />
        ) : screen === 'puzzle' ? (
          <PuzzleScreen key="puzzle" onNavigate={navigate} />
        ) : screen === 'ranking' ? (
          <RankingScreen key="ranking" onNavigate={navigate} />
        ) : screen === 'shop' ? (
          <ShopScreen key="shop" onNavigate={navigate} />
        ) : (
          <LoginScreen key="login" onNavigate={navigate} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b12', alignItems: 'center' },
  phone: { flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden' },
});
