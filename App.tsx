import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { LeagueSpartan_100Thin, LeagueSpartan_300Light, LeagueSpartan_400Regular, LeagueSpartan_500Medium, LeagueSpartan_600SemiBold, LeagueSpartan_700Bold, LeagueSpartan_800ExtraBold, LeagueSpartan_900Black } from '@expo-google-fonts/league-spartan';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import FlashMessage from 'react-native-flash-message';

// Explicitly hide Expo splash screen immediately - we only use native splash
// This prevents Expo from showing its splash screen at all
SplashScreen.hideAsync().catch(() => {
  // Ignore if splash screen module is not available
});

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    LeagueSpartan_100Thin,
    LeagueSpartan_300Light,
    LeagueSpartan_400Regular,
    LeagueSpartan_500Medium,
    LeagueSpartan_600SemiBold,
    LeagueSpartan_700Bold,
    LeagueSpartan_800ExtraBold,
    LeagueSpartan_900Black,
  });

  useEffect(() => {
    // Ensure Expo splash is hidden on mount
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SocketProvider>
        <StatusBar style="dark" />
        <View style={styles.container}>
          <AppNavigator />
        </View>
        <FlashMessage position="top" />
      </SocketProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
