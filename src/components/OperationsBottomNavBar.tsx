import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SvgProps } from 'react-native-svg';
import { fonts } from '../theme/fonts';

// Import SVG images - replace with Bin.Collect assets
import HomeIcon from '../assets/images/Bin.Collect (1) 3.svg';
import OperationsIcon from '../assets/images/Bin.Collect (1) 7.svg';
import PayoutsIcon from '../assets/images/Bin.Collect (1) 5.svg';
import HeaderIcon from '../assets/images/Bin.Collect (1) 6.svg';

interface OperationsBottomNavBarProps {
  activeTab?: 'home' | 'operations' | 'payouts';
}

const OperationsBottomNavBar: React.FC<OperationsBottomNavBarProps> = ({
  activeTab = 'operations',
}) => {
  const navigation = useNavigation();
  // Use flex layout instead of absolute positions for responsive nav

  const handleHomePress = () => {
    navigation.navigate('SupplierDashboard' as never);
  };

  const handleOperationsPress = () => {
    navigation.navigate('SupplierOperations' as never);
  };

  const handlePayoutsPress = () => {
    navigation.navigate('SupplierEarnings' as never);
  };

  const handleJobManagementPress = () => {
    navigation.navigate('SupplierJobs' as never);
  };

  const renderNavItem = (
    tab: 'home' | 'operations' | 'payouts',
    label: string,
    Icon: React.ComponentClass<SvgProps>,
    onPress: () => void,
    containerStyle?: any,
  ) => {
    const isActive = activeTab === tab;

    if (isActive) {
      return (
        <TouchableOpacity
          style={[styles.navItemActiveContainer, containerStyle]}
          activeOpacity={0.7}
          onPress={onPress}>
          <View style={styles.navItemActiveBackground}>
            <LinearGradient
              colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['#78FF30', '#6DBC00']}
              locations={[0.2487, 0.7225]}
              start={{ x: 0.8, y: 0 }}
              end={{ x: 0.2, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 42 }]}
            />
            <View style={styles.navItemActiveContent}>
              <View style={styles.iconCircleActive}>
                <Icon width={28} height={28} />
              </View>
              <Text style={styles.navItemTextActive}>{label}</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.navItemContainer, containerStyle]}
        activeOpacity={0.7}
        onPress={onPress}>
        <View style={styles.navItemRow}>
          <View style={styles.iconCircle}>
            <Icon width={28} height={28} />
          </View>
          <Text style={styles.navItemText}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Job Management Header Bar (solid #DCFFC7 background) - Clickable */}
      <TouchableOpacity
        style={styles.headerBarWrapper}
        activeOpacity={0.7}
        onPress={handleJobManagementPress}>
        <View style={styles.headerBarGreen}>
          <View style={styles.headerBarContent}>
            <View style={styles.headerIconContainer}>
              <HeaderIcon width={28} height={28} />
            </View>
            <Text style={styles.headerText}>Job Management</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      {/* Bottom Navigation (white base + translucent overlay) */}
      <View style={styles.bottomNavWrapper}>
        <LinearGradient
          colors={['#FFFFFF', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomNav}>
          <LinearGradient
            colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={styles.bottomNavContent}>
            {renderNavItem('home', 'Home', HomeIcon, handleHomePress, {
              marginLeft: -12,
            })}
            {renderNavItem(
              'operations',
              'Operations',
              OperationsIcon,
              handleOperationsPress,
            )}
            {renderNavItem(
              'payouts',
              'Payouts',
              PayoutsIcon,
              handlePayoutsPress,
              { marginRight: -12 },
            )}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerBarWrapper: {
    marginHorizontal: 37,
  },
  headerBar: {
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  headerBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  headerBarGreen: {
    height: 38,
    backgroundColor: '#DCFFC7',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  headerIconContainer: {
    width: 35,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#4E4B4B',
  },
  bottomNavWrapper: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  bottomNav: {
    height: 63,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 26,
    overflow: 'visible',
    justifyContent: 'center',
  },
  bottomNavContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 7,
    paddingHorizontal: 12,
  },
  navItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  navItemActiveContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemActiveBackground: {
    width: 115,
    height: 47,
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  navItemActiveContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 3,
  },
  iconCircleActive: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.1 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginRight: 8,
  },
  navItemText: {
    fontFamily: fonts.family.medium,
    fontSize: 11,
    lineHeight: 13,
    color: '#504A4A',
    textAlign: 'center',
  },

  navItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // removed absolute positioning styles — layout uses flexbox now
  navItemTextActive: {
    fontFamily: fonts.family.semiBold,
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
});

export default OperationsBottomNavBar;
