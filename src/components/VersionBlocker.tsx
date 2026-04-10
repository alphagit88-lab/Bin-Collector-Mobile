import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import { api } from '../config/api';

interface VersionBlockerProps {
  children: React.ReactNode;
}

export const VersionBlocker: React.FC<VersionBlockerProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const response = await api.get<{ setting: { value: string } }>('/settings/public/mobile_app_version');
      if (response.success && response.data?.setting) {
        const requiredVersion = response.data.setting.value;
        const currentVersion = Constants.nativeAppVersion || Constants.expoConfig?.version || '1.0.0';

        if (requiredVersion && currentVersion && requiredVersion !== currentVersion) {
          setNeedsUpdate(true);
        }
      }
    } catch (error) {
      console.error('Failed to check version:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E6FBBF" />
      </View>
    );
  }

  if (needsUpdate) {
    const currentVersion = Constants.nativeAppVersion || Constants.expoConfig?.version || '1.0.0';
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Update Required</Text>
        <Text style={styles.message}>
          A new version of the app is available. (Current Version: {currentVersion}.) Please update to continue using BinRental.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            if (Platform.OS === 'android') {
              Linking.openURL('market://details?id=com.binrental.mobile').catch(() => {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.binrental.mobile');
              });
            } else if (Platform.OS === 'ios') {
              Linking.openURL('itms-apps://itunes.apple.com/app/id123456789').catch(() => {
                Linking.openURL('https://apps.apple.com/app/id123456789');
              });
            }
          }}
        >
          <Text style={styles.buttonText}>Update Now</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontFamily: 'LeagueSpartan_700Bold',
    fontSize: 28,
    color: '#000',
    marginBottom: 10
  },
  message: {
    fontFamily: 'LeagueSpartan_400Regular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30
  },
  button: {
    backgroundColor: '#86B51D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'LeagueSpartan_600SemiBold',
    fontSize: 18
  }
});
