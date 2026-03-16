import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';

// Import SVG images
import Icon1 from '../assets/images/1 235.svg';
import Icon2 from '../assets/images/1 236.svg';
import Icon3 from '../assets/images/1 237.svg';
import Icon4 from '../assets/images/1 238.svg';
import Icon5 from '../assets/images/1 239.svg';

interface BottomNavBarProps {
  activeTab?: 'dashboard' | 'orderBin' | 'bookings' | 'tracking' | 'account';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab = 'dashboard',
}) => {
  const navigation = useNavigation();

  return (
    <View style={styles.bottomNav}>
      <View style={styles.bottomNavGradient}>
        <LinearGradient
          colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bottomNavContent}>
          {/* Dashboard */}
          <TouchableOpacity
            style={
              activeTab === 'dashboard'
                ? styles.navItem
                : styles.navItemInactive
            }
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CustomerDashboard' as never)}>
            {activeTab === 'dashboard' ? (
              <View style={styles.navItemActiveBackground}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#78FF30', '#6DBC00']}
                  locations={[0.2487, 0.7225]}
                  start={{ x: 0.8, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.navItemActiveContent}>
                  <View style={styles.navIconContainerActive}>
                    <Icon1 width={28} height={28} />
                  </View>
                  <Text style={styles.navItemTextActive}>Dashboard</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.navIconContainer}>
                  <Icon1 width={28} height={28} />
                </View>
                <Text style={styles.navItemText}>Dashboard</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Order Bin */}
          <TouchableOpacity
            style={
              activeTab === 'orderBin' ? styles.navItem : styles.navItemInactive
            }
            activeOpacity={0.7}
            onPress={() => navigation.navigate('OrderBin' as never)}>
            {activeTab === 'orderBin' ? (
              <View style={styles.navItemActiveBackground}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#78FF30', '#6DBC00']}
                  locations={[0.2487, 0.7225]}
                  start={{ x: 0.8, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.navItemActiveContent}>
                  <View style={styles.navIconContainerActive}>
                    <Icon2 width={28} height={28} />
                  </View>
                  <Text style={styles.navItemTextActive}>Order Bin</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.navIconContainer}>
                  <Icon2 width={28} height={28} />
                </View>
                <Text style={styles.navItemText}>Order Bin</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bookings */}
          <TouchableOpacity
            style={
              activeTab === 'bookings' ? styles.navItem : styles.navItemInactive
            }
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Bookings' as never)}>
            {activeTab === 'bookings' ? (
              <View style={styles.navItemActiveBackground}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#78FF30', '#6DBC00']}
                  locations={[0.2487, 0.7225]}
                  start={{ x: 0.8, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.navItemActiveContent}>
                  <View style={styles.navIconContainerActive}>
                    <Icon3 width={28} height={28} />
                  </View>
                  <Text style={styles.navItemTextActive}>Bookings</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.navIconContainer}>
                  <Icon3 width={28} height={28} />
                </View>
                <Text style={styles.navItemText}>Bookings</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Tracking */}
          <TouchableOpacity
            style={
              activeTab === 'tracking' ? styles.navItem : styles.navItemInactive
            }
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ServiceTracking' as never)}>
            {activeTab === 'tracking' ? (
              <View style={styles.navItemActiveBackground}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#78FF30', '#6DBC00']}
                  locations={[0.2487, 0.7225]}
                  start={{ x: 0.8, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.navItemActiveContent}>
                  <View style={styles.navIconContainerActive}>
                    <Icon4 width={28} height={28} />
                  </View>
                  <Text style={styles.navItemTextActive}>Tracking</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.navIconContainer}>
                  <Icon4 width={28} height={28} />
                </View>
                <Text style={styles.navItemText}>Tracking</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Account */}
          <TouchableOpacity
            style={
              activeTab === 'account' ? styles.navItem : styles.navItemInactive
            }
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Account' as never)}>
            {activeTab === 'account' ? (
              <View style={styles.navItemActiveBackground}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#78FF30', '#6DBC00']}
                  locations={[0.2487, 0.7225]}
                  start={{ x: 0.8, y: 0 }}
                  end={{ x: 0.2, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={styles.navItemActiveContent}>
                  <View style={styles.navIconContainerActive}>
                    <Icon5 width={28} height={28} />
                  </View>
                  <Text style={styles.navItemTextActive}>Account</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.navIconContainer}>
                  <Icon5 width={28} height={28} />
                </View>
                <Text style={styles.navItemText}>Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 10,
    right: 10,
    height: 83, // Group 11: height: 83px
    borderRadius: 26,
    overflow: 'hidden',
  },
  bottomNavGradient: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 26,
    overflow: 'hidden',
  },
  bottomNavContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 7,
    paddingHorizontal: 6,
  },
  navItem: {
    alignItems: 'center',
    width: 73, // Group 85-89: width: 73px
    height: 53, // Group 85-89: height: 53px
    marginTop: 2,
  },
  navItemInactive: {
    alignItems: 'center',
    width: 73, // Group 85-89: width: 73px
    height: 53, // Group 85-89: height: 53px
    marginTop: 8,
  },
  navItemActiveBackground: {
    width: 75, // Rectangle 7: width: 78px
    height: 70, // Rectangle 7: height: 70px
    borderRadius: 18, // Rectangle 7: border-radius: 18px
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    marginBottom: 5,
    marginTop: -2,
  },
  navItemActiveContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 9,
    paddingBottom: 8,
  },
  navIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  navIconContainerActive: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemText: {
    fontFamily: fonts.family.medium,
    fontSize: 11,
    lineHeight: 13,
    color: '#504A4A',
    textAlign: 'center',
  },
  navItemTextActive: {
    fontFamily: fonts.family.medium,
    fontSize: 11,
    lineHeight: 13,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 0,
  },
});

export default BottomNavBar;
