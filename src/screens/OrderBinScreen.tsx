import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {fonts} from '../theme/fonts';
import {themeColors} from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';

// Import SVG images
import Logo14_1 from '../assets/images/14_1.svg';
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Icon4_1 from '../assets/images/4 1.svg';
import Icon28_1 from '../assets/images/28 1 (1).svg';
import Icon28_2 from '../assets/images/28 2 (1).svg';
import Icon28_1_Residential from '../assets/images/28 1.svg';
import Icon28_2_Commercial from '../assets/images/28 2.svg';
import Group101 from '../assets/images/Group 101.svg';
import AddBinIcon from '../assets/images/+ Add Bin.svg';

const {width} = Dimensions.get('window');

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isDropdown?: boolean;
  customIcon?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  isDropdown = false,
  customIcon,
}) => (
  <View style={styles.formField}>
    <Text style={styles.formFieldLabel}>{label}</Text>
    <View style={styles.formFieldInputContainer}>
      <TextInput
        style={styles.formFieldInput}
        placeholder={placeholder}
        placeholderTextColor="#979897"
        value={value}
        onChangeText={onChangeText}
      />
      {customIcon && <View style={styles.dropdownIcon}>{customIcon}</View>}
      {isDropdown && !customIcon && (
        <View style={styles.dropdownIcon}>
          <Text style={styles.dropdownIconText}>▼</Text>
        </View>
      )}
    </View>
  </View>
);

