import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store/authStore';

const App = () => {
  useEffect(() => { void useAuthStore.getState().hydrate(); }, []);
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0A1A" />
      <AppNavigator />
    </>
  );
};

export default App;
