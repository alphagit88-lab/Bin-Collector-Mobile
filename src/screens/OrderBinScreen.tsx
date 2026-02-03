import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BottomNavBar from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ActivityIndicator, Platform } from 'react-native';

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

const { width } = Dimensions.get('window');

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isDropdown?: boolean;
  customIcon?: React.ReactNode;
}

const FormField: React.FC<FormFieldProps & { onPress?: () => void }> = ({
  label,
  placeholder,
  value,
  onChangeText,
  isDropdown = false,
  customIcon,
  onPress,
}) => (
  <TouchableOpacity
    activeOpacity={isDropdown ? 0.7 : 1}
    onPress={isDropdown ? onPress : undefined}
    style={styles.formField}>
    <Text style={styles.formFieldLabel}>{label}</Text>
    <View style={styles.formFieldInputContainer}>
      <TextInput
        style={styles.formFieldInput}
        placeholder={placeholder}
        placeholderTextColor="#979897"
        value={value}
        onChangeText={onChangeText}
        editable={!isDropdown}
        pointerEvents={isDropdown ? 'none' : 'auto'}
      />
      {customIcon && <View style={styles.dropdownIcon}>{customIcon}</View>}
      {isDropdown && !customIcon && (
        <View style={styles.dropdownIcon}>
          <Text style={styles.dropdownIconText}>▼</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

interface BinType {
  id: number;
  name: string;
}

interface BinSize {
  id: number;
  bin_type_id: number;
  size: string;
}

const OrderBinScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>(
    'online',
  );
  const [serviceType, setServiceType] = useState<'residential' | 'commercial'>(
    'residential',
  );

  // Form state
  const [quantity, setQuantity] = useState('1');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [additionalContact, setAdditionalContact] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Date Picker State
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [deliveryDateObj, setDeliveryDateObj] = useState(new Date());
  const [pickupDateObj, setPickupDateObj] = useState(new Date(Date.now() + 86400000)); // Default to tomorrow

  const formatDateForBackend = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString();
  };

  // Dropdown data
  const [binTypes, setBinTypes] = useState<BinType[]>([]);
  const [binSizesMap, setBinSizesMap] = useState<Record<number, BinSize[]>>({});
  const [bins, setBins] = useState([
    {
      bin_type_id: '',
      bin_type_name: '',
      bin_size_id: '',
      bin_size_name: '',
      quantity: '1',
    },
  ]);
  const [activeBinIndex, setActiveBinIndex] = useState(0);

  // Modals
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);


  const addBin = () => {
    setBins([
      ...bins,
      {
        bin_type_id: '',
        bin_type_name: '',
        bin_size_id: '',
        bin_size_name: '',
        quantity: '1',
      },
    ]);
  };

  const removeBin = (index: number) => {
    if (bins.length > 1) {
      setBins(bins.filter((_, i) => i !== index));
    }
  };

  const updateBin = (index: number, updates: Record<string, any>) => {
    setBins((prevBins) => {
      const newBins = [...prevBins];
      newBins[index] = { ...newBins[index], ...updates };

      // If updating bin type, automatically reset size
      if (updates.bin_type_id !== undefined) {
        newBins[index].bin_size_id = '';
        newBins[index].bin_size_name = '';
      }

      return newBins;
    });
  };

  // For backward compatibility and fixing the ReferenceError
  const binType = bins[0].bin_type_name;
  const binSize = bins[0].bin_size_name;
  const setBinType = (val: string) => updateBin(0, { bin_type_name: val });
  const setBinSize = (val: string) => updateBin(0, { bin_size_name: val });

  useFocusEffect(
    React.useCallback(() => {
      // Reset form on focus
      setPaymentMethod('online');
      setServiceType('residential');
      setBins([
        {
          bin_type_id: '',
          bin_type_name: '',
          bin_size_id: '',
          bin_size_name: '',
          quantity: '1',
        },
      ]);
      setDeliveryDate('');
      setPickupDate('');
      setContactNumber(user?.phone || '');
      setAdditionalContact(user?.email || '');
      setNotes('');
      setBinSizesMap({});

      loadDefaultLocation();
      fetchBinTypes();
    }, [user])
  );

  const loadDefaultLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem('defaultLocation');
      if (savedLocation) {
        setDeliveryAddress(savedLocation);
      } else {
        setDeliveryAddress('');
      }
    } catch (error) {
      console.error('Error loading default location:', error);
    }
  };

  const fetchBinTypes = async () => {
    try {
      const response = await api.get<{ binTypes: BinType[] }>(ENDPOINTS.BINS.TYPES);
      if (response.success && response.data) {
        setBinTypes(response.data.binTypes);
      }
    } catch (error) {
      console.error('Error fetching bin types:', error);
    }
  };

  const fetchBinSizes = async (typeId: number) => {
    if (binSizesMap[typeId]) return;
    try {
      const response = await api.get<{ binSizes: BinSize[] }>(ENDPOINTS.BINS.SIZES(typeId));
      if (response.success && response.data) {
        setBinSizesMap((prev) => ({ ...prev, [typeId]: response?.data?.binSizes ?? [] }));
      }
    } catch (error) {
      console.error('Error fetching bin sizes:', error);
    }
  };

  const openTypeModal = (index: number) => {
    setActiveBinIndex(index);
    setTypeModalVisible(true);
  };

  const openSizeModal = (index: number) => {
    const bin = bins[index];
    if (bin.bin_type_id) {
      setActiveBinIndex(index);
      fetchBinSizes(parseInt(bin.bin_type_id));
      setSizeModalVisible(true);
    }
  };

  const selectBinType = (type: BinType) => {
    updateBin(activeBinIndex, {
      bin_type_id: type.id,
      bin_type_name: type.name,
    });
    setTypeModalVisible(false);
    fetchBinSizes(type.id);
  };

  const selectBinSize = (size: BinSize) => {
    updateBin(activeBinIndex, {
      bin_size_id: size.id,
      bin_size_name: size.size,
    });
    setSizeModalVisible(false);
  };

  const onDeliveryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDeliveryPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeliveryDateObj(selectedDate);
      setDeliveryDate(formatDateForBackend(selectedDate));

      // If pickup date is before or same as delivery date, move it to next day
      if (pickupDateObj <= selectedDate) {
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setPickupDateObj(nextDay);
        setPickupDate(formatDateForBackend(nextDay));
      }
    }
  };

  const onPickupDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPickupPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPickupDateObj(selectedDate);
      setPickupDate(formatDateForBackend(selectedDate));
    }
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    const validBins = bins.filter(b => b.bin_type_id && b.bin_size_id);
    if (validBins.length === 0) {
      Alert.alert('Error', 'Please add at least one valid bin (Type & Size)');
      return;
    }

    if (!deliveryDate || !pickupDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        service_category: serviceType,
        bins: validBins.map(b => ({
          bin_type_id: parseInt(b.bin_type_id),
          bin_size_id: parseInt(b.bin_size_id),
          quantity: parseInt(b.quantity) || 1,
        })),
        location: deliveryAddress,
        start_date: deliveryDate,
        end_date: pickupDate,
        payment_method: paymentMethod,
        contact_number: contactNumber,
        contact_email: additionalContact,
        instructions: notes,
      };

      const response = await api.post(ENDPOINTS.BOOKINGS.CREATE, payload);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your order has been placed successfully!',
          [{ text: 'OK', onPress: () => navigation.navigate('Bookings' as never) }]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Something went wrong while placing your order');
    } finally {
      setLoading(false);
    }
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
            start={{ x: 0.22, y: 0 }}
            end={{ x: 0.7, y: 1 }}
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
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
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
                    start={{ x: 0.27, y: 0 }}
                    end={{ x: 0.73, y: 1 }}
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
                    start={{ x: 0.27, y: 0 }}
                    end={{ x: 0.73, y: 1 }}
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
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <View style={styles.binSectionHeader}>
                <Text style={styles.formSectionTitleSmall}>Bins *</Text>
                <TouchableOpacity
                  style={styles.addBinButton}
                  activeOpacity={0.7}
                  onPress={addBin}>
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    locations={[0.2227, 0.7018]}
                    start={{ x: 0.7, y: 0 }}
                    end={{ x: 0, y: 0.8 }}
                    style={styles.addBinButtonGradient}>
                    <AddBinIcon width={79} height={14} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {bins.map((bin, index) => (
                <View key={index} style={[styles.binFormContainer, index > 0 && { marginTop: 12 }]}>
                  <LinearGradient
                    colors={['#EFF2F0', '#F8FFEE']}
                    locations={[0.2377, 0.6629]}
                    start={{ x: 0.34, y: 0 }}
                    end={{ x: 0.66, y: 1 }}
                    style={styles.binFormGradient}>
                    {bins.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeBinButton}
                        onPress={() => removeBin(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    <FormField
                      label="Bin Type*"
                      placeholder="Select Bin Type"
                      value={bin.bin_type_name}
                      onChangeText={() => { }}
                      isDropdown
                      onPress={() => openTypeModal(index)}
                    />
                    <FormField
                      label="Bin Size*"
                      placeholder={bin.bin_type_id ? "Select Bin Size" : "Select Type First"}
                      value={bin.bin_size_name}
                      onChangeText={() => { }}
                      isDropdown
                      onPress={() => openSizeModal(index)}
                    />
                    <FormField
                      label="Quantity*"
                      placeholder="Enter Quantity"
                      value={bin.quantity}
                      onChangeText={(val) => updateBin(index, { quantity: val })}
                    />
                  </LinearGradient>
                </View>
              ))}
            </LinearGradient>
          </View>

          {/* Section 3: Delivery Details */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <FormField
                label="Location*"
                placeholder="Enter Delivery Address"
                value={deliveryAddress}
                onChangeText={setDeliveryAddress}
              />
              <FormField
                label="Start Date*"
                placeholder="Select Start Date"
                value={deliveryDate ? formatDateForDisplay(deliveryDateObj) : ""}
                onChangeText={() => { }}
                isDropdown
                onPress={() => setShowDeliveryPicker(true)}
                customIcon={<Group101 width={20} height={20} />}
              />
              {showDeliveryPicker && (
                <DateTimePicker
                  value={deliveryDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDeliveryDateChange}
                  minimumDate={new Date()}
                />
              )}
              <FormField
                label="End date*"
                placeholder="Select End Date"
                value={pickupDate ? formatDateForDisplay(pickupDateObj) : ""}
                onChangeText={() => { }}
                isDropdown
                onPress={() => setShowPickupPicker(true)}
                customIcon={<Group101 width={20} height={20} />}
              />
              {showPickupPicker && (
                <DateTimePicker
                  value={pickupDateObj}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onPickupDateChange}
                  minimumDate={new Date(deliveryDateObj.getTime() + 86400000)}
                />
              )}
            </LinearGradient>
          </View>

          {/* Section 4: Contact Details */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
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
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
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
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
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
                    start={{ x: 0.27, y: 0 }}
                    end={{ x: 0.73, y: 1 }}
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
                    start={{ x: 0.27, y: 0 }}
                    end={{ x: 0.73, y: 1 }}
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
              start={{ x: 0.22, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.placeOrderButtonGradient}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.placeOrderButtonText}>Next</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="orderBin" />

      {/* Bin Type Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={typeModalVisible}
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setTypeModalVisible(false)}
        >
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setTypeModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Bin Type</Text>
            <ScrollView style={styles.optionsList}>
              {binTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.optionItem}
                  onPress={() => selectBinType(type)}
                >
                  <Text style={[styles.optionText, bins[activeBinIndex]?.bin_type_id === type.id.toString() && styles.selectedOptionText]}>{type.name}</Text>
                </TouchableOpacity>
              ))}
              {binTypes.length === 0 && <Text style={styles.noDataText}>No bin types available</Text>}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bin Size Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={sizeModalVisible}
        onRequestClose={() => setSizeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSizeModalVisible(false)}
        >
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setSizeModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Bin Size</Text>
            <ScrollView style={styles.optionsList}>
              {binSizesMap[parseInt(bins[activeBinIndex]?.bin_type_id)]?.map((size) => (
                <TouchableOpacity
                  key={size.id}
                  style={styles.optionItem}
                  onPress={() => selectBinSize(size)}
                >
                  <Text style={[styles.optionText, bins[activeBinIndex]?.bin_size_id === size.id.toString() && styles.selectedOptionText]}>{size.size}</Text>
                </TouchableOpacity>
              ))}
              {(!bins[activeBinIndex]?.bin_type_id || !binSizesMap[parseInt(bins[activeBinIndex]?.bin_type_id)]?.length) && (
                <Text style={styles.noDataText}>No sizes available for this type</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
    shadowOffset: { width: 0, height: 2 },
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
    shadowOffset: { width: 0, height: 2 },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    color: '#373934',
    marginBottom: 20,
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  optionsList: {
    width: '100%',
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#414141',
  },
  selectedOptionText: {
    color: '#9AD346',
    fontFamily: fonts.family.semiBold,
  },
  noDataText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#979897',
    textAlign: 'center',
    marginTop: 20,
  },
  removeBinButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
  },
});

export default OrderBinScreen;
