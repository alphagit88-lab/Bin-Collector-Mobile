import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {fonts} from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';

// Import SVG images
import Logo14_1 from '../assets/images/14_1.svg';
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Group14 from '../assets/images/Group 14.svg';
import Icon20_1 from '../assets/images/20 1.svg';

const {width} = Dimensions.get('window');

interface BinItem {
  binType: string;
  binSize: string;
}

const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();

  // Payment form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  // Sample added bins data
  const addedBins: BinItem[] = [
    {binType: 'General Waste', binSize: '6m³ - Medium'},
    {binType: 'Concrete/Dirt', binSize: '6m³ - Medium'},
  ];

  const handleConfirmOrder = () => {
    // Handle order confirmation
    console.log('Order confirmed');
    // Navigate to order success screen
    (navigation as any).navigate('OrderSuccess', {
      orderDetails: {
        binType: addedBins[0]?.binType || 'General Waste',
        binSize: addedBins[0]?.binSize || '6m³ - Medium',
        deliveryDate: '15/01/2026',
        deliveryTime: '9:00 AM - 12:00 PM',
        collectionDate: '22/01/2026',
        collectionTime: '9:00 AM - 12:00 PM',
      },
    });
  };

  const handleDeleteOrder = () => {
    // Handle order deletion
    console.log('Order deleted');
    // Navigate back to dashboard or show confirmation
    navigation.goBack();
  };

  const handleClearBin = (index: number) => {
    // Handle bin clearing
    console.log('Clear bin at index:', index);
  };

  const handleViewBin = (index: number) => {
    // Handle bin view
    console.log('View bin at index:', index);
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
              <View style={styles.headerLogoContainer}>
                <Logo14_1 width={148} height={63} />
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

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Confirm Your Order Title */}
          <Text style={styles.sectionTitle}>Confirm Your Order</Text>
          <Text style={styles.sectionSubtitle}>
            Review your order details before confirming
          </Text>

          {/* Added Bins Section */}
          <View style={styles.addedBinsSection}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.addedBinsSectionGradient}>
              <Text style={styles.addedBinsTitle}>Added Bins</Text>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Bin Type</Text>
                <Text style={styles.tableHeaderText}>Bin Size/Capacity</Text>
                <Text style={[styles.tableHeaderText, styles.actionHeader]}>
                  Action
                </Text>
              </View>

              {/* Table Rows */}
              {addedBins.map((bin, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{bin.binType}</Text>
                  <Text style={styles.tableCell}>{bin.binSize}</Text>
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleClearBin(index)}>
                      <Text style={styles.clearButtonText}>Clear</Text>
                      <Group14 width={14.24} height={14.24} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => handleViewBin(index)}>
                      <Text style={styles.viewButtonText}>View</Text>
                      <View style={styles.arrowIconContainer}>
                        <Icon20_1 width={11} height={12} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </LinearGradient>
          </View>

          {/* Payment Information Section */}
          <View style={styles.paymentSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.paymentSectionGradient}>
              <Text style={styles.paymentTitle}>Payment Information</Text>

              {/* Card Number */}
              <View style={styles.formField}>
                <Text style={styles.formFieldLabel}>Card Number</Text>
                <View style={styles.formFieldInputContainer}>
                  <TextInput
                    style={styles.formFieldInput}
                    placeholder="1234 5678 1234 5678"
                    placeholderTextColor="#979897"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="numeric"
                    maxLength={19}
                  />
                </View>
              </View>

              {/* Expiry Date and CVC Row */}
              <View style={styles.rowContainer}>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.formFieldLabel}>Expiry Date</Text>
                  <View style={styles.formFieldInputContainer}>
                    <TextInput
                      style={styles.formFieldInput}
                      placeholder="MM/YY"
                      placeholderTextColor="#979897"
                      value={expiryDate}
                      onChangeText={setExpiryDate}
                      maxLength={5}
                    />
                  </View>
                </View>
                <View style={[styles.formField, styles.halfField]}>
                  <Text style={styles.formFieldLabel}>CVC</Text>
                  <View style={styles.formFieldInputContainer}>
                    <TextInput
                      style={styles.formFieldInput}
                      placeholder="231"
                      placeholderTextColor="#979897"
                      value={cvc}
                      onChangeText={setCvc}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                    />
                  </View>
                </View>
              </View>

              {/* Name on Card */}
              <View style={styles.formField}>
                <Text style={styles.formFieldLabel}>Name on Card</Text>
                <View style={styles.formFieldInputContainer}>
                  <TextInput
                    style={styles.formFieldInput}
                    placeholder="Harper Russo"
                    placeholderTextColor="#979897"
                    value={nameOnCard}
                    onChangeText={setNameOnCard}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {/* Delete Order Button */}
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={handleDeleteOrder}>
              <View style={styles.deleteButtonContent}>
                <Text style={styles.deleteButtonText}>Delete Order</Text>
                <Group14 width={25} height={25} />
              </View>
            </TouchableOpacity>

            {/* Confirm Order Button */}
            <TouchableOpacity
              style={styles.confirmButton}
              activeOpacity={0.8}
              onPress={handleConfirmOrder}>
              <LinearGradient
                colors={['#29B554', '#6EAD16']}
                start={{x: 0.22, y: 0}}
                end={{x: 0.7, y: 1}}
                style={styles.confirmButtonGradient}>
                <Text style={styles.confirmButtonText}>
                  Confirm & Place Order
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
  headerLogoContainer: {
    marginTop: -10,
  },
  headerImageContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 210,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  binCollectOverlay: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    opacity: 0.34,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 16,
  },
  addedBinsSection: {
    marginBottom: 8,
    borderRadius: 9,
    overflow: 'hidden',
  },
  addedBinsSectionGradient: {
    padding: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addedBinsTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    textAlign: 'center',
    color: '#242424',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  tableHeaderText: {
    flex: 1,
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  actionHeader: {
    textAlign: 'center',
    flex: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableCell: {
    flex: 1,
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  actionButtonsContainer: {
    flex: 0.8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 9,
    paddingVertical: 2.685,
    height: 19.37,
    width: 63.76,
    gap: 4,
  },
  clearButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 24,
    paddingHorizontal: 8.02,
    paddingVertical: 3,
    height: 19,
    width: 57,
    gap: 4,
  },
  viewButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#2C2525',
  },
  arrowIconContainer: {
    transform: [{rotate: '90deg'}],
  },
  paymentSection: {
    marginBottom: 8,
    borderRadius: 9,
    overflow: 'hidden',
  },
  paymentSectionGradient: {
    padding: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  paymentTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    textAlign: 'center',
    color: '#242424',
    marginBottom: 18,
  },
  formField: {
    marginBottom: 16,
  },
  formFieldLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  formFieldInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  formFieldInput: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#242424',
    padding: 0,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  deleteButton: {
    flex: 0.4,
    borderRadius: 12,
    backgroundColor: '#2C2C2C',
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#E5E5E5',
  },
  confirmButton: {
    flex: 0.6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default OrderConfirmationScreen;
