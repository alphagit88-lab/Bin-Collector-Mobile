import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

// Import Icons
import { Ionicons, Feather } from '@expo/vector-icons';
import BinCollectBg from '../assets/images/Bin.Collect_2.svg';
import EarningsImage from '../assets/images/3_1.svg';
import PlayIcon from '../assets/images/play.svg';

const { width: screenWidth } = Dimensions.get('window');

const EarningsPlayIcon = () => (
  <Svg width={45} height={45} viewBox="0 0 45 45" fill="none">
    <Circle cx="22.5" cy="22.5" r="22.5" fill="#424141" />
    <Path d="M18 14L18 31L30 22.5L18 14Z" fill="#FFFFFF" />
  </Svg>
);

const SupplierDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const { socket } = useSocket();
  const [counts, setCounts] = React.useState({
    pending: 0,
    confirmed: 0,
    inProgress: 0,
    readyToPickup: 0,
    completed: 0
  });
  const [wallet, setWallet] = React.useState<{ balance: string; pending_balance: string; total_earned: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [messageCount, setMessageCount] = React.useState(0);

  const fetchCounts = React.useCallback(async (showNotification = false) => {
    try {
      // Pending requests available to accept
      const pendingResponse = await api.get<{ requests: any[] }>(ENDPOINTS.BOOKINGS.PENDING);
      // Jobs already assigned to me
      const myJobsResponse = await api.get<{ requests: any[] }>(ENDPOINTS.BOOKINGS.SUPPLIER_REQUESTS);
      // Wallet data
      const walletResponse = await api.get<{ wallet: any }>(ENDPOINTS.WALLET.GET);
      const notificationRes = await api.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
      const messageRes = await api.get<{ count: number }>(ENDPOINTS.MESSAGES.UNREAD_COUNT);

      if (pendingResponse.success && myJobsResponse.success) {
        const pending = pendingResponse.data?.requests?.length || 0;
        const myJobs = myJobsResponse.data?.requests || [];

        const confirmed = myJobs.filter((j: any) => j.status === 'confirmed').length;
        const inProgress = myJobs.filter((j: any) => ['on_delivery', 'delivered', 'pickup'].includes(j.status)).length;
        const readyToPickup = myJobs.filter((j: any) => j.status === 'ready_to_pickup').length;
        const completed = myJobs.filter((j: any) => j.status === 'completed').length;
 
        setCounts({ pending, confirmed, inProgress, readyToPickup, completed });

        if (walletResponse.success && walletResponse.data?.wallet) {
          setWallet(walletResponse.data.wallet);
        }
        if (notificationRes.success && notificationRes.data) {
          setNotificationCount(Number(notificationRes.data.count) || 0);
        }
        if (messageRes.success && messageRes.data) {
          setMessageCount(Number(messageRes.data.count) || 0);
        }

        // If there are pending requests, notify the user explicitly
        if (showNotification && pending > 0) {
          toast.info(
            "Action Required",
            `You have ${pending} pending service request(s) waiting for your quote.`,
            () => navigation.navigate('SupplierRequests' as never)
          );
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCounts(true);
    }, [fetchCounts])
  );

  React.useEffect(() => {
    if (socket) {
      const handleUpdate = (data?: any) => {
        fetchCounts(false); // Don't show toast for background refreshes

        if (data && data.status === 'ready_to_pickup') {
          toast.info('New Update', data.message || 'A bin is ready for pickup!');
        }
      };

      socket.on('new_request', handleUpdate);
      socket.on('status_update', handleUpdate);

      return () => {
        socket.off('new_request', handleUpdate);
        socket.off('status_update', handleUpdate);
      };
    }
  }, [socket, fetchCounts]);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const companyName = user?.name || 'Waste Solutions Inc.';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header with Greeting */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>
              {getGreeting()},{'\n'}
              <Text style={styles.greetingName}>{companyName}</Text>
            </Text>
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



        {/* Payouts & Earnings Section */}
        <TouchableOpacity
          style={styles.earningsCard}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('SupplierEarnings' as never)}
        >
          <LinearGradient
            colors={['#29B554', '#6EAD16']}
            start={{ x: 0.22, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.earningsGradient}>
            <View style={styles.earningsBackground}>
              <BinCollectBg
                width={391}
                height={218}
                style={styles.earningsBgImage}
              />
            </View>
            <LinearGradient
              colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.earningsOverlay}>
              <View style={styles.earningsContent}>
                <View style={styles.earningsHeader}>
                  <Text style={styles.earningsTitle}>Payouts & Earnings</Text>
                  <View style={styles.earningsNotification}>
                    <EarningsPlayIcon />
                  </View>
                </View>
                <Text style={styles.balanceAmount}>${wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}</Text>
                <Text style={styles.balanceLabel}>Available Balance</Text>
              </View>
              <View style={styles.earningsImageContainer}>
                <EarningsImage width={219} height={175} />
              </View>
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>

        {/* Job Management Section */}
        <View style={styles.jobManagementSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Job Management</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('SupplierJobs', { initialCategory: 'all' })}
            >
              <LinearGradient
                colors={['#424141', '#2D2D2D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.viewAllGradient}>
                <Text style={styles.viewAllText}>View all</Text>
                <PlayIcon width={30} height={30} />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Job Management Grid */}
          <View style={styles.jobGridContainer}>
            <View style={styles.jobGrid}>
              {/* Row 1 */}
              <View style={styles.jobGridRow}>
                {/* Pending Requests */}
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate('SupplierRequests' as never)}
                >
                  <View style={styles.jobCardContent}>
                    <Text style={[styles.jobNumber, styles.pendingColor]}>
                      {counts.pending.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.jobLabel}>Pending Requests</Text>
                  </View>
                  <View style={styles.jobCardIcon}>
                    <PlayIcon width={18} height={18} />
                  </View>
                </TouchableOpacity>

                {/* Confirmed Bookings */}
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate('SupplierJobs', { initialCategory: 'confirmed' })}
                >
                  <View style={styles.jobCardContent}>
                    <Text style={[styles.jobNumber, styles.confirmedColor]}>
                      {counts.confirmed.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.jobLabel}>Confirmed Bookings</Text>
                  </View>
                  <View style={styles.jobCardIcon}>
                    <PlayIcon width={18} height={18} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 2 */}
              <View style={styles.jobGridRow}>
                {/* In-Progress Jobs */}
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate('SupplierJobs', { initialCategory: 'inProgress' })}
                >
                  <View style={styles.jobCardContent}>
                    <Text style={[styles.jobNumber, styles.progressColor]}>
                      {counts.inProgress.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.jobLabel}>In-Progress Jobs</Text>
                  </View>
                  <View style={styles.jobCardIcon}>
                    <PlayIcon width={18} height={18} />
                  </View>
                </TouchableOpacity>
 
                {/* Ready To Pickup */}
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate('SupplierJobs', { initialCategory: 'ready_to_pickup' })}
                >
                  <View style={styles.jobCardContent}>
                    <Text style={[styles.jobNumber, styles.pickupColor]}>
                      {counts.readyToPickup.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.jobLabel}>Ready To Pickup</Text>
                  </View>
                  <View style={styles.jobCardIcon}>
                    <PlayIcon width={18} height={18} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 3 */}
              <View style={[styles.jobGridRow, { justifyContent: 'center' }]}>
                {/* Completed Jobs */}
                <TouchableOpacity
                  style={[styles.jobCard, { flex: 0, width: '48.5%' }]}
                  onPress={() => navigation.navigate('SupplierJobs', { initialCategory: 'completed' })}
                >
                  <View style={styles.jobCardContent}>
                    <Text style={[styles.jobNumber, styles.completedColor]}>
                      {counts.completed.toString().padStart(2, '0')}
                    </Text>
                    <Text style={styles.jobLabel}>Completed Jobs</Text>
                  </View>
                  <View style={styles.jobCardIcon}>
                    <PlayIcon width={18} height={18} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom spacing for nav bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <SupplierBottomNavBar activeTab="dashboard" />
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
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  greetingContainer: {
    width: 199,
  },
  greetingText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#373934',
  },
  greetingName: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#29B554',
  },

  earningsCard: {
    width: '100%',
    height: 246,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 10,
  },
  earningsGradient: {
    flex: 1,
    position: 'relative',
  },
  earningsOverlay: {
    flex: 1,
    position: 'relative',
  },
  earningsBackground: {
    position: 'absolute',
    top: 28,
    left: 0,
    zIndex: 0,
    opacity: 0.34,
  },
  earningsBgImage: {
    opacity: 1,
  },
  earningsContent: {
    padding: 14,
    zIndex: 1,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  earningsNotification: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#424141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#FFFFFF',
    marginTop: 100,
  },
  balanceLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#FFFFFF',
    marginTop: 5,
  },
  earningsImageContainer: {
    position: 'absolute',
    left: 180,
    top: 59,
  },
  jobManagementSection: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#242424',
  },
  viewAllButton: {
    borderRadius: 17,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 17,
  },
  viewAllText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 8,
  },
  jobGridContainer: {
    backgroundColor: '#EAFFCC',
    borderRadius: 16,
    padding: 10,
  },
  jobGrid: {
    gap: 10,
  },
  jobGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  jobCard: {
    flex: 1,
    height: 98,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  jobNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 32,
    lineHeight: 38,
    marginTop: 15,
    marginBottom: 4,
  },
  jobLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#242424',
  },
  jobCardIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderWidth: 0.9,
    borderColor: '#000000',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingColor: {
    color: '#C4CA00',
  },
  confirmedColor: {
    color: '#408FC7',
  },
  progressColor: {
    color: '#66E91F',
  },
  pickupColor: {
    color: '#FF9500',
  },
  completedColor: {
    color: '#2E8015',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierDashboard;
