import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
  Keyboard,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { Ionicons } from '@expo/vector-icons';
import toast from '../utils/toast';
import AppModal from '../components/AppModal';
import AttachmentOptionModal from '../components/AttachmentOptionModal';

// Import SVG images
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Icon4_1 from '../assets/images/4 1.svg';
import Icon28_1_Residential from '../assets/images/28 1.svg';
import Icon28_2_Commercial from '../assets/images/28 2.svg';
import Group101 from '../assets/images/Group 101.svg';

const { width } = Dimensions.get('window');

interface FormFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  isDropdown?: boolean;
  customIcon?: React.ReactNode;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
  style?: any;
}

const FormField: React.FC<FormFieldProps & { onPress?: () => void }> = ({
  label,
  placeholder,
  value,
  onChangeText,
  isDropdown = false,
  customIcon,
  onPress,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  style,
}) => (
  <TouchableOpacity
    activeOpacity={isDropdown ? 0.7 : 1}
    onPress={isDropdown ? onPress : undefined}
    style={[styles.formField, style]}>
    {label ? <Text style={styles.formFieldLabel}>{label}</Text> : null}
    <View style={styles.formFieldInputContainer}>
      <TextInput
        style={[styles.formFieldInput, multiline && { height: 80, textAlignVertical: 'top' }]}
        placeholder={placeholder}
        placeholderTextColor="#979897"
        value={value}
        onChangeText={onChangeText}
        editable={!isDropdown}
        pointerEvents={isDropdown ? 'none' : 'auto'}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
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
  id: string | number;
  name: string;
}

interface BinSize {
  id: string | number;
  size: string;
  bin_type_id: string | number;
}

interface ServiceCategory {
  id: number;
  name: string;
}

const SupplierCreateOrderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceType, setServiceType] = useState('residential'); // 'residential', 'commercial', 'service'
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);

  // Dates
  const [deliveryDate, setDeliveryDate] = useState(''); // YYYY-MM-DD
  const [pickupDate, setPickupDate] = useState('');     // YYYY-MM-DD
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [deliveryDateObj, setDeliveryDateObj] = useState(new Date());
  const [pickupDateObj, setPickupDateObj] = useState(new Date());

  // Bins Selection
  const [bins, setBins] = useState([
    {
      bin_type_id: '',
      bin_type_name: '',
      bin_size_id: '',
      bin_size_name: '',
      quantity: '1',
      price: '',
    },
  ]);
  const [activeBinIndex, setActiveBinIndex] = useState(0);
  const [binTypes, setBinTypes] = useState<BinType[]>([]);
  const [binSizesMap, setBinSizesMap] = useState<Record<number, BinSize[]>>({});
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [sizeModalVisible, setSizeModalVisible] = useState(false);

  // Service Mode
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [totalPrice, setTotalPrice] = useState('');
  const [fetchingCategories, setFetchingCategories] = useState(false);

  // Map
  const [mapRegion, setMapRegion] = useState({
    latitude: 45.4215, // Default Ottawa
    longitude: -75.6972,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [binPrices, setBinPrices] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [fetchingSettings, setFetchingSettings] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [typesRes, sizesRes, categoriesRes, settingsRes] = await Promise.all([
        api.get('/bins/supplier/types') as any,
        api.get('/bins/supplier/sizes') as any,
        api.get(ENDPOINTS.SERVICES.CATEGORIES) as any,
        api.get('/settings') as any,
      ]);

      if (typesRes.success && typesRes.data) {
        setBinTypes(typesRes.data.binTypes);
      }
      if (sizesRes.success && sizesRes.data) {
        const sizes = sizesRes.data.binSizes;
        const map: Record<number, BinSize[]> = {};
        sizes.forEach((s: BinSize) => {
          const typeId = parseInt(s.bin_type_id as string);
          if (!map[typeId]) map[typeId] = [];
          map[typeId].push(s);
        });
        setBinSizesMap(map);
      }
      if (categoriesRes.success && categoriesRes.data) {
        setServiceCategories(categoriesRes.data.categories);
      }
      if (settingsRes.success && settingsRes.data) {
        const settingsMap: Record<string, string> = {};
        settingsRes.data.settings.forEach((s: any) => {
          settingsMap[s.key] = s.value;
        });
        setSystemSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFetchingSettings(false);
    }
  };

  useEffect(() => {
    // Update individual bin prices when binPrices (from location) changes
    if (binPrices.length > 0) {
      const updatedBins = bins.map(bin => {
        if (bin.bin_size_id) {
          const priceObj = binPrices.find(p => p.bin_size_id === parseInt(bin.bin_size_id));
          if (priceObj) {
            return { ...bin, price: priceObj.admin_final_price.toString() };
          }
        }
        return bin;
      });
      setBins(updatedBins);
    }
  }, [binPrices]);

  const handleSearchAddress = async () => {
    if (!deliveryAddress) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)}&format=json&limit=1&countrycodes=ca`,
        { headers: { 'User-Agent': 'BinRentalApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLon = parseFloat(data[0].lon);
        setLatitude(newLat);
        setLongitude(newLon);
        setDeliveryAddress(data[0].display_name);
        setMapRegion(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
        fetchBinPrices(newLat, newLon);
      } else {
        toast.error('Location not found', 'Please try a more specific address.');
      }
    } catch (error) {
      toast.error('Search Error', 'Failed to search address.');
    } finally {
      setIsSearching(false);
    }
  };

  const onMarkerDragEnd = async (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setLatitude(newLat);
    setLongitude(newLon);
    setMapRegion(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLon}&format=json`,
        { headers: { 'User-Agent': 'BinRentalApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) setDeliveryAddress(data.display_name);
      fetchBinPrices(newLat, newLon);
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const fetchBinPrices = async (lat: number, lon: number) => {
    try {
      const response = await api.get(`${ENDPOINTS.BINS.PRICES}?lat=${lat}&lon=${lon}`) as any;
      if (response.success && response.data) {
        setBinPrices(response.data.prices);
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const formatDateForDisplay = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const onDeliveryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDeliveryPicker(false);
    if (selectedDate) {
      setDeliveryDateObj(selectedDate);
      setDeliveryDate(selectedDate.toISOString().split('T')[0]);
      if (selectedDate > pickupDateObj) {
        setPickupDateObj(selectedDate);
        setPickupDate(selectedDate.toISOString().split('T')[0]);
      }
    }
  };

  const onPickupDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPickupPicker(false);
    if (selectedDate) {
      setPickupDateObj(selectedDate);
      setPickupDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  const addBin = () => {
    setBins([...bins, { bin_type_id: '', bin_type_name: '', bin_size_id: '', bin_size_name: '', quantity: '1', price: '' }]);
  };

  const removeBin = (index: number) => {
    if (bins.length > 1) {
      const newBins = [...bins];
      newBins.splice(index, 1);
      setBins(newBins);
    }
  };

  const updateBin = (index: number, data: any) => {
    const newBins = [...bins];
    newBins[index] = { ...newBins[index], ...data };
    setBins(newBins);
  };

  const openTypeModal = (index: number) => {
    setActiveBinIndex(index);
    setTypeModalVisible(true);
  };

  const openSizeModal = (index: number) => {
    setActiveBinIndex(index);
    setSizeModalVisible(true);
  };

  const selectBinType = (type: BinType) => {
    updateBin(activeBinIndex, {
      bin_type_id: type.id.toString(),
      bin_type_name: type.name,
      bin_size_id: '',
      bin_size_name: '',
    });
    setTypeModalVisible(false);
  };

  const selectBinSize = (size: BinSize) => {
    const updatedData: any = {
      bin_size_id: size.id.toString(),
      bin_size_name: size.size,
    };

    // Auto-populate price
    const priceObj = binPrices.find(p => p.bin_size_id === size.id);
    if (priceObj) {
      updatedData.price = priceObj.admin_final_price.toString();
    }

    updateBin(activeBinIndex, updatedData);
    setSizeModalVisible(false);
  };

  const toggleService = (id: number) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

  const pickImage = async () => {
    setAttachmentModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setAttachments(prev => [...prev, ...result.assets]);
    }
  };

  const takePhoto = async () => {
    setAttachmentModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAttachments(prev => [...prev, ...result.assets]);
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const calculateBreakdown = () => {
    if (!deliveryDate || !pickupDate) return null;

    const start = deliveryDateObj;
    const end = pickupDateObj;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const commercialLimit = systemSettings['commercial_duration_limit'];
    const residentialLimit = systemSettings['residential_duration_limit'];
    const dailyRateStr = systemSettings['additional_day_charge'];

    if (!commercialLimit || !residentialLimit || !dailyRateStr) return null;

    const limitDays = serviceType === 'commercial' ? parseInt(commercialLimit) : parseInt(residentialLimit);
    const dailyRate = parseFloat(dailyRateStr);

    const exceededDays = durationDays > limitDays ? durationDays - limitDays : 0;
    const additionalCharge = exceededDays * dailyRate;

    const basePrice = bins.reduce((acc, b) => {
      return acc + (parseFloat(b.price || '0') * (parseInt(b.quantity) || 1));
    }, 0);

    return {
      durationDays,
      limitDays,
      exceededDays,
      dailyRate,
      additionalCharge,
      basePrice,
      total: basePrice + additionalCharge
    };
  };

  const breakdown = calculateBreakdown();

  const handleSubmit = async () => {
    if (!customerName || !customerPhone || !deliveryAddress || !deliveryDate || !pickupDate) {
      toast.error('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('customer_name', customerName);
      formData.append('customer_phone', customerPhone);
      formData.append('service_category', serviceType);

      if (serviceType === 'service') {
        if (selectedServices.length === 0) {
          toast.error('Validation Error', 'Please select at least one service');
          setLoading(false);
          return;
        }
        formData.append('selected_services', JSON.stringify(selectedServices));
        formData.append('total_price', totalPrice || '0');
      } else {
        const validBins = bins.filter(b => b.bin_type_id);
        if (validBins.length === 0) {
          toast.error('Validation Error', 'Please select at least one bin');
          setLoading(false);
          return;
        }
        formData.append('bins', JSON.stringify(validBins.map(b => ({
          bin_type_id: parseInt(b.bin_type_id),
          bin_size_id: b.bin_size_id ? parseInt(b.bin_size_id) : null,
          quantity: parseInt(b.quantity) || 1,
          price: b.price || '0',
        }))));
      }

      formData.append('location', deliveryAddress);
      formData.append('start_date', deliveryDate);
      formData.append('end_date', pickupDate);
      formData.append('instructions', notes);
      if (poNumber) formData.append('po_number', poNumber);
      if (latitude) formData.append('latitude', latitude.toString());
      if (longitude) formData.append('longitude', longitude.toString());
      formData.append('payment_method', 'cash');

      if (attachments.length > 0) {
        attachments.forEach((att, index) => {
          const uri = att.uri;
          const fileType = uri.split('.').pop();
          formData.append('attachments', {
            uri,
            name: `upload_${index}.${fileType}`,
            type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
          } as any);
        });
      }

      const response = await api.post('/bookings/supplier/create', formData) as any;
      if (response.success) {
        toast.success('Success', 'Order created successfully');
        navigation.navigate('SupplierJobs');
      } else {
        toast.error('Error', response.message || 'Failed to create order');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Error', 'An unexpected error occurred');
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
                <Text style={styles.headerTitle}>Create Order</Text>
                <Text style={styles.headerSubtitle}>Assign order to customer</Text>
              </View>
              <View style={styles.headerIconsWrapper}>
                <HeaderActionIcons useWhiteWrapper />
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
          <View style={styles.pendingHeader}>
            <Text style={styles.pendingTitle}>Order Information</Text>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>Back</Text>
              <View style={styles.backArrowContainer}>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrowText}>→</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.dividerLine} />

          {/* Section: Customer Details */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <Text style={styles.paymentMethodTitle}>Customer Details*</Text>
              <FormField
                label="Customer Name"
                placeholder="Enter customer name"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <FormField
                label="Mobile Number"
                placeholder="Enter mobile number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.helperText}>Order will be assigned to this customer.</Text>
            </LinearGradient>
          </View>

          {/* Section: Service Type */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <Text style={styles.paymentMethodTitle}>Select Category*</Text>
              <View style={styles.paymentOptionsContainer}>
                {['residential', 'commercial', 'service'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.paymentOption, { width: (width - 70) / 3 }]}
                    activeOpacity={0.8}
                    onPress={() => setServiceType(type)}>
                    <LinearGradient
                      colors={serviceType === type ? ['#C0F96F', '#90B93E'] : ['#F3FFE2', '#E5EFD1']}
                      style={styles.paymentOptionGradient}>
                      <View style={styles.paymentOptionContent}>
                        <View style={styles.paymentIconContainer}>
                          {type === 'residential' && <Icon28_1_Residential width={50} height={40} />}
                          {type === 'commercial' && <Icon28_2_Commercial width={57} height={45} />}
                          {type === 'service' && <Ionicons name="construct" size={40} color={serviceType === 'service' ? '#373934' : '#90B93E'} />}
                        </View>
                        <Text style={[styles.paymentOptionText, serviceType === type && styles.paymentOptionTextActive]}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Section: Bins Selection */}
          {serviceType !== 'service' && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <Text style={styles.formSectionTitleSmall}>Bins*</Text>
                {bins.map((bin, index) => (
                  <View key={index} style={[styles.binFormContainer, index > 0 && { marginTop: 12 }]}>
                    <LinearGradient colors={['#EFF2F0', '#F8FFEE']} style={styles.binFormGradient}>
                      {bins.length > 1 && (
                        <TouchableOpacity style={styles.removeBinButton} onPress={() => removeBin(index)}>
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      <FormField
                        label="Bin Type*"
                        placeholder="Select Type"
                        value={bin.bin_type_name}
                        onChangeText={() => { }}
                        isDropdown
                        onPress={() => openTypeModal(index)}
                      />
                      {(!bin.bin_type_id || (binSizesMap[parseInt(bin.bin_type_id)] && binSizesMap[parseInt(bin.bin_type_id)].length > 0)) && (
                        <FormField
                          label="Bin Size*"
                          placeholder={bin.bin_type_id ? "Select Size" : "Select Type First"}
                          value={bin.bin_size_name}
                          onChangeText={() => { }}
                          isDropdown
                          onPress={() => openSizeModal(index)}
                        />
                      )}
                      <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                          <FormField
                            label="Quantity*"
                            placeholder="1"
                            value={bin.quantity}
                            onChangeText={(val) => updateBin(index, { quantity: val })}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
                <TouchableOpacity style={styles.addBinButton} onPress={addBin}>
                  <LinearGradient colors={['#29B554', '#6EAD16']} style={styles.addBinButtonGradient}>
                    <Text style={styles.addBinButtonText}>+ Add More Bin</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Section: Service Selection */}
          {serviceType === 'service' && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <Text style={styles.formSectionTitleSmall}>Select Services*</Text>
                <View style={styles.servicesGrid}>
                  {serviceCategories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.serviceCheckboxItem, selectedServices.includes(category.id) && styles.serviceCheckboxItemActive]}
                      onPress={() => toggleService(category.id)}>
                      <Ionicons
                        name={selectedServices.includes(category.id) ? "checkbox" : "square-outline"}
                        size={24}
                        color={selectedServices.includes(category.id) ? "#29B554" : "#90B93E"}
                      />
                      <Text style={[styles.serviceCheckboxLabel, selectedServices.includes(category.id) && styles.serviceCheckboxLabelActive]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FormField
                  label="Description*"
                  placeholder="Additional service details..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
                <FormField
                  label="Total Price ($)*"
                  placeholder="e.g. 500"
                  value={totalPrice}
                  onChangeText={setTotalPrice}
                  keyboardType="numeric"
                />
              </LinearGradient>
            </View>
          )}


          {/* Section: Location & Schedule */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Location*"
                    placeholder="Enter Delivery Address"
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                  />
                </View>
                <TouchableOpacity style={styles.searchButton} onPress={handleSearchAddress} disabled={isSearching}>
                  <LinearGradient colors={['#29B554', '#6EAD16']} style={styles.searchButtonGradient}>
                    {isSearching ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="search" size={20} color="#FFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={mapRegion}>
                  {latitude !== null && longitude !== null && (
                    <Marker coordinate={{ latitude, longitude }} draggable onDragEnd={onMarkerDragEnd} />
                  )}
                </MapView>
                <Text style={styles.mapHint}>Drag pin to refine location</Text>
              </View>

              <FormField
                label="Start Date*"
                placeholder="Select Start Date"
                value={deliveryDate ? formatDateForDisplay(deliveryDateObj) : ""}
                onChangeText={() => { }}
                isDropdown
                onPress={() => setShowDeliveryPicker(true)}
                customIcon={<Group101 width={20} height={20} />}
              />
              <FormField
                label="End Date*"
                placeholder="Select End Date"
                value={pickupDate ? formatDateForDisplay(pickupDateObj) : ""}
                onChangeText={() => { }}
                isDropdown
                onPress={() => setShowPickupPicker(true)}
                customIcon={<Group101 width={20} height={20} />}
              />
            </LinearGradient>
          </View>

          {/* Section: Instructions & Attachments */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              {serviceType !== 'service' && (
                <>
                  <Text style={styles.instructionsLabel}>Instructions</Text>
                  <View style={styles.notesContainer}>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add special instructions"
                      placeholderTextColor="#979897"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                  <FormField
                    label="PO Number (Optional)"
                    placeholder="Enter PO Number"
                    value={poNumber}
                    onChangeText={setPoNumber}
                  />
                </>
              )}

              <Text style={styles.instructionsLabel}>Upload Attachments (Optional)</Text>
              <View style={styles.multiAttachmentContainer}>
                {attachments.map((att, index) => (
                  <View key={index} style={styles.attachmentThumbnail}>
                    <Image source={{ uri: att.uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity style={styles.removeThumbnailButton} onPress={() => removeAttachment(index)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {attachments.length < 10 && (
                  <TouchableOpacity style={styles.addAttachmentSquare} onPress={() => setAttachmentModalVisible(true)}>
                    <Ionicons name="add" size={32} color="#979897" />
                    <Text style={styles.addAttachmentText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </LinearGradient>
          </View>

          {/* Price Breakdown */}
          {serviceType !== 'service' && breakdown && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <Text style={[styles.formSectionTitleSmall, { marginBottom: 12, color: '#29B554' }]}>Price Breakdown Summary</Text>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Base Price ({breakdown.limitDays} Days):</Text>
                  <Text style={styles.summaryValueSmall}>${breakdown.basePrice.toFixed(2)}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelSmall}>Duration:</Text>
                  <Text style={styles.summaryValueSmall}>{breakdown.durationDays} Day(s)</Text>
                </View>

                {breakdown.exceededDays > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabelSmall, { color: '#EF4444' }]}>Extra Days ({breakdown.exceededDays} × ${breakdown.dailyRate}):</Text>
                    <Text style={[styles.summaryValueSmall, { color: '#EF4444' }]}>+${breakdown.additionalCharge.toFixed(2)}</Text>
                  </View>
                )}

                <View style={[styles.dividerLine, { marginVertical: 10 }]} />

                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabelSmall, { fontFamily: fonts.family.bold, fontSize: 18 }]}>Estimated Total:</Text>
                  <Text style={[styles.summaryValueSmall, { color: '#29B554', fontSize: 22 }]}>
                    ${breakdown.total.toFixed(2)}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity style={[styles.placeOrderButton, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={['#29B554', '#6EAD16']} style={styles.placeOrderButtonGradient}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.placeOrderButtonText}>Create Order</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Date Pickers */}
      {showDeliveryPicker && (
        <DateTimePicker
          value={deliveryDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDeliveryDateChange}
          minimumDate={new Date()}
        />
      )}
      {showPickupPicker && (
        <DateTimePicker
          value={pickupDateObj}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickupDateChange}
          minimumDate={deliveryDateObj}
        />
      )}

      {/* Selection Modals */}
      <AppModal visible={typeModalVisible} onClose={() => setTypeModalVisible(false)} title="Select Bin Type">
        <ScrollView style={{ maxHeight: 400 }}>
          {binTypes.map(type => (
            <TouchableOpacity key={type.id} style={styles.modalItem} onPress={() => selectBinType(type)}>
              <Text style={styles.modalItemText}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppModal>

      <AppModal visible={sizeModalVisible} onClose={() => setSizeModalVisible(false)} title="Select Bin Size">
        <ScrollView style={{ maxHeight: 400 }}>
          {(binSizesMap[parseInt(bins[activeBinIndex]?.bin_type_id)] || []).map(size => (
            <TouchableOpacity key={size.id} style={styles.modalItem} onPress={() => selectBinSize(size)}>
              <Text style={styles.modalItemText}>{size.size}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppModal>

      <AttachmentOptionModal
        visible={attachmentModalVisible}
        onClose={() => setAttachmentModalVisible(false)}
        onTakePhoto={takePhoto}
        onChooseGallery={pickImage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  headerBanner: { width: '100%', height: 241, overflow: 'hidden' },
  headerBannerGradient: { flex: 1, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 19, paddingTop: 20 },
  headerTextContainer: { flex: 1 },
  headerTitle: { fontFamily: fonts.family.bold, fontSize: 26, lineHeight: 28, color: '#FFFFFF' },
  headerSubtitle: { fontFamily: fonts.family.regular, fontSize: 16, color: '#FFFFFF', marginTop: 4 },
  headerIconsWrapper: { zIndex: 10 },
  headerImageContainer: { position: 'absolute', bottom: 0, right: 0 },
  binCollectOverlay: { position: 'absolute', bottom: 10, left: 10, opacity: 0.2 },
  contentContainer: { paddingHorizontal: 19, marginTop: 10 },
  sectionTitle: { fontFamily: fonts.family.semiBold, fontSize: 18, color: '#373934', marginBottom: 10 },
  dividerLine: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },
  formSection: { marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  formSectionGradient: { padding: 16 },
  formField: { marginBottom: 16 },
  formFieldLabel: { fontFamily: fonts.family.medium, fontSize: 14, color: '#373934', marginBottom: 8 },
  formFieldInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', paddingHorizontal: 12 },
  formFieldInput: { flex: 1, height: 45, fontFamily: fonts.family.regular, fontSize: 14, color: '#373934' },
  dropdownIcon: { marginLeft: 8 },
  dropdownIconText: { fontSize: 12, color: '#979897' },
  paymentMethodTitle: { fontFamily: fonts.family.bold, fontSize: 16, color: '#373934', marginBottom: 15 },
  paymentOptionsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 5 },
  paymentOption: { height: 100, borderRadius: 12, overflow: 'hidden' },
  paymentOptionGradient: { flex: 1, padding: 10, justifyContent: 'center', alignItems: 'center' },
  paymentOptionContent: { alignItems: 'center' },
  paymentIconContainer: { height: 45, justifyContent: 'center', marginBottom: 5 },
  paymentOptionText: { fontFamily: fonts.family.medium, fontSize: 12, color: '#90B93E' },
  paymentOptionTextActive: { color: '#373934' },
  binFormContainer: { borderRadius: 12, overflow: 'hidden' },
  binFormGradient: { padding: 12 },
  removeBinButton: { position: 'absolute', top: 5, right: 5, zIndex: 5 },
  addBinButton: { marginTop: 10, width: 140, height: 35, alignSelf: 'flex-end', borderRadius: 17.5, overflow: 'hidden' },
  addBinButtonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addBinButtonText: { fontFamily: fonts.family.bold, fontSize: 12, color: '#FFFFFF' },
  formSectionTitleSmall: { fontFamily: fonts.family.bold, fontSize: 15, color: '#373934', marginBottom: 12 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 },
  serviceCheckboxItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', minWidth: '45%' },
  serviceCheckboxItemActive: { borderColor: '#29B554', backgroundColor: '#F0FDF4' },
  serviceCheckboxLabel: { marginLeft: 8, fontFamily: fonts.family.medium, fontSize: 13, color: '#373934' },
  serviceCheckboxLabelActive: { color: '#166534' },
  searchButton: { marginBottom: 16 },
  searchButtonGradient: { height: 45, width: 45, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mapContainer: { height: 180, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  map: { flex: 1 },
  mapHint: { position: 'absolute', bottom: 10, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 10 },
  instructionsLabel: { fontFamily: fonts.family.bold, fontSize: 15, color: '#373934', marginBottom: 10 },
  notesContainer: { backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB', padding: 12, minHeight: 100 },
  notesInput: { fontFamily: fonts.family.regular, fontSize: 14, color: '#373934', textAlignVertical: 'top' },
  multiAttachmentContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  attachmentThumbnail: { width: 70, height: 70, borderRadius: 8, overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%' },
  removeThumbnailButton: { position: 'absolute', top: 2, right: 2 },
  addAttachmentSquare: { width: 70, height: 70, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#979897', justifyContent: 'center', alignItems: 'center' },
  addAttachmentText: { fontSize: 10, color: '#979897', marginTop: 2 },
  placeOrderButton: { marginTop: 20, borderRadius: 12, overflow: 'hidden' },
  placeOrderButtonGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  placeOrderButtonText: { fontFamily: fonts.family.bold, fontSize: 18, color: '#FFFFFF' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingHorizontal: 20 },
  modalItemText: { fontFamily: fonts.family.medium, fontSize: 16, color: '#373934' },
  helperText: { fontFamily: fonts.family.regular, fontSize: 12, color: '#6B7280', marginTop: 4 },
  row: { flexDirection: 'row' },
  miniLabel: { fontFamily: fonts.family.medium, fontSize: 12, color: '#373934', marginBottom: 4 },
  priceText: { fontFamily: fonts.family.bold, fontSize: 16, color: '#29B554' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabelSmall: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#4B5563',
  },
  summaryValueSmall: {
    fontFamily: fonts.family.semiBold,
    fontSize: 15,
    color: '#1F2937',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    transform: [{ rotate: '180deg' }],
  },
});

export default SupplierCreateOrderScreen;
