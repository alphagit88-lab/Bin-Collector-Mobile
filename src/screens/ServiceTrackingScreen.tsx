import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';

// Import SVG images
import Logo14_1 from '../assets/images/14_1.svg';
import Icon6 from '../assets/images/6.svg';
import BinCollectIcon from '../assets/images/Bin.Collect (1) 1.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ServiceTrackingScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const userName = user?.name || 'Herper Russo';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Logo14_1 width={148} height={63} />
          </View>
        </View>

        {/* Order New Bin Button */}
        <TouchableOpacity style={styles.orderButtonContainer} activeOpacity={0.8}>
          <LinearGradient
            colors={['#9CCD17', '#009B5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}
          >
            <View style={styles.orderButtonIconContainer}>
              <BinCollectIcon width={39} height={32} />
            </View>
            <Text style={styles.orderButtonText}>Order New Bin</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Service Tracking Container */}
        <View style={styles.trackingContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.85, y: 0 }}
            end={{ x: 0.15, y: 1 }}
            style={styles.trackingContainerGradient}
          >
            {/* Service Tracking Header */}
            <Text style={styles.serviceTrackingTitle}>Service Tracking</Text>

            {/* Separator Line */}
            <View style={styles.separatorLine} />

            {/* No Active Services Content */}
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIcon}>
                <Icon6 width={148} height={63} />
              </View>
              <Text style={styles.emptyStateText}>No active services</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab={'tracking'} />
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
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#373934',
  },
  userNameText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#A7DB3D',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderButtonContainer: {
    marginHorizontal: 21,
    marginTop: 10,
    marginBottom: 10,
    height: 56,
    borderRadius: 38,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderButtonIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  trackingContainer: {
    marginHorizontal: 12,
    marginTop: 10,
    width: SCREEN_WIDTH - 24,
    maxWidth: 408,
    height: 680,
    borderRadius: 9,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  trackingContainerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  serviceTrackingTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 11,
    fontFamily: fonts.family.bold,
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    color: '#373934',
  },
  separatorLine: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 51,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 252,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 148,
    height: 63,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    width: 219,
    height: 23,
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    textAlign: 'center',
    color: '#373934',
  },
});

export default ServiceTrackingScreen;
