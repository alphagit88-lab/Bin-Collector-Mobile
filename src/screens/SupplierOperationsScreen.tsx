import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

const SupplierOperationsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Operations</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.emptyText}>
            Operations will be displayed here
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="operations" />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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

export default SupplierOperationsScreen;
