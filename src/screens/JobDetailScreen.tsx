import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {themeColors} from '../theme/colors';
import {fonts} from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';

// Import SVG icons
import BannerImage from '../assets/images/4 1.svg';
import TruckIcon from '../assets/images/14_1.svg';

interface JobDetail {
  orderId: string;
  binType: string;
  binSize: string;
  total: string;
  deliveryDate: string;
  pickupDate: string;
  location: string;
  customerName: string;
  customerId: string;
}

const mockJobDetail: JobDetail = {
  orderId: '#10021',
  binType: 'General Waste',
  binSize: '6m³ - Medium',
  total: '$210.00',
  deliveryDate: 'March 15, 2024',
  pickupDate: 'March 20, 2024',
  location: '21-B Chaplin Rd, Toronto',
  customerName: 'Herper Russo',
  customerId: '#29123',
};

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Use route params if available, otherwise use mock data
  const jobDetail = (route.params as any)?.job || mockJobDetail;

  const handleAcceptOrder = () => {
    navigation.navigate(
      'SupplierOrderAccepted' as never,
      {
        orderDetails: {
          orderId: jobDetail.orderId,
          binType: jobDetail.binType,
          binSize: jobDetail.binSize,
          total: jobDetail.total,
          deliveryDate: jobDetail.deliveryDate,
          deliveryTime: '9:00 AM - 12:00 PM',
          collectionDate: jobDetail.pickupDate,
          collectionTime: '9:00 AM - 12:00 PM',
        },
      } as never,
    );
  };

  const handleDeclineOrder = () => {
    Alert.alert(
      'Decline Order',
      `Are you sure you want to decline order ${jobDetail.orderId}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Order Declined',
              `You have declined order ${jobDetail.orderId}`,
            ),
        },
      ],
    );
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
            locations={[0, 1]}
            style={styles.headerOverlay}>
            <LinearGradient
              colors={['#37B112', '#77C40A']}
              locations={[0.2227, 0.5982]}
              start={{x: 0.1, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>Job Management</Text>
                  <Text style={styles.headerSubtitle}>
                    Track. Manage. Collect.
                  </Text>
                </View>
                <View style={styles.truckIconContainer}>
                  <TruckIcon width={148} height={63} />
                </View>
              </View>
              <View style={styles.bannerContainer}>
                <BannerImage width={428} height={177} />
              </View>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Pending Requests Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingTitle}>Pending Requests</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.8}>
              <Text style={styles.backButtonText}>Back</Text>
              <View style={styles.backArrowContainer}>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Summary Card */}
          <LinearGradient
            colors={['#D0FF33', '#C7FFD3']}
            locations={[0.1564, 0.762]}
            start={{x: 0.2, y: 0}}
            end={{x: 0.8, y: 1}}
            style={styles.orderSummaryCard}>
            <View style={styles.orderSummaryRow}>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>Order ID</Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.orderId}
                </Text>
              </View>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>Bin Type</Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.binType}
                </Text>
              </View>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>Bin Size/Capacity</Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.binSize}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Order Details Section */}
        <View style={styles.orderDetailsContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.orderDetailsCard}>
            <Text style={styles.orderDetailsTitle}>Order Details</Text>

            {/* First Row - Order # and Total */}
            <View style={styles.detailsRow}>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Order #</Text>
                <Text style={styles.detailValue}>{jobDetail.orderId}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailValue}>{jobDetail.total}</Text>
              </LinearGradient>
            </View>

            {/* Second Row - Delivery Date and Pickup Date */}
            <View style={styles.detailsRow}>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Delivery Date</Text>
                <Text style={styles.detailValue}>{jobDetail.deliveryDate}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Pickup Date</Text>
                <Text style={styles.detailValue}>{jobDetail.pickupDate}</Text>
              </LinearGradient>
            </View>

            {/* Location Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.detailCardFull}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{jobDetail.location}</Text>
            </LinearGradient>

            {/* Bin Types Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.detailCardFull}>
              <Text style={styles.detailLabel}>Bin Types</Text>
              <Text style={styles.detailValue}>
                {jobDetail.binType} - {jobDetail.binSize}
              </Text>
            </LinearGradient>

            {/* Customer Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.detailCardFull}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>
                {jobDetail.customerName} - {jobDetail.customerId}
              </Text>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDeclineOrder}
                activeOpacity={0.8}>
                <Text style={styles.declineButtonText}>Decline Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptButtonWrapper}
                onPress={handleAcceptOrder}
                activeOpacity={0.8}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  locations={[0, 1]}
                  style={styles.acceptButtonOverlay}>
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    locations={[0.2227, 0.7018]}
                    start={{x: 0.1, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>Accept Order</Text>
                  </LinearGradient>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Job Management Tab Bar */}
        <View style={styles.jobManagementTab}>
          <LinearGradient
            colors={['#86F442', '#4E8E26']}
            locations={[0, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.jobManagementTabGradient}>
            <Text style={styles.jobManagementTabText}>Job Management</Text>
          </LinearGradient>
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
    width: '100%',
    marginBottom: 16,
  },
  headerOverlay: {
    width: '100%',
  },
  headerGradient: {
    width: '100%',
    paddingTop: 20,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 19,
    paddingTop: 20,
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
  sectionContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pendingTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#242424',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 14,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  backButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backArrowContainer: {
    width: 22,
    height: 22,
  },
  backArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrowText: {
    fontSize: 12,
    color: '#252525',
    transform: [{rotate: '180deg'}],
  },
  orderSummaryCard: {
    borderRadius: 9,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderSummaryColumn: {
    flex: 1,
  },
  orderSummaryLabel: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  orderSummaryValue: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  orderDetailsContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  orderDetailsCard: {
    borderRadius: 9,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderDetailsTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    textAlign: 'center',
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailCardSmall: {
    width: '48%',
    borderRadius: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailCardFull: {
    width: '100%',
    borderRadius: 9,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  detailValue: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    height: 50,
    backgroundColor: '#252525',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  declineButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  acceptButtonWrapper: {
    flex: 1,
    marginLeft: 8,
  },
  acceptButtonOverlay: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  acceptButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  jobManagementTab: {
    marginHorizontal: 37,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  jobManagementTabGradient: {
    height: 38,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobManagementTabText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default JobDetailScreen;
