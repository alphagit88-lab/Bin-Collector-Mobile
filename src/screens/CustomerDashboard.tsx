import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { themeColors } from '../theme/colors';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.userName}>{user?.name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.emptyText}>Dashboard content will be added here</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: themeColors.primary,
  },
  welcomeText: {
    fontSize: 18,
    color: themeColors.textPrimary,
    marginBottom: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: themeColors.error,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: themeColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerDashboard;