const OrderBinScreen: React.FC = () => {
  const navigation = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>(
    'online',
  );
  const [serviceType, setServiceType] = useState<'residential' | 'commercial'>(
    'residential',
  );

  // Form state
  const [binType, setBinType] = useState('');
  const [binSize, setBinSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [notes, setNotes] = useState('');

  const handlePlaceOrder = () => {
    // Navigate to order confirmation screen
    navigation.navigate('OrderConfirmation' as never);
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
              <Icon4_1 width={428} height={177} />
            </View>
            <View style={styles.binCollectOverlay}>
              <BinCollect2 width={200} height={100} />
            </View>
          </LinearGradient>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Order a Bin Title */}
          <Text style={styles.sectionTitle}>Order a Bin</Text>

          {/* Divider Line */}
          <View style={styles.dividerLine} />

          {/* Section 1: Service Type */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <Text style={styles.paymentMethodTitle}>
                Select Service Category*
              </Text>

              <View style={styles.paymentOptionsContainer}>
                {/* Residential Option */}
                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => setServiceType('residential')}>
                  <LinearGradient
                    colors={
                      serviceType === 'residential'
                        ? ['#C0F96F', '#90B93E']
                        : ['#F3FFE2', '#E5EFD1']
                    }
                    locations={[0.2009, 0.7847]}
                    start={{x: 0.27, y: 0}}
                    end={{x: 0.73, y: 1}}
                    style={styles.paymentOptionGradient}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Icon28_1_Residential width={50} height={40} />
                      </View>
                      <Text
                        style={[
                          styles.paymentOptionText,
                          serviceType === 'residential' &&
                            styles.paymentOptionTextActive,
                        ]}>
                        Residential
                      </Text>
                    </View>
                    <View style={styles.binCollectPaymentOverlay}>
                      <BinCollect2 width={181} height={70} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Commercial Option */}
                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => setServiceType('commercial')}>
                  <LinearGradient
                    colors={
                      serviceType === 'commercial'
                        ? ['#C0F96F', '#90B93E']
                        : ['#F3FFE2', '#E5EFD1']
                    }
                    locations={[0.2009, 0.7847]}
                    start={{x: 0.27, y: 0}}
                    end={{x: 0.73, y: 1}}
                    style={styles.paymentOptionGradient}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Icon28_2_Commercial width={57} height={45} />
                      </View>
                      <Text
                        style={[
                          styles.paymentOptionText,
                          serviceType === 'commercial' &&
                            styles.paymentOptionTextActive,
                        ]}>
                        Commercial
                      </Text>
                    </View>
                    <View style={styles.binCollectPaymentOverlay}>
                      <BinCollect2 width={176} height={68} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Section 2: Bin Selection */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <View style={styles.binSectionHeader}>
                <Text style={styles.formSectionTitleSmall}>Bins *</Text>
                <TouchableOpacity
                  style={styles.addBinButton}
                  activeOpacity={0.7}>
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    locations={[0.2227, 0.7018]}
                    start={{x: 0.7, y: 0}}
                    end={{x: 0, y: 0.8}}
                    style={styles.addBinButtonGradient}>
                    <AddBinIcon width={79} height={14} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.binFormContainer}>
                <LinearGradient
                  colors={['#EFF2F0', '#F8FFEE']}
                  locations={[0.2377, 0.6629]}
                  start={{x: 0.34, y: 0}}
                  end={{x: 0.66, y: 1}}
                  style={styles.binFormGradient}>
                  <FormField
                    label="Bin Type*"
                    placeholder="Select Bin Type"
                    value={binType}
                    onChangeText={setBinType}
                    isDropdown
                  />
                  <FormField
                    label="Bin Size*"
                    placeholder="Select Bin Size"
                    value={binSize}
                    onChangeText={setBinSize}
                    isDropdown
                  />
                  <FormField
                    label="Quantity*"
                    placeholder="Enter Quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                  />
                </LinearGradient>
              </View>
            </LinearGradient>
          </View>

          {/* Section 3: Delivery Details */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <FormField
                label="Location*"
                placeholder="Enter Delivery Address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
              />
              <FormField
                label="Start Date"
                placeholder="mm/dd/yyyy"
                value={deliveryDate}
                onChangeText={setDeliveryDate}
                customIcon={<Group101 width={20} height={20} />}
              />
              <FormField
                label="End date"
                placeholder="mm/dd/yyyy"
                value={pickupDate}
                onChangeText={setPickupDate}
                customIcon={<Group101 width={20} height={20} />}
              />
            </LinearGradient>
          </View>

          {/* Section 4: Contact Details */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <FormField
                label="Mobile Number"
                placeholder="Enter Mobile number"
                value={contactNumber}
                onChangeText={setContactNumber}
              />
              <FormField
                label="Email Address"
                placeholder="Enter Email Address"
                value={additionalContact}
                onChangeText={setAdditionalContact}
              />
            </LinearGradient>
          </View>

          {/* Section 5: Instructions */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <Text style={styles.instructionsLabel}>Instructions</Text>
              <View style={styles.notesContainer}>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add Notes"
                  placeholderTextColor="#979897"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </LinearGradient>
          </View>

          {/* Section 6: Payment Method */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{x: 0.34, y: 0}}
              end={{x: 0.66, y: 1}}
              style={styles.formSectionGradient}>
              <Text style={styles.paymentMethodTitle}>Payment Method*</Text>

              <View style={styles.paymentOptionsContainer}>
                {/* Online Payment Option */}
                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod('online')}>
                  <LinearGradient
                    colors={
                      paymentMethod === 'online'
                        ? ['#C0F96F', '#90B93E']
                        : ['#F3FFE2', '#E5EFD1']
                    }
                    locations={[0.2009, 0.7847]}
                    start={{x: 0.27, y: 0}}
                    end={{x: 0.73, y: 1}}
                    style={styles.paymentOptionGradient}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Icon28_1 width={50} height={40} />
                      </View>
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'online' &&
                            styles.paymentOptionTextActive,
                        ]}>
                        Online Payment
                      </Text>
                    </View>
                    <View style={styles.binCollectPaymentOverlay}>
                      <BinCollect2 width={181} height={70} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Cash on Delivery Option */}
                <TouchableOpacity
                  style={styles.paymentOption}
                  activeOpacity={0.8}
                  onPress={() => setPaymentMethod('cash')}>
                  <LinearGradient
                    colors={
                      paymentMethod === 'cash'
                        ? ['#C0F96F', '#90B93E']
                        : ['#F3FFE2', '#E5EFD1']
                    }
                    locations={[0.2009, 0.7847]}
                    start={{x: 0.27, y: 0}}
                    end={{x: 0.73, y: 1}}
                    style={styles.paymentOptionGradient}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Icon28_2 width={57} height={45} />
                      </View>
                      <Text
                        style={[
                          styles.paymentOptionText,
                          paymentMethod === 'cash' &&
                            styles.paymentOptionTextActive,
                        ]}>
                        Cash on Delivery
                      </Text>
                    </View>
                    <View style={styles.binCollectPaymentOverlay}>
                      <BinCollect2 width={176} height={68} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <Text style={styles.paymentNote}>
                Payment will be processed when order is confirmed
              </Text>
            </LinearGradient>
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            style={styles.placeOrderButton}
            activeOpacity={0.8}
            onPress={handlePlaceOrder}>
            <LinearGradient
              colors={['#29B554', '#6EAD16']}
              start={{x: 0.22, y: 0}}
              end={{x: 0.7, y: 1}}
              style={styles.placeOrderButtonGradient}>
              <Text style={styles.placeOrderButtonText}>Next</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    overflow: 'hidden',
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
    left: 2,
    width: 428,
    height: 177,
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
    marginBottom: 10,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginBottom: 11,
  },
  formSection: {
    marginBottom: 6,
    borderRadius: 9,
    overflow: 'hidden',
  },
  formSectionGradient: {
    padding: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  formSectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 16,
  },
  formSectionTitleSmall: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    lineHeight: 22,
    color: '#373934',
  },
  binSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBinButton: {
    width: 122,
    height: 30,
    borderRadius: 7,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  addBinButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 7,
  },
  addBinButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  binFormContainer: {
    borderRadius: 9,
    overflow: 'hidden',
  },
  binFormGradient: {
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  formField: {
    marginBottom: 12,
  },
  formFieldLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  formFieldInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  formFieldInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 12,
    fontFamily: fonts.family.light,
    fontSize: 16,
    color: '#373934',
  },
  dropdownIcon: {
    paddingRight: 12,
  },
  dropdownIconText: {
    fontSize: 12,
    color: '#979897',
  },
  instructionsLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 96,
  },
  notesInput: {
    flex: 1,
    padding: 12,
    fontFamily: fonts.family.light,
    fontSize: 16,
    color: '#373934',
    textAlignVertical: 'top',
  },
  paymentMethodTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    lineHeight: 22,
    textAlign: 'center',
    color: '#373934',
    marginBottom: 16,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  paymentOption: {
    flex: 1,
    height: 83,
    borderRadius: 9,
    overflow: 'hidden',
  },
  paymentOptionGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  paymentOptionContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  paymentIconContainer: {
    marginBottom: 6,
  },
  paymentOptionText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    color: '#373934',
  },
  paymentOptionTextActive: {
    color: '#FFFFFF',
  },
  binCollectPaymentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentNote: {
    fontFamily: fonts.family.regular,
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: '#373934',
    marginTop: 12,
  },
  placeOrderButton: {
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  placeOrderButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  placeOrderButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
});

export default OrderBinScreen;
