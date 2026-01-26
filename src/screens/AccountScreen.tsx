import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';

const AccountScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Name</Text>
            <Text style={styles.userInfoValue}>{user?.name || 'N/A'}</Text>
          </View>

          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Phone</Text>
            <Text style={styles.userInfoValue}>{user?.phone || 'N/A'}</Text>
          </View>

          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Email</Text>
            <Text style={styles.userInfoValue}>{user?.email || 'N/A'}</Text>
          </View>

          <View style={styles.userInfoCard}>
            <Text style={styles.userInfoLabel}>Role</Text>
            <Text style={styles.userInfoValue}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButtonContainer}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutButtonGradient}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 19,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 32,
    lineHeight: 38,
    color: '#373934',
  },
  userInfoSection: {
    paddingHorizontal: 19,
    marginTop: 10,
  },
  userInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
    marginBottom: 12,
  },
  userInfoLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#979897',
    marginBottom: 8,
  },
  userInfoValue: {
    fontFamily: fonts.family.semiBold,
    fontSize: 18,
    lineHeight: 22,
    color: '#373934',
  },
  logoutButtonContainer: {
    marginHorizontal: 19,
    marginTop: 30,
    height: 56,
    borderRadius: 38,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoutButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

export default AccountScreen;
