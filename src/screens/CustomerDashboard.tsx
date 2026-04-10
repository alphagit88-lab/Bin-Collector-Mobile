import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

// Import Icons
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import BinCollectIcon from '../assets/images/Bin.Collect (1) 1.svg';
import Group13Icon from '../assets/images/Group 13.svg';
import Icon3_1 from '../assets/images/3_1.svg';
import PlayIcon from '../assets/images/play.svg';
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Icon20_3 from '../assets/images/20_3.svg';

const { width } = Dimensions.get('window');

interface Booking {
  id: number;
  request_id: string;
  bin_type_name: string;
  bin_size: string;
  status: string;
  total_price: string | number;
  estimated_price?: string | number;
  start_date: string;
  end_date: string;
  order_items_count: number;
  items?: any[];
  service_category?: string;
  service_names?: string;
  selected_services_count?: number;
}

const CustomerDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const userName = user?.name || 'Customer';

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [messageCount, setMessageCount] = React.useState(0);

  const fetchBookings = React.useCallback(async () => {
    try {
      // Refresh user profile to get latest permissions
      refreshUser();

      const [bookingsRes, notificationRes, messageRes] = await Promise.all([
        api.get<{ requests: Booking[] }>(ENDPOINTS.BOOKINGS.MY_REQUESTS),
        api.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
        api.get<{ count: number }>(ENDPOINTS.MESSAGES.UNREAD_COUNT),
      ]);

      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data.requests);
      }
      if (notificationRes.success && notificationRes.data) {
        setNotificationCount(Number(notificationRes.data.count) || 0);
      }
      if (messageRes.success && messageRes.data) {
        setMessageCount(Number(messageRes.data.count) || 0);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const activeBookingsCount = bookings.filter(b =>
    !['completed', 'cancelled'].includes(b.status.toLowerCase())
  ).length;

  const completedServicesCount = bookings.filter(b =>
    b.status.toLowerCase() === 'completed'
  ).length;

  const totalSpent = bookings
    .filter(b => b.status.toLowerCase() !== 'cancelled')
    .reduce((sum, b) => {
      const price = parseFloat(b.total_price as string || b.estimated_price as string || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getStatusDisplay = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9CCD17']} />}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'},</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton} 
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              </View>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerIconButton} 
              onPress={() => navigation.navigate('MessageInbox' as never)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="chatbox-outline" size={22} color="#FFFFFF" />
              </View>
              {messageCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{messageCount > 99 ? '99+' : messageCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.headerProfileButton} 
              onPress={() => navigation.navigate('Account' as never)}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order New Bin Button */}
        <TouchableOpacity
          style={styles.orderButtonContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OrderBin' as never)}>
          <LinearGradient
            colors={['#9CCD17', '#009B5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}>
            <View style={styles.orderButtonIconContainer}>
              <BinCollectIcon width={39} height={32} />
            </View>
            <Text style={styles.orderButtonText}>Order New Bin</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tracking and History Cards Row */}
        <View style={styles.trackingBookingRow}>
          {/* Tracking Card */}
          <View style={styles.trackingCard}>
            <LinearGradient
              colors={['#C0F96F', '#90B93E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.trackingCardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Tracking</Text>
                  <TouchableOpacity
                    style={styles.playButtonContainer}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('ServiceTracking' as never)}
                  >
                    <PlayIcon width={45} height={45} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStatValue}>{activeBookingsCount.toString().padStart(2, '0')}</Text>
                  <Text style={styles.cardStatLabel}>Active Bookings</Text>
                </View>
                <View style={styles.binCollectOverlay}>
                  <BinCollect2 width={192} height={128} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* History Card */}
          <View style={styles.bookingCard}>
            <LinearGradient
              colors={['#A7DB3D', '#D6EF72', '#D8FF3A']}
              locations={[0.1651, 0.6554, 0.8017]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.bookingCardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>History</Text>
                  <TouchableOpacity
                    style={styles.playButtonContainer}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('Bookings' as never)}
                  >
                    <PlayIcon width={45} height={45} />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStatValue}>{completedServicesCount.toString().padStart(2, '0')}</Text>
                  <Text style={styles.cardStatLabel}>Completed Services</Text>
                </View>
                <View style={styles.binCollectOverlayUpsideDown}>
                  <View
                    style={{
                      width: 192,
                      height: 128,
                      transform: [{ rotate: '180deg' }],
                      opacity: 0.34,
                    }}>
                    <BinCollect2 width={192} height={128} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Payments Card */}
        <TouchableOpacity
          style={styles.paymentsCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate(user?.canViewBilling ? 'Billing' : 'Bookings')}>
          <LinearGradient
            colors={['#29B554', '#6EAD16']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.paymentsCardGradient}>
            <View style={styles.paymentsContent}>
              <View style={styles.paymentsHeader}>
                <Text style={styles.paymentsTitle}>Payments</Text>
                <View style={styles.paymentsIconContainer}>
                  <Icon20_3 width={25} height={25} />
                </View>
              </View>
              <View style={styles.paymentsImageContainer}>
                <Icon3_1 width={210} height={168} />
              </View>
              <View style={styles.paymentsBinCollectContainer}>
                <BinCollect2 width={391} height={218} />
              </View>
              <View style={styles.paymentsBottomText}>
                <Text style={styles.paymentsAmount}>{formatPrice(totalSpent)}</Text>
                <Text style={styles.paymentsLabel}>Total Spent</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Bookings Section */}
        <View style={styles.recentBookingsSection}>
          <View style={styles.recentBookingsCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.342, y: 0 }}
              end={{ x: 0.658, y: 1 }}
              style={styles.recentBookingsCardGradient}>
              <View style={styles.recentBookingsHeader}>
                <Text style={styles.recentBookingsTitle}>Recent Bookings</Text>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('Bookings' as never)}>
                  <Text style={styles.viewAllText}>View all</Text>
                  <View style={styles.viewAllIcon}>
                    <PlayIcon width={25} height={25} />
                  </View>
                </TouchableOpacity>
              </View>

              {loading ? (
                <ActivityIndicator size="small" color="#9CCD17" style={{ marginVertical: 20 }} />
              ) : bookings.length > 0 ? (
                bookings.slice(0, 3).map((booking) => (
                  <View key={booking.id} style={styles.bookingItem}>
                    <View style={styles.bookingItemContent}>
                      <View style={styles.bookingItemLeft}>
                        <Text style={styles.bookingItemTitle}>
                          {booking.service_category === 'service'
                            ? (booking.service_names?.split(',')[0] || 'General Service') + ((booking.selected_services_count || 0) > 1 ? ` (+${(booking.selected_services_count || 0) - 1})` : '')
                            : (booking.items && booking.items.length > 0
                              ? booking.items[0].bin_type_name + (booking.items[0].bin_size ? ` - ${booking.items[0].bin_size}` : '')
                              : booking.bin_type_name + (booking.bin_size ? ` - ${booking.bin_size}` : ''))
                          }
                        </Text>
                        <Text style={styles.bookingItemId}>#{booking.request_id}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.bookingViewButton}
                        activeOpacity={0.7}
                        onPress={() => (navigation as any).navigate('ServiceTracking', { requestId: booking.id })}
                      >
                        <Text style={styles.bookingViewText}>View</Text>
                        <View style={styles.bookingViewIcon}>
                          <PlayIcon width={14.24} height={14.24} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ textAlign: 'center', marginVertical: 10, color: '#666' }}>No recent bookings</Text>
              )}
            </LinearGradient>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="dashboard" />
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
    gap: 6,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.family.bold,
  },
  headerProfileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#29B554',
    justifyContent: 'center',
    alignItems: 'center',
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
  trackingBookingRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    marginTop: 10,
    marginBottom: 10,
    gap: 7,
  },
  trackingCard: {
    flex: 1,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
  },
  trackingCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  bookingCard: {
    flex: 1,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
  },
  bookingCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  playButtonContainer: {
    width: 45,
    height: 45,
  },
  cardStats: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  cardStatValue: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#161616',
  },
  cardStatLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#373934',
    marginTop: 4,
  },
  binCollectOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  binCollectOverlayUpsideDown: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  topCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    marginTop: 10,
    gap: 7,
  },
  smallCard: {
    width: 192,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
  },
  smallCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  cardIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#424141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  paymentsCard: {
    marginHorizontal: 19,
    marginTop: 10,
    height: 246,
    borderRadius: 9,
    overflow: 'hidden',
  },
  paymentsCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  paymentsContent: {
    flex: 1,
  },
  paymentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  paymentsTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  paymentsIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#424141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentsBottomText: {
    position: 'absolute',
    bottom: 1,
    left: 1,
  },
  paymentsAmount: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#FFFFFF',
  },
  paymentsLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#FFFFFF',
    marginTop: 4,
  },
  paymentsImageContainer: {
    position: 'absolute',
    left: 180,
    bottom: -4,
    width: 210,
    height: 168,
  },
  paymentsBinCollectContainer: {
    position: 'absolute',
    bottom: -30,
    right: -40,
    width: 391,
    height: 218,
    opacity: 0.8,
    zIndex: 1,
  },
  paymentsImage: {
    width: '100%',
    height: '100%',
  },
  recentBookingsSection: {
    marginHorizontal: 19,
    marginTop: 10,
  },
  recentBookingsCard: {
    borderRadius: 9,
    overflow: 'hidden',
  },
  recentBookingsCardGradient: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#0000001A',
    padding: 14,
  },
  recentBookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentBookingsTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#242424',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 13,
    paddingVertical: 8.5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0000001A',
  },
  viewAllText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 5,
  },
  viewAllIcon: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllIconCircle: {
    width: 11.67,
    height: 12.22,
    backgroundColor: '#252525',
    borderRadius: 6,
  },
  bookingItem: {
    marginTop: 5,
    height: 59,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0000001A',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  bookingItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  bookingItemLeft: {
    flex: 1,
  },
  bookingItemTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  bookingItemId: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginTop: 4,
  },
  bookingViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    paddingHorizontal: 9,
    paddingVertical: 3.2,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#0000001A',
  },
  bookingViewText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
    marginRight: 5,
  },
  bookingViewIcon: {
    width: 14.24,
    height: 14.24,
    borderRadius: 7.12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingViewIconCircle: {
    width: 6.65,
    height: 6.96,
    backgroundColor: '#252525',
    borderRadius: 3.5,
  },
});

export default CustomerDashboard;
