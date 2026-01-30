import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';

// Header truck/logo SVGs
import Svg14 from '../assets/images/14.svg';
import Logo14_1 from '../assets/images/14_1.svg';

const {width: screenWidth} = Dimensions.get('window');

const SupplierOperationsScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleAvailabilityPress = () => {
    navigation.navigate('SupplierAvailability' as never);
  };

  const handleFleetManagementPress = () => {
    navigation.navigate('FleetManagement' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{x: 0.12, y: 0.05}}
            end={{x: 0.88, y: 0.95}}
            style={styles.headerGradient}>
            {/* Title and Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operations</Text>
              <Text style={styles.headerSubtitle}>Edit service coverage</Text>
            </View>

            {/* subtle translucent overlay */}
            <LinearGradient
              colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
              start={{x: 0, y: 0}}
              end={{x: 0, y: 1}}
              style={styles.overlayGradient}
              pointerEvents="none"
            />

            {/* Decorative Image (truck/logo) */}
            <View style={styles.decorativeImageContainer}>
              <Logo14_1 width={148} height={63} />
            </View>

            {/* Large truck SVG placed inside header */}
            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>

          {/* Replaced map with three action buttons (Fleet Management, Service Area, Availability) */}
          <View style={styles.threeButtonsContainer}>
            <TouchableOpacity
              style={styles.largeCard}
              activeOpacity={0.85}
              onPress={handleFleetManagementPress}>
              <LinearGradient
                colors={['#B9F38F', '#77C40A']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.largeCardGradient}>
                <View style={styles.largeCardContent}>
                  <View>
                    <Text style={styles.largeCardLabel}>Fleet Management</Text>
                    <Text style={styles.largeCardNumber}>03</Text>
                    <Text style={styles.largeCardSub}>Active Fleets</Text>
                  </View>
                  <View style={styles.playContainer}>
                    <View style={styles.playCircle}>
                      <Text style={styles.playIcon}>▶</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.smallCard} activeOpacity={0.85}>
              <LinearGradient
                colors={['#29B554', '#6EAD16']}
                locations={[0.2227, 0.7018]}
                start={{x: 0.88, y: 0}}
                end={{x: 0.12, y: 1}}
                style={styles.smallCardGradient}>
                {/* translucent overlay */}
                <LinearGradient
                  colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.smallCardOverlay}
                  pointerEvents="none"
                />

                <View
                  style={[
                    styles.smallCardContent,
                    styles.smallCardContentOnTop,
                  ]}>
                  <Text style={styles.smallCardLabel}>Service Area</Text>
                  <View style={styles.playCircleSmall}>
                    <Text style={styles.playIconSmall}>▶</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smallCard}
              activeOpacity={0.85}
              onPress={handleAvailabilityPress}>
              <LinearGradient
                colors={['#C0F96F', '#6EAD16']}
                locations={[0.2227, 0.7018]}
                start={{x: 0.88, y: 0}}
                end={{x: 0.12, y: 1}}
                style={styles.smallCardGradient}>
                {/* translucent overlay */}
                <LinearGradient
                  colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.smallCardOverlay}
                  pointerEvents="none"
                />

                <View
                  style={[
                    styles.smallCardContent,
                    styles.smallCardContentOnTop,
                  ]}>
                  <Text style={styles.smallCardLabel}>Availability</Text>
                  <View style={styles.playCircleSmall}>
                    <Text style={styles.playIconSmall}>▶</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <OperationsBottomNavBar activeTab="operations" />
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
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    height: 241,
    paddingTop: 20,
    paddingHorizontal: 19,
    position: 'relative',
  },
  headerTextContainer: {
    zIndex: 3,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
    marginTop: 4,
  },
  decorativeImageContainer: {
    position: 'absolute',
    right: 0,
    top: 9,
    width: 148,
    height: 63,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
    zIndex: 1,
  },
  decorativeImage: {
    width: 148,
    height: 63,
  },
  headerSvgContainer: {
    position: 'absolute',
    left: 2,
    top: 64,
    width: screenWidth - 4,
    height: 177,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
  },
  threeButtonsContainer: {
    paddingHorizontal: 19,
    marginTop: 12,
  },
  largeCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  largeCardGradient: {
    padding: 16,
    borderRadius: 12,
  },
  largeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  largeCardLabel: {
    fontFamily: fonts.family.semiBold,
    color: '#28561E',
    fontSize: 14,
    marginBottom: 6,
  },
  largeCardNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 34,
    color: '#17360F',
    marginBottom: 2,
  },
  largeCardSub: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#2E4C20',
  },
  playContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    color: '#FFF',
    fontSize: 18,
  },
  smallCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  smallCardGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  smallCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    zIndex: 1,
  },
  smallCardContentOnTop: {
    zIndex: 2,
  },
  smallCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  smallCardLabel: {
    fontFamily: fonts.family.semiBold,
    color: '#0C3A0E',
    fontSize: 16,
  },
  playCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconSmall: {
    color: '#FFF',
    fontSize: 14,
  },
  sectionContainer: {
    paddingHorizontal: 19,
    marginBottom: 12,
  },
  /* card styles removed */
  bottomSpacing: {
    height: 120,
  },
});

export default SupplierOperationsScreen;
