import React, { useState, useEffect } from 'react';
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
import MapView, { Marker, MapPressEvent, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { Ionicons } from '@expo/vector-icons';
import toast from '../utils/toast';
import AppModal from '../components/AppModal';
import AttachmentOptionModal from '../components/AttachmentOptionModal';

// Import SVG images
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
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
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
}) => (
  <TouchableOpacity
    activeOpacity={isDropdown ? 0.7 : 1}
    onPress={isDropdown ? onPress : undefined}
    style={styles.formField}>
    <Text style={styles.formFieldLabel}>{label}</Text>
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
  id: number;
  name: string;
}

interface BinSize {
  id: number;
  bin_type_id: number;
  size: string;
}

interface PriceConfig {
  bin_size_id: number;
  admin_final_price: string;
}

interface ServiceCategory {
  id: number;
  name: string;
  description: string;
}

const OrderBinScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>(
    'online',
  );
  const [serviceType, setServiceType] = useState<'residential' | 'commercial' | 'service'>(
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
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: -37.8136, // Default to Melbourne (generic)
    longitude: 144.9631,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSizes, setFetchingSizes] = useState(false);
  const [binPrices, setBinPrices] = useState<PriceConfig[]>([]);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [customerBudget, setCustomerBudget] = useState('');
  const [fetchingCategories, setFetchingCategories] = useState(false);

  // Date Picker State
  const [showDeliveryPicker, setShowDeliveryPicker] = useState(false);
  const [showPickupPicker, setShowPickupPicker] = useState(false);
  const [deliveryDateObj, setDeliveryDateObj] = useState(new Date());
  const [pickupDateObj, setPickupDateObj] = useState(new Date(Date.now() + 86400000)); // Default to tomorrow
  const hasValidCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const formatDateForBackend = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString();
  };

  const handleSearchAddress = async () => {
    if (!deliveryAddress) return;

    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          deliveryAddress
        )}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'BinRentalApp/1.0',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);

        setLatitude(newLat);
        setLongitude(newLon);
        setDeliveryAddress(display_name);
        setMapRegion(prev => ({
          ...prev,
          latitude: newLat,
          longitude: newLon,
        }));
      } else {
        toast.error('Address not found. Please try a more specific address.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search address. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const onMarkerDragEnd = async (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setLatitude(newLat);
    setLongitude(newLon);

    setMapRegion(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLon,
    }));

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLon}&format=json`,
        {
          headers: {
            'User-Agent': 'BinRentalApp/1.0',
          },
        }
      );
      const data = await response.json();
      if (data && data.display_name) {
        setDeliveryAddress(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const fetchBinPrices = async (lat: number, lon: number) => {
    setFetchingPrices(true);
    try {
      const response = await api.get<{ prices: PriceConfig[] }>(`${ENDPOINTS.BINS.PRICES}?lat=${lat}&lon=${lon}`);
      if (response.success && response.data) {
        setBinPrices(response.data.prices);
        if (response.data.prices.length === 0 && response.message) {
          toast.info('Availability', response.message);
        }
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setFetchingPrices(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude) {
      fetchBinPrices(latitude, longitude);
    }
  }, [latitude, longitude]);

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


  const loadDefaultLocation = React.useCallback(async () => {
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
  }, []);

  const fetchBinTypes = React.useCallback(async () => {
    try {
      const response = await api.get<{ binTypes: BinType[] }>(`${ENDPOINTS.BINS.TYPES}?t=${Date.now()}`);
      if (response.success && response.data) {
        setBinTypes(response.data.binTypes);
      }
    } catch (error) {
      console.error('Error fetching bin types:', error);
    }
  }, []);

  const fetchServiceCategories = React.useCallback(async () => {
    setFetchingCategories(true);
    // Clear existing to show loading/fresh state if needed
    setServiceCategories([]);
    try {
      const response = await api.get<{ categories: ServiceCategory[] }>(`${ENDPOINTS.SERVICES.CATEGORIES}?t=${Date.now()}`);
      if (response.success && response.data) {
        setServiceCategories(response.data.categories);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
    } finally {
      setFetchingCategories(false);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const routeParams = route.params;
      const hasRepeatData = Boolean(routeParams?.repeatData);

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
      setAttachments([]);
      setPoNumber('');
      setBinSizesMap({});
      setSelectedServices([]);
      setCustomerBudget('');

      // Keep repeat-order location intact; default location should only apply on fresh orders.
      if (!hasRepeatData) {
        loadDefaultLocation();
      }
      fetchBinTypes();
      fetchServiceCategories();

      // Handle Repeat Order if repeatData is passed in params
      if (routeParams?.repeatData) {
        const data = routeParams.repeatData;
        const repeatLat = parseFloat(String(data.latitude));
        const repeatLon = parseFloat(String(data.longitude));
        const hasRepeatCoordinates = Number.isFinite(repeatLat) && Number.isFinite(repeatLon);

        setServiceType(data.service_category || 'residential');
        setDeliveryAddress(data.location || '');
        setLatitude(hasRepeatCoordinates ? repeatLat : null);
        setLongitude(hasRepeatCoordinates ? repeatLon : null);
        setContactNumber(data.contact_number || '');
        setAdditionalContact(data.contact_email || '');
        setNotes(data.instructions || '');
        setPoNumber(data.po_number || '');
        
        if (hasRepeatCoordinates) {
          setMapRegion(prev => ({
            ...prev,
            latitude: repeatLat,
            longitude: repeatLon,
          }));
        }

        // Handle bins if it's a bin order
        if (data.orderItems && data.orderItems.length > 0) {
           setBins(data.orderItems.map((item: any) => ({
             bin_type_id: item.bin_type_id?.toString() || '',
             bin_type_name: item.bin_type_name || '',
             bin_size_id: item.bin_size_id?.toString() || '',
             bin_size_name: item.bin_size || '',
             quantity: item.quantity?.toString() || '1',
           })));
        } else if (data.binType) {
           setBins([{
             bin_type_id: '', // We don't have ID in some legacy mock formats
             bin_type_name: data.binType,
             bin_size_id: '',
             bin_size_name: data.binSize,
             quantity: '1',
           }]);
        }
      }
    }, [user, loadDefaultLocation, fetchBinTypes, fetchServiceCategories, route.params])
  );


  const toggleService = (id: number) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };


  const fetchBinSizes = async (typeId: number) => {
    if (binSizesMap[typeId]) return;
    setFetchingSizes(true);
    try {
      const response = await api.get<{ binSizes: BinSize[] }>(`${ENDPOINTS.BINS.SIZES(typeId)}&t=${Date.now()}`);
      if (response.success && response.data) {
        setBinSizesMap((prev) => ({ ...prev, [typeId]: response?.data?.binSizes ?? [] }));
      }
    } catch (error) {
      console.error('Error fetching bin sizes:', error);
    } finally {
      setFetchingSizes(false);
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
      bin_size_id: size.id.toString(),
      bin_size_name: size.size,
    });
    setSizeModalVisible(false);
  };

  const onDeliveryDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDeliveryPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeliveryDateObj(selectedDate);
      setDeliveryDate(formatDateForBackend(selectedDate));

      // If pickup date is before delivery date, move it to same day
      if (pickupDateObj < selectedDate) {
        setPickupDateObj(selectedDate);
        setPickupDate(formatDateForBackend(selectedDate));
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAttachments(prev => [...prev, ...result.assets]);
    }
  };

  const takePhoto = async () => {
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
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachmentPress = () => {
    setAttachmentModalVisible(true);
  };

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!deliveryAddress.trim()) {
      toast.error('Error', 'Please enter a delivery address');
      return;
    }

    let validBins: any[] = [];
    if (serviceType !== 'service') {
      validBins = bins.filter(b => {
        if (!b.bin_type_id) return false;
        const typeIdNum = parseInt(b.bin_type_id as string);
        const possibleSizes = binSizesMap[typeIdNum] || [];
        const sizeRequired = possibleSizes.length > 0;
        return !sizeRequired || b.bin_size_id;
      });

      if (validBins.length === 0) {
        toast.error('Error', 'Please add at least one valid bin selection');
        return;
      }
    } else {
      if (selectedServices.length === 0) {
        toast.error('Error', 'Please select at least one service');
        return;
      }
      if (!customerBudget.trim()) {
        toast.error('Error', 'Please enter your budget');
        return;
      }
    }

    if (!deliveryDate || !pickupDate) {
      toast.error('Error', 'Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      let finalLat = latitude;
      let finalLon = longitude;

      // Auto-geocode if coordinates are missing
      if (!finalLat || !finalLon) {
        try {
          const geoResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(deliveryAddress)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'BinRentalApp/1.0' } }
          );
          const geoData = await geoResponse.json();
          if (geoData && geoData.length > 0) {
            finalLat = parseFloat(geoData[0].lat);
            finalLon = parseFloat(geoData[0].lon);
          }
        } catch (e) {
          console.error('Auto-geocoding failed:', e);
        }
      }

      const formData = new FormData();
      formData.append('service_category', serviceType);
      if (serviceType === 'service') {
        formData.append('selected_services', JSON.stringify(selectedServices));
        formData.append('estimated_price', customerBudget);
      } else {
        formData.append('bins', JSON.stringify(validBins.map(b => ({
          bin_type_id: parseInt(b.bin_type_id as string),
          bin_size_id: b.bin_size_id ? parseInt(b.bin_size_id as string) : null,
          quantity: parseInt(b.quantity) || 1,
        }))));
      }
      formData.append('location', deliveryAddress);
      formData.append('start_date', deliveryDate);
      formData.append('end_date', pickupDate);
      formData.append('payment_method', paymentMethod);
      formData.append('contact_number', contactNumber);
      formData.append('contact_email', additionalContact);
      formData.append('instructions', notes);
      formData.append('po_number', poNumber);
      if (finalLat !== null && finalLat !== undefined) formData.append('latitude', finalLat.toString());
      if (finalLon !== null && finalLon !== undefined) formData.append('longitude', finalLon.toString());

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

      const response = await api.post(ENDPOINTS.BOOKINGS.CREATE, formData) as any;

      if (response.success) {
        const bookingData = response.data.booking || response.data.request;
        
        if (!bookingData) {
            console.error('Booking data missing from response:', response.data);
            toast.error('Error', 'Failed to retrieve booking information');
            setLoading(false);
            return;
        }

        if (paymentMethod === 'online') {
          toast.success('Success', 'Order placed. Payment will be requested after a supplier accepts.');
        } else {
          toast.success('Success', 'Your order has been placed successfully!');
        }
        navigation.navigate('Bookings' as never);
      } else {
        toast.error('Sorry', response.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Error', 'Something went wrong while placing your order');
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
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
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
                      <BinCollect2 width={181} height={70} opacity={0.3} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Commercial Option */}
                <TouchableOpacity
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
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
                      <BinCollect2 width={176} height={68} opacity={0.3} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Service Option */}
                <TouchableOpacity
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
                  activeOpacity={0.8}
                  onPress={() => setServiceType('service')}>
                  <LinearGradient
                    colors={
                      serviceType === 'service'
                        ? ['#C0F96F', '#90B93E']
                        : ['#F3FFE2', '#E5EFD1']
                    }
                    locations={[0.2009, 0.7847]}
                    start={{ x: 0.27, y: 0 }}
                    end={{ x: 0.73, y: 1 }}
                    style={styles.paymentOptionGradient}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Ionicons name="construct" size={40} color={serviceType === 'service' ? '#373934' : '#90B93E'} />
                      </View>
                      <Text
                        style={[
                          styles.paymentOptionText,
                          serviceType === 'service' &&
                          styles.paymentOptionTextActive,
                        ]}>
                        Service
                      </Text>
                    </View>
                    <View style={styles.binCollectPaymentOverlay}>
                      <BinCollect2 width={171} height={65} opacity={0.3} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>

          {/* Section 2: Bin Selection */}
          {serviceType !== 'service' && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <View style={styles.binSectionHeader}>
                  <Text style={styles.formSectionTitleSmall}>Bins *</Text>
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
                      {(!bin.bin_type_id || (bin.bin_type_id && (binSizesMap[parseInt(bin.bin_type_id as string)] === undefined || binSizesMap[parseInt(bin.bin_type_id as string)].length > 0))) && (
                        <FormField
                          label="Bin Size*"
                          placeholder={bin.bin_type_id ? "Select Bin Size" : "Select Type First"}
                          value={bin.bin_size_name}
                          onChangeText={() => { }}
                          isDropdown
                          onPress={() => openSizeModal(index)}
                        />
                      )}
                      <FormField
                        label="Quantity*"
                        placeholder="Enter Quantity"
                        value={bin.quantity}
                        onChangeText={(val) => updateBin(index, { quantity: val })}
                      />
                    </LinearGradient>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.addBinButton, { marginTop: 10, width: 140, height: 35, alignSelf: 'flex-end' }]}
                  activeOpacity={0.7}
                  onPress={addBin}>
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    locations={[0.2227, 0.7018]}
                    start={{ x: 0.7, y: 0 }}
                    end={{ x: 0, y: 0.8 }}
                    style={styles.addBinButtonGradient}>
                    <Text style={styles.addBinButtonText}>+ Add More Bin</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}

          {/* Section 2: Service Selection (Conditional) */}
          {serviceType === 'service' && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <View style={styles.binSectionHeader}>
                  <Text style={styles.formSectionTitleSmall}>Select Services *</Text>
                </View>

                {fetchingCategories ? (
                  <ActivityIndicator size="small" color="#29B554" style={{ marginVertical: 20 }} />
                ) : (
                  <View style={styles.servicesGrid}>
                    {serviceCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.serviceCheckboxItem,
                          selectedServices.includes(category.id) && styles.serviceCheckboxItemActive
                        ]}
                        onPress={() => toggleService(category.id)}>
                        <Ionicons
                          name={selectedServices.includes(category.id) ? "checkbox" : "square-outline"}
                          size={24}
                          color={selectedServices.includes(category.id) ? "#29B554" : "#90B93E"}
                        />
                        <Text style={[
                          styles.serviceCheckboxLabel,
                          selectedServices.includes(category.id) && styles.serviceCheckboxLabelActive
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <FormField
                  label="Description*"
                  placeholder="Tell us what you need..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <FormField
                  label="Price (Your Budget - $)*"
                  placeholder="e.g. 500"
                  value={customerBudget}
                  onChangeText={setCustomerBudget}
                  keyboardType="numeric"
                />
              </LinearGradient>
            </View>
          )}

          {/* Section 3: Delivery Details */}
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
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={handleSearchAddress}
                  disabled={isSearching}
                >
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.searchButtonGradient}
                  >
                    {isSearching ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="search" size={20} color="#FFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
                  onRegionChangeComplete={(region) =>
                    setMapRegion(prev => ({
                      ...prev,
                      latitudeDelta: region.latitudeDelta,
                      longitudeDelta: region.longitudeDelta,
                    }))
                  }
                >
                  {hasValidCoordinates && (
                    <Marker
                      coordinate={{ latitude, longitude }}
                      draggable
                      onDragEnd={onMarkerDragEnd}
                      title="Delivery Location"
                      description="Drag to refine"
                    />
                  )}
                </MapView>
                <Text style={styles.mapHint}>Drag the pin to refine your exact location</Text>
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
                  minimumDate={deliveryDateObj}
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
          {serviceType !== 'service' && <View style={styles.formSection}>
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
              <View style={{ marginTop: 10 }}>
                <FormField
                  label="PO Number (Optional)"
                  placeholder="Enter Purchase Order Number"
                  value={poNumber}
                  onChangeText={setPoNumber}
                />
              </View>
            </LinearGradient>
          </View>}

          {/* Section: Upload Attachment */}
          <View style={styles.formSection}>
            <LinearGradient
              colors={['#EFF2F0', '#F8FFEE']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0.34, y: 0 }}
              end={{ x: 0.66, y: 1 }}
              style={styles.formSectionGradient}>
              <Text style={styles.instructionsLabel}>Upload Attachments (Optional)</Text>
              <View style={styles.multiAttachmentContainer}>
                {attachments.map((att, index) => (
                  <View key={index} style={styles.attachmentThumbnail}>
                    <Image source={{ uri: att.uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.removeThumbnailButton}
                      onPress={() => removeAttachment(index)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                {attachments.length < 10 && (
                  <TouchableOpacity
                    style={styles.addAttachmentSquare}
                    onPress={handleAttachmentPress}>
                    <Ionicons name="add" size={32} color="#979897" />
                    <Text style={styles.addAttachmentText}>Add</Text>
                  </TouchableOpacity>
                )}
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

          {/* Order Summary / Estimated Total */}
          {bins.some(b => b.bin_size_id) && (
            <View style={styles.formSection}>
              <LinearGradient
                colors={['#EFF2F0', '#F8FFEE']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0.34, y: 0 }}
                end={{ x: 0.66, y: 1 }}
                style={styles.formSectionGradient}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Estimated Total:</Text>
                  <Text style={styles.summaryValue}>
                    ${bins.reduce((acc, b) => {
                      const price = binPrices.find(p => p.bin_size_id.toString() === b.bin_size_id)?.admin_final_price;
                      return acc + (parseFloat(price || '0') * (parseInt(b.quantity) || 1));
                    }, 0).toFixed(2)}
                  </Text>
                </View>
                {fetchingPrices && <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 5 }} />}
              </LinearGradient>
            </View>
          )}

          {/* Place Order Button */}
          <TouchableOpacity
            style={styles.placeOrderButton}
            activeOpacity={0.8}
            onPress={handlePlaceOrder}
            disabled={loading || fetchingSizes}>
            <LinearGradient
              colors={['#29B554', '#6EAD16']}
              start={{ x: 0.22, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={[styles.placeOrderButtonGradient, (loading || fetchingSizes) && { opacity: 0.7 }]}>
              {loading || fetchingSizes ? (
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
      <AppModal
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
      </AppModal>

      {/* Bin Size Selection Modal */}
      <AppModal
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
                  onPress={() => selectBinSize(size)}
                  style={styles.optionItem}
                >
                  <Text style={[styles.optionText, bins[activeBinIndex]?.bin_size_id === size.id.toString() && styles.selectedOptionText]}>
                    {size.size}
                  </Text>
                  {binPrices.some(p => p.bin_size_id === size.id) && (
                    <Text style={styles.optionPrice}>
                      ${binPrices.find(p => p.bin_size_id === size.id)?.admin_final_price}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              {(!bins[activeBinIndex]?.bin_type_id || !binSizesMap[parseInt(bins[activeBinIndex]?.bin_type_id)]?.length) && (
                <Text style={styles.noDataText}>No sizes available for this type</Text>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  headerIconsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 5,
    zIndex: 2,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontFamily: fonts.family.semiBold,
    fontSize: 18,
    color: '#373934',
  },
  summaryValue: {
    fontFamily: fonts.family.bold,
    fontSize: 22,
    color: '#111827',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionPrice: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: themeColors.primary,
  },
  noDataText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  multiAttachmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  attachmentThumbnail: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'visible',
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  removeThumbnailButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addAttachmentSquare: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  addAttachmentText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    color: '#979897',
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
    color: '#373934',
    textAlignVertical: 'top',
    padding: 12,
  },
  attachmentButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 56,
    justifyContent: 'center',
  },
  attachmentButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  attachmentPlaceholderText: {
    fontFamily: fonts.family.light,
    fontSize: 16,
    color: '#979897',
    marginLeft: 12,
  },
  selectedAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  previewImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  attachmentTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#373934',
    flex: 1,
  },
  removeAttachmentText: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#EF4444',
    marginLeft: 10,
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
  optionText: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#414141',
  },
  selectedOptionText: {
    color: '#9AD346',
    fontFamily: fonts.family.semiBold,
  },
  removeBinButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
  },
  searchButton: {
    height: 46,
    width: 46,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  searchButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  map: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    fontSize: 10,
    color: '#6EAD16',
    textAlign: 'center',
    marginTop: 5,
    fontFamily: fonts.family.medium,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  serviceCheckboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FFE2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5EFD1',
    width: (width - 60) / 2 - 10,
    gap: 8,
  },
  serviceCheckboxItemActive: {
    backgroundColor: '#C0F96F',
    borderColor: '#90B93E',
  },
  serviceCheckboxLabel: {
    fontSize: 12,
    color: '#373934',
    fontFamily: fonts.family.medium,
    flex: 1,
  },
  serviceCheckboxLabelActive: {
    color: '#373934',
    fontFamily: fonts.family.bold,
  },
});

export default OrderBinScreen;
