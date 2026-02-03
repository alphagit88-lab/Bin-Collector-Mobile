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
import { showMessage } from 'react-native-flash-message';
import { useSocket } from '../contexts/SocketContext';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

// Import SVG assets
import BinCollectBg from '../assets/images/Bin.Collect_2.svg';
import HeaderGreetingImage from '../assets/images/14_1.svg';
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
    completed: 0
  });
  const [loading, setLoading] = React.useState(true);

  const fetchCounts = React.useCallback(async (showNotification = false) => {
    try {
      // Pending requests available to accept
      const pendingResponse = await api.get<{ requests: any[] }>(ENDPOINTS.BOOKINGS.PENDING);
      // Jobs already assigned to me
      const myJobsResponse = await api.get<{ requests: any[] }>(ENDPOINTS.BOOKINGS.SUPPLIER_REQUESTS);

      if (pendingResponse.success && myJobsResponse.success) {
        const pending = pendingResponse.data?.requests?.length || 0;
        const myJobs = myJobsResponse.data?.requests || [];

        const confirmed = myJobs.filter((j: any) => j.status === 'confirmed').length;
        const inProgress = myJobs.filter((j: any) => ['on_delivery', 'delivered', 'ready_to_pickup', 'pickup'].includes(j.status)).length;
        const completed = myJobs.filter((j: any) => j.status === 'completed').length;

        setCounts({ pending, confirmed, inProgress, completed });

        // If there are pending requests, notify the user explicitly
        if (showNotification && pending > 0) {
          showMessage({
            message: "Action Required",
            description: `You have ${pending} pending service request(s) waiting for your quote.`,
            type: "info",
            backgroundColor: "#29B554",
            icon: "info",
            duration: 4000,
            onPress: () => navigation.navigate('SupplierRequests' as never),
          });
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
      const handleUpdate = () => {
        fetchCounts(false); // Don't show toast for background refreshes
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
          <HeaderGreetingImage width={148} height={63} />
        </View>

        {/* Top Cards Row - Pending & Active */}
        <View style={styles.topCardsRow}>
          {/* Pending Card */}
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.topCardGradient}>
            <View style={styles.topCardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.topCardTitle}>Pending</Text>
                <TouchableOpacity style={styles.playButtonContainer}>
                  <PlayIcon width={45} height={45} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.topCardNumber}>{counts.pending.toString().padStart(2, '0')}</Text>
                <Text style={styles.topCardSubtitle}>Pending Quotes</Text>
              </View>
              <View style={styles.binCollectOverlay}>
                <BinCollectBg width={192} height={128} />
              </View>
            </View>
          </LinearGradient>

          {/* Active Card */}
          <LinearGradient
            colors={['#A7DB3D', '#D6EF72', '#D8FF3A']}
            locations={[0.1651, 0.6554, 0.8017]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.topCardGradient}>
            <View style={styles.topCardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.topCardTitle}>Active</Text>
                <TouchableOpacity style={styles.playButtonContainer}>
                  <PlayIcon width={45} height={45} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.topCardNumber}>{counts.inProgress.toString().padStart(2, '0')}</Text>
                <Text style={styles.topCardSubtitle}>Active Jobs</Text>
              </View>
              <View style={styles.binCollectOverlayUpsideDown}>
                <View
                  style={{
                    width: 192,
                    height: 128,
                    transform: [{ rotate: '180deg' }],
                  }}>
                  <BinCollectBg width={192} height={128} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payouts & Earnings Section */}
        <View style={styles.earningsCard}>
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
                <Text style={styles.balanceAmount}>$0</Text>
                <Text style={styles.balanceLabel}>Available Balance</Text>
              </View>
              <View style={styles.earningsImageContainer}>
                <EarningsImage width={219} height={175} />
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

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

                {/* Completed Jobs */}
                <TouchableOpacity
                  style={styles.jobCard}
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
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 40,
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
  topCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    marginBottom: 10,
    gap: 7,
  },
  topCardGradient: {
    flex: 1,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  topCardContent: {
    flex: 1,
    position: 'relative',
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topCardTitle: {
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
  topCardNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#161616',
  },
  topCardSubtitle: {
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
  cardTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  notificationCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#424141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#161616',
    marginTop: 20,
  },
  cardSubtitle: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#373934',
    marginTop: 5,
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
    right: -22,
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
  completedColor: {
    color: '#2E8015',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierDashboard;
