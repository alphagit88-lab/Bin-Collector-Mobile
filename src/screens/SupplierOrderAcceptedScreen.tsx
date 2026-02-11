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
import { useNavigation, useRoute } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

// Import SVG images
import Logo14_1 from '../assets/images/14_1.svg';
import BannerImage from '../assets/images/4 1.svg';
import Icon35_1 from '../assets/images/35 1.svg';
import Icon35_2 from '../assets/images/35 2.svg';
import Icon36_1 from '../assets/images/36 1.svg';

const { width } = Dimensions.get('window');

interface OrderDetails {
  orderId?: string;
  binType?: string;
  binSize?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  collectionDate?: string;
  collectionTime?: string;
}

const SupplierOrderAcceptedScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get order details from route params if available
  const orderDetails: OrderDetails = (route.params as any)?.orderDetails || {
    orderId: '#10021',
    binType: 'General Waste',
    binSize: '6m³ - Medium',
    deliveryDate: '15/01/2026',
    deliveryTime: '9:00 AM - 12:00 PM',
    collectionDate: '22/01/2026',
    collectionTime: '9:00 AM - 12:00 PM',
  };

  const handleGoToDashboard = () => {
    navigation.navigate('SupplierDashboard' as never);
  };

  const handleGoToJobs = () => {
    navigation.navigate('SupplierJobs' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Job Management</Text>
                <Text style={styles.headerSubtitle}>
                  Track. Manage. Collect.
                </Text>
              </View>
              <View style={styles.truckIconContainer}>
                <Logo14_1 width={148} height={63} />
              </View>
            </View>
            <View style={styles.bannerContainer}>
              <BannerImage width={428} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Success Section */}
        <View style={styles.successSection}>
          {/* Success Card */}
          <View style={styles.successCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.successCardGradient}>
              {/* Success Image */}
              <View style={styles.successImageContainer}>
                <Icon36_1 width={95} height={76} />
              </View>

              {/* Order Accepted Text */}
              <Text style={styles.orderAcceptedTitle}>Order Accepted!</Text>
              <Text style={styles.orderAcceptedSubtitle}>
                Your bin order has been successfully placed.
              </Text>
            </LinearGradient>
          </View>
        </View>

        {/* Order Details Section */}
        <View style={styles.orderDetailsWrapper}>
          <View style={styles.orderDetailsCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.orderDetailsGradient}>
              <Text style={styles.orderDetailsTitle}>Order Details</Text>

              {/* Details Grid */}
              <View style={styles.detailsGrid}>
                {/* Row 1 */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Bin Type</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.binType}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Bin Size</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.binSize}
                    </Text>
                  </View>
                </View>

                {/* Row 2 */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Delivery Date</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.deliveryDate}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Delivery Time</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.deliveryTime}
                    </Text>
                  </View>
                </View>

                {/* Row 3 */}
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Collection Date</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.collectionDate}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Collection Time</Text>
                    <Text style={styles.detailValue}>
                      {orderDetails.collectionTime}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {/* Dashboard Button */}
                <TouchableOpacity
                  style={styles.dashboardButton}
                  activeOpacity={0.8}
                  onPress={handleGoToDashboard}>
                  <View style={styles.dashboardButtonContent}>
                    <Icon35_2 width={36} height={29} />
                    <Text style={styles.dashboardButtonText}>Dashboard</Text>
                  </View>
                </TouchableOpacity>

                {/* Jobs Button */}
                <TouchableOpacity
                  style={styles.jobsButton}
                  activeOpacity={0.8}
                  onPress={handleGoToJobs}>
                  <LinearGradient
                    colors={['rgba(137, 217, 87, 0.2)', '#29B554', '#6EAD16']}
                    locations={[0, 0.2227, 0.7018]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={styles.jobsButtonGradient}>
                    <Icon35_1 width={41} height={33} />
                    <Text style={styles.jobsButtonText}>Jobs</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="requests" />
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
    width: '100%',
    marginBottom: 16,
  },
  headerGradient: {
    width: '100%',
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 19,
    paddingTop: 40,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    lineHeight: 28,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  truckIconContainer: {
    marginTop: -10,
  },
  bannerContainer: {
    width: '100%',
    marginTop: 10,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 9,
  },
  successSection: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  successCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  successCardGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  successImageContainer: {
    marginBottom: 12,
  },
  orderAcceptedTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 32,
    lineHeight: 38,
    color: '#373934',
    textAlign: 'center',
    marginBottom: 8,
  },
  orderAcceptedSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    lineHeight: 14,
    color: '#373934',
    textAlign: 'center',
  },
  orderDetailsWrapper: {
    paddingHorizontal: 19,
  },
  orderDetailsCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  orderDetailsGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  orderDetailsTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsGrid: {
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: '#242424',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    lineHeight: 18,
    color: '#242424',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dashboardButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#252525',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashboardButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  jobsButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  jobsButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  jobsButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierOrderAcceptedScreen;
