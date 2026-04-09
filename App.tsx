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
import { subscribeToForegroundNotifications } from './src/utils/fcmNotifications';

// Explicitly hide Expo splash screen immediately - we only use native splash
// This prevents Expo from showing its splash screen at all
SplashScreen.hideAsync().catch(() => {
  // Ignore if splash screen module is not available
});

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StripeProvider } from '@stripe/stripe-react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51MAmskKsbtrRwEQuTQKHT6q8Kbq96wr0Chjtp4GhuVyF7KdVymkApOpf06sj4nP9bR0JHP26soqRYvrU1FVUd7Jk00rEf4bFu2';

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

    // Listen for foreground FCM messages - only if not in Expo Go or build is linked
    if (!isExpoGo) {
      try {
        const unsubscribe = subscribeToForegroundNotifications();
        return () => unsubscribe?.();
      } catch (err) {
        console.warn('FCM registration failed. Rebuild your APK if you added new native modules.');
      }
    }
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const mainApp = (
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

  // If in Expo Go or native Stripe is missing, skip the provider
  // Note: Most apps crash if you import and it's missing, but this check helps if they have the lib but it's not registered
  if (isExpoGo) {
    return mainApp;
  }

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      {mainApp}
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
