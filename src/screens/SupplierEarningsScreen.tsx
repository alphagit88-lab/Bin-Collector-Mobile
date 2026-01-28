import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

const SupplierEarningsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payouts & Earnings</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#2D2D2D', '#1A1A1A']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.balanceGradient}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>$1,240</Text>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <Text style={styles.emptyText}>
            Transaction history will be displayed here
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="earnings" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#373934',
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#FFFFFF',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierEarningsScreen;
