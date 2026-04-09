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
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation, useRoute} from '@react-navigation/native';
import {fonts} from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';

// Import SVG images
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Icon35_1 from '../assets/images/35 1.svg';
import Icon35_2 from '../assets/images/35 2.svg';
import Icon36_1 from '../assets/images/36 1.svg';

const {width} = Dimensions.get('window');

interface OrderDetails {
  binType?: string;
  binSize?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  collectionDate?: string;
  collectionTime?: string;
}

const OrderSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get order details from route params if available
  const orderDetails: OrderDetails = (route.params as any)?.orderDetails || {
    binType: 'General Waste',
    binSize: '6m³ - Medium',
    deliveryDate: '15/01/2026',
    deliveryTime: '9:00 AM - 12:00 PM',
    collectionDate: '22/01/2026',
    collectionTime: '9:00 AM - 12:00 PM',
  };

  const handleGoToDashboard = () => {
    navigation.navigate('CustomerDashboard' as never);
  };

  const handleTrackOrder = () => {
    navigation.navigate('ServiceTracking' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <LinearGradient
            colors={['#29B554', '#6EAD16']}
            start={{x: 0.22, y: 0}}
            end={{x: 0.7, y: 1}}
            style={styles.headerBannerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Order Bin</Text>
                <Text style={styles.headerSubtitle}>
                  Track. Manage. Collect.
                </Text>
              </View>
              <View style={styles.headerRight}>
                <HeaderActionIcons />
              </View>
            </View>
            <View style={styles.headerImageContainer}>
              <Image
                source={require('../assets/images/image1_25_2.png')}
                style={styles.headerImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.binCollectOverlay}>
              <BinCollect2 width={200} height={100} />
            </View>
          </LinearGradient>
        </View>

        {/* Success Section */}
        <View style={styles.successSection}>
          {/* Success Image */}
          <View style={styles.successImageContainer}>
            <Icon36_1 width={158} height={127} />
          </View>

          {/* Order Confirmed Text */}
          <Text style={styles.orderConfirmedTitle}>Order Confirmed!</Text>
          <Text style={styles.orderConfirmedSubtitle}>
            Your bin order has been successfully placed.
          </Text>
        </View>

        {/* Order Details Section */}
        <View style={styles.orderDetailsContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{x: 0.34, y: 0}}
            end={{x: 0.66, y: 1}}
            style={styles.orderDetailsGradient}>
            <Text style={styles.orderDetailsTitle}>Order Details</Text>

            {/* Details Grid */}
            <View style={styles.detailsGrid}>
              {/* Row 1 */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bin Type</Text>
                  <Text style={styles.detailValue}>{orderDetails.binType}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Bin Size</Text>
                  <Text style={styles.detailValue}>{orderDetails.binSize}</Text>
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

              {/* Track Order Button */}
              <TouchableOpacity
                style={styles.trackOrderButton}
                activeOpacity={0.8}
                onPress={handleTrackOrder}>
                <LinearGradient
                  colors={[
                    'rgba(137, 217, 87, 0.2)',
                    'rgba(137, 217, 87, 0.2)',
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['#29B554', '#6EAD16']}
                  start={{x: 0.22, y: 0}}
                  end={{x: 0.7, y: 1}}
                  style={styles.trackOrderButtonGradient}>
                  <Icon35_1 width={41} height={33} />
                  <Text style={styles.trackOrderButtonText}>Track Order</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="orderBin" />
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
  headerBanner: {
    width: '100%',
    height: 241,
    overflow: 'visible',
  },
  headerBannerGradient: {
    flex: 1,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
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
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerRight: {
    position: 'absolute',
    right: 19,
    top: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  headerIconButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  headerProfileButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#29B554',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 240,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  binCollectOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 19,
  },
  successSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 19,
  },
  successImageContainer: {
    width: 158,
    height: 127,
    marginBottom: 20,
  },
  orderConfirmedTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 8,
  },
  orderConfirmedSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 20,
  },
  orderDetailsContainer: {
    marginHorizontal: 19,
    marginTop: 16,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderDetailsGradient: {
    padding: 16,
  },
  orderDetailsTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    textAlign: 'center',
    color: '#242424',
    marginBottom: 20,
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
    paddingHorizontal: 8,
  },
  detailLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    lineHeight: 16,
    color: '#666666',
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  trackOrderButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  trackOrderButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
  },
  trackOrderButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});

export default OrderSuccessScreen;
