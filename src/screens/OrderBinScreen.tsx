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
import * as ImageManipulator from 'expo-image-manipulator';
import * as Location from 'expo-location';

import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useStripe } from '@stripe/stripe-react-native';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { useAuth } from '../contexts/AuthContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { Ionicons } from '@expo/vector-icons';
import toast from '../utils/toast';
import AppModal from '../components/AppModal';
import AppConfirmModal from '../components/AppConfirmModal';
import AttachmentOptionModal from '../components/AttachmentOptionModal';
import { geocodeAddress, reverseGeocode } from '../utils/geocode';

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
  style?: any;
  onClear?: () => void;
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
  onClear,
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
      {value && onClear ? (
        <TouchableOpacity onPress={onClear} style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
          <Ionicons name="close-circle" size={18} color="#979897" />
        </TouchableOpacity>
      ) : null}
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
  const isOrderPlacedRef = React.useRef(false);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: 'Exit Confirmation',
    message: 'Are you sure you want to leave this screen? Your order progress will be lost.',
    confirmText: 'Leave',
    onConfirm: () => { },
    isDestructive: false,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (isOrderPlacedRef.current) {
        return;
      }
      e.preventDefault();
      setConfirmModal({
        visible: true,
        title: 'Exit Confirmation',
        message: 'Are you sure you want to leave this screen? Your order progress will be lost.',
        confirmText: 'Leave',
        isDestructive: true,
        onConfirm: () => {
          setConfirmModal(prev => ({ ...prev, visible: false }));
          isOrderPlacedRef.current = true;
          navigation.dispatch(e.data.action);
        },
      });
    });
    return unsubscribe;
  }, [navigation]);

  const handleExternalNavigation = React.useCallback((action: () => void) => {
    if (isOrderPlacedRef.current) {
      action();
      return;
    }
    setConfirmModal({
      visible: true,
      title: 'Exit Confirmation',
      message: 'Are you sure you want to leave this screen? Your order progress will be lost.',
      confirmText: 'Leave',
      isDestructive: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        isOrderPlacedRef.current = true;
        action();
      },
    });
  }, []);
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
    latitude: 43.6532, // Default to Toronto, Canada
    longitude: -79.3832,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const [isSearching, setIsSearching] = useState(false);
  const [attachments, setAttachments] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingSizes, setFetchingSizes] = useState(false);
  const [fetchingBinTypes, setFetchingBinTypes] = useState(false);
  const [binPrices, setBinPrices] = useState<PriceConfig[]>([]);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [customerBudget, setCustomerBudget] = useState('');
  const [fetchingCategories, setFetchingCategories] = useState(false);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [fetchingSettings, setFetchingSettings] = useState(true);
  const [calculatedPrice, setCalculatedPrice] = useState<any>(null);
  const [splitOrders, setSplitOrders] = useState<any[] | null>(null);
  const [assignedSupplierId, setAssignedSupplierId] = useState<string | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [fetchingCalculatedPrice, setFetchingCalculatedPrice] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState('');
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [loadingDefaultLocation, setLoadingDefaultLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

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
      const data = await geocodeAddress(deliveryAddress);

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
        // Reset bin selections when location changes
        setBins([
          {
            bin_type_id: '',
            bin_type_name: '',
            bin_size_id: '',
            bin_size_name: '',
            quantity: '1',
          },
        ]);
        setBinSizesMap({});
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

  const fetchLocationSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await geocodeAddress(query);
      setLocationSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Suggestions error:', error);
      setLocationSuggestions([]);
    }
  };

  const handleAddressChange = (text: string) => {
    setDeliveryAddress(text);

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      fetchLocationSuggestions(text);
    }, 500);

    setDebounceTimer(timer);
  };

  const handleClearAddress = () => {
    setDeliveryAddress('');
    setLatitude(null);
    setLongitude(null);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    setBins([
      {
        bin_type_id: '',
        bin_type_name: '',
        bin_size_id: '',
        bin_size_name: '',
        quantity: '1',
      },
    ]);
    setBinSizesMap({});
  };

  const selectSuggestion = (suggestion: any) => {
    const { lat, lon, display_name } = suggestion;
    const newLat = parseFloat(lat);
    const newLon = parseFloat(lon);

    setDeliveryAddress(display_name);
    setLatitude(newLat);
    setLongitude(newLon);
    setMapRegion(prev => ({
      ...prev,
      latitude: newLat,
      longitude: newLon,
    }));
    setShowSuggestions(false);
    setLocationSuggestions([]);
    Keyboard.dismiss();

    // Reset bin selections when location changes
    setBins([
      {
        bin_type_id: '',
        bin_type_name: '',
        bin_size_id: '',
        bin_size_name: '',
        quantity: '1',
      },
    ]);
    setBinSizesMap({});
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

    // Reset bin selections when location changes
    setBins([
      {
        bin_type_id: '',
        bin_type_name: '',
        bin_size_id: '',
        bin_size_name: '',
        quantity: '1',
      },
    ]);
    setBinSizesMap({});

    try {
      const data = await reverseGeocode(newLat, newLon);
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
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setFetchingPrices(false);
    }
  };

  const fetchAvailableBinTypes = async (lat: number, lon: number) => {
    setFetchingBinTypes(true);
    try {
      const response = await api.get<{ binTypes: BinType[] }>(`${ENDPOINTS.BINS.AVAILABLE_TYPES}?lat=${lat}&lon=${lon}`);

      if (response.success && response.data) {
        const binTypes = response.data.binTypes;
        setBinTypes(binTypes);

        if (
          binTypes !== null &&
          binTypes !== undefined &&
          Array.isArray(binTypes) &&
          binTypes.length === 0
        ) {
          toast.info('Availability', response.message || 'No bins available in this area');
        }
      }
    } catch (error) {
      console.error('Error fetching available bin types:', error);
    } finally {
      setFetchingBinTypes(false);
    }
  };

  const fetchAvailableBinSizes = async (lat: number, lon: number, binTypeId: number) => {
    setFetchingSizes(true);
    try {
      const response = await api.get<{ binSizes: BinSize[] }>(`${ENDPOINTS.BINS.AVAILABLE_SIZES}?lat=${lat}&lon=${lon}&binTypeId=${binTypeId}`);
      if (response.success && response.data) {
        setBinSizesMap((prev) => ({ ...prev, [binTypeId]: response?.data?.binSizes ?? [] }));
      }
    } catch (error) {
      console.error('Error fetching available bin sizes:', error);
    } finally {
      setFetchingSizes(false);
    }
  };

  const fetchCalculatedPrice = async () => {
    try {
      if (
        serviceType === 'service' ||
        !bins.some(b => b.bin_size_id) ||
        !deliveryAddress ||
        (serviceType === 'residential' && (!deliveryDate || !pickupDate))
      ) {
        setCalculatedPrice(null);
        setSplitOrders(null);
        setPriceError(null);
        return;
      }

      setFetchingCalculatedPrice(true);
      setCalculatedPrice(null);
      setSplitOrders(null);
      setAssignedSupplierId(null);
      setPriceError(null);

      const requestBody = {
        service_category: serviceType,
        bins: bins.filter(b => b.bin_size_id).map(b => ({
          bin_type_id: b.bin_type_id,
          bin_size_id: b.bin_size_id,
          quantity: b.quantity
        })),
        location: deliveryAddress,
        start_date: deliveryDate,
        end_date: pickupDate,
        latitude: latitude,
        longitude: longitude
      };

      const response = await fetch(`${API_URL}/bookings/calculate-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (result.success) {
        setCalculatedPrice(result.data);
        setSplitOrders(result.data.splits || null);
        setAssignedSupplierId(result.data.supplier_id || null);
      } else {
        console.error('Calculate price failed:', result.message);
        setPriceError(result.message || 'No suppliers available for this selection.');
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPriceError('Failed to calculate price. Please try again.');
    } finally {
      setFetchingCalculatedPrice(false);
    }
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

  useEffect(() => {
    if (latitude && longitude) {
      fetchBinPrices(latitude, longitude);
      fetchAvailableBinTypes(latitude, longitude);
    } else {
      setBinTypes([]);
      setBinSizesMap({});
    }
  }, [longitude]);

  useEffect(() => {
    fetchCalculatedPrice();
  }, [bins, deliveryAddress, deliveryDate, pickupDate, longitude, serviceType]);


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
    setLoadingDefaultLocation(true);
    try {
      //const raw = await AsyncStorage.getItem('defaultLocation');
      const raw = false;

      if (raw) {
        // ── Has a saved default location ──────────────────────────────
        try {
          const parsed = JSON.parse(raw);
          const addr = parsed.address || raw;
          const defLat = parsed.latitude ? parseFloat(String(parsed.latitude)) : null;
          const defLon = parsed.longitude ? parseFloat(String(parsed.longitude)) : null;

          setDeliveryAddress(addr);

          if (defLat !== null && defLon !== null && Number.isFinite(defLat) && Number.isFinite(defLon)) {
            setLatitude(defLat);
            setLongitude(defLon);
            setMapRegion(prev => ({ ...prev, latitude: defLat, longitude: defLon }));
          }
        } catch {
          // Legacy plain-string fallback
          setDeliveryAddress(raw);
        }
      } else {
        // ── No saved default → fall back to current GPS location ──────
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            const { latitude: gpsLat, longitude: gpsLon } = pos.coords;

            setLatitude(gpsLat);
            setLongitude(gpsLon);
            setMapRegion(prev => ({ ...prev, latitude: gpsLat, longitude: gpsLon }));

            // Reverse-geocode to get a human-readable address
            try {
              const geoData = await reverseGeocode(gpsLat, gpsLon);
              if (geoData && geoData.display_name) {
                setDeliveryAddress(geoData.display_name);
              }
            } catch {
              // Silent — map pin is placed even without a text address
            }
          } else {
            setDeliveryAddress('');
          }
        } catch (gpsError) {
          console.error('GPS location error:', gpsError);
          setDeliveryAddress('');
        }
      }
    } catch (error) {
      console.error('Error loading default location:', error);
    } finally {
      setLoadingDefaultLocation(false);
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

  const fetchSystemSettings = React.useCallback(async () => {
    setFetchingSettings(true);
    try {
      const response = await api.get<{ settings: any[] }>('/settings?includePublic=true');
      if (response.success && response.data) {
        const settingsMap: Record<string, string> = {};
        response.data.settings.forEach(s => {
          settingsMap[s.key] = s.value;
        });
        setSystemSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setFetchingSettings(false);
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

      // Keep repeat-order location intact; default location should only apply on fresh orders without existing address.
      if (!hasRepeatData && !deliveryAddress.trim()) {
        loadDefaultLocation();
      }
      fetchServiceCategories();
      fetchSystemSettings();
      fetchProjects();

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
    }, [user, fetchServiceCategories, route.params])
  );


  const toggleService = (id: number) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };




  const openTypeModal = (index: number) => {
    setActiveBinIndex(index);
    setTypeModalVisible(true);
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get<{ projects: any[] }>(ENDPOINTS.PROJECTS.MY);
      if (response.success && response.data) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const openSizeModal = (index: number) => {
    const bin = bins[index];
    if (bin.bin_type_id && latitude && longitude) {
      setActiveBinIndex(index);
      fetchAvailableBinSizes(latitude, longitude, parseInt(bin.bin_type_id));
      setSizeModalVisible(true);
    }
  };

  const selectBinType = (type: BinType) => {
    updateBin(activeBinIndex, {
      bin_type_id: type.id,
      bin_type_name: type.name,
    });
    setTypeModalVisible(false);
    if (latitude && longitude) {
      fetchAvailableBinSizes(latitude, longitude, type.id);
    }
  };

  const selectProject = (project: any) => {
    setSelectedProjectId(project.id);
    setSelectedProjectName(project.name);
    setProjectModalVisible(false);
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
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const compressedAssets = await Promise.all(
        result.assets.map(async (asset) => ({
          ...asset,
          uri: await compressImage(asset.uri),
        }))
      );
      console.log(compressedAssets)
      setAttachments(prev => [...prev, ...compressedAssets]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled) {
      const compressedAssets = await Promise.all(
        result.assets.map(async (asset) => ({
          ...asset,
          uri: await compressImage(asset.uri),
        }))
      );
      setAttachments(prev => [...prev, ...compressedAssets]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const compressImage = async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      return uri; // Fall back to original if compression fails
    }
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

    // Strict pricing settings validation
    if (serviceType !== 'service') {
      const limitKey = serviceType === 'commercial' ? 'commercial_duration_limit' : 'residential_duration_limit';
      if (!systemSettings[limitKey] || !systemSettings['additional_day_charge']) {
        toast.error('System Error', 'Pricing configuration is missing. Please contact support.');
        return;
      }
    }

    if (serviceType !== 'commercial' && (!deliveryDate || !pickupDate)) {
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
          const geoData = await geocodeAddress(deliveryAddress);
          if (geoData && geoData.length > 0) {
            finalLat = parseFloat(geoData[0].lat);
            finalLon = parseFloat(geoData[0].lon);
          }
        } catch (e) {
          console.error('Auto-geocoding failed:', e);
        }
      }

      const buildFormData = (binItems: any[], supplierId?: string | number) => {
        const fd = new FormData();
        if (supplierId) fd.append('supplier_id', supplierId.toString());
        fd.append('service_category', serviceType);
        if (serviceType === 'service') {
          fd.append('selected_services', JSON.stringify(selectedServices));
          fd.append('estimated_price', customerBudget);
        } else {
          fd.append('bins', JSON.stringify(binItems));
        }
        fd.append('location', deliveryAddress);
        if (deliveryDate) fd.append('start_date', deliveryDate);
        if (pickupDate) fd.append('end_date', pickupDate);
        if (serviceType !== 'commercial') fd.append('payment_method', paymentMethod);
        fd.append('contact_number', contactNumber);
        fd.append('contact_email', additionalContact);
        fd.append('instructions', notes);
        if (selectedProjectId && serviceType === 'commercial') fd.append('project_id', selectedProjectId.toString());
        if (poNumber) fd.append('po_number', poNumber);
        if (finalLat !== null && finalLat !== undefined) fd.append('latitude', finalLat.toString());
        if (finalLon !== null && finalLon !== undefined) fd.append('longitude', finalLon.toString());
        if (attachments.length > 0) {
          attachments.forEach((att, index) => {
            const uri = att.uri;
            const fileType = uri.split('.').pop();
            fd.append('attachments', {
              uri,
              name: `upload_${index}.${fileType}`,
              type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
            } as any);
          });
        }
        return fd;
      };

      if (splitOrders && splitOrders.length > 0) {
        // Submit each split as a separate order
        const results = await Promise.all(
          splitOrders.map(split => {
            const splitBins = split.items.map((item: any) => ({
              bin_type_id: item.bin_type_id,
              bin_size_id: item.bin_size_id,
              quantity: item.quantity,
            }));
            return api.post(ENDPOINTS.BOOKINGS.CREATE, buildFormData(splitBins, split.supplier_id)) as any;
          })
        );
        const anyFailed = results.some(r => !r.success);
        if (anyFailed) {
          toast.error('Partial Error', 'Some split orders failed. Please check your bookings.');
        } else {
          toast.success('Success', `${splitOrders.length} separated orders placed successfully!`);
          isOrderPlacedRef.current = true;
          navigation.navigate('Bookings' as never);
        }
      } else {
        const mappedBins = validBins.map(b => ({
          bin_type_id: parseInt(b.bin_type_id as string),
          bin_size_id: b.bin_size_id ? parseInt(b.bin_size_id as string) : null,
          quantity: parseInt(b.quantity) || 1,
        }));
        const response = await api.post(ENDPOINTS.BOOKINGS.CREATE, buildFormData(mappedBins, assignedSupplierId || undefined)) as any;

        if (response.success) {
          if (serviceType === 'commercial') {
            toast.success('Success', 'Your order has been placed successfully!');
          } else if (paymentMethod === 'online') {
            toast.success('Success', 'Order placed. Payment will be requested after a supplier accepts.');
          } else {
            toast.success('Success', 'Your order has been placed successfully!');
          }
          isOrderPlacedRef.current = true;
          navigation.navigate('Bookings' as never);
        } else {
          toast.error('Sorry', response.message || 'Failed to place order');
        }
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
          <View style={styles.headerBannerGradient}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Order Bin</Text>
                <Text style={styles.headerSubtitle}>
                  Track. Manage. Collect.
                </Text>
              </View>
              <View style={styles.headerIconsWrapper}>
                <HeaderActionIcons useWhiteWrapper onNavigateAction={handleExternalNavigation} />
              </View>
            </View>
            <View style={styles.headerImageContainer}>
              <Icon4_1 width={428} height={177} />
            </View>
            <View style={styles.binCollectOverlay}>
              <BinCollect2 width={200} height={100} />
            </View>
          </View>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Order a Bin Title */}
          <Text style={styles.sectionTitle}>Order a Bin</Text>

          {/* Divider Line */}
          <View style={styles.dividerLine} />

          {/* Section 0: Service Type */}
          <View style={styles.formSection}>
            <View
              style={styles.formSectionGradient}>
              <Text style={styles.paymentMethodTitle}>
                Select Service Category*
              </Text>

              <View style={styles.paymentOptionsContainer}>
                {/* Residential Option */}
                <TouchableOpacity
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
                  activeOpacity={0.8}
                  onPress={() => { setServiceType('residential'); setCalculatedPrice(null); }}>
                  <View
                    style={[
                      styles.paymentOptionGradient,
                      serviceType === 'residential'
                        ? styles.paymentOptionGradientActive
                        : styles.paymentOptionGradientInactive
                    ]}>
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
                  </View>
                </TouchableOpacity>

                {/* Commercial Option */}
                <TouchableOpacity
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
                  activeOpacity={0.8}
                  onPress={() => { setServiceType('commercial'); setCalculatedPrice(null); }}>
                  <View
                    style={[
                      styles.paymentOptionGradient,
                      serviceType === 'commercial'
                        ? styles.paymentOptionGradientActive
                        : styles.paymentOptionGradientInactive
                    ]}>
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
                  </View>
                </TouchableOpacity>

                {/* Service Option */}
                <TouchableOpacity
                  style={[styles.paymentOption, { width: (width - 70) / 3 }]}
                  activeOpacity={0.8}
                  onPress={() => { setServiceType('service'); setCalculatedPrice(null); }}>
                  <View
                    style={[
                      styles.paymentOptionGradient,
                      serviceType === 'service'
                        ? styles.paymentOptionGradientActive
                        : styles.paymentOptionGradientInactive
                    ]}>
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.paymentIconContainer}>
                        <Ionicons name="construct" size={40} color={serviceType === 'service' ? '#373934' : themeColors.primary} />
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
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Section 1: Project Assignment (Optional) */}
          {serviceType === 'commercial' && <View style={styles.formSection}>
            <View
              style={styles.formSectionGradient}>
              <Text style={[styles.paymentMethodTitle, { marginBottom: 25 }]}>
                Assign to Project (Optional)
              </Text>
              <FormField
                label=""
                placeholder={projects.length > 0 ? "Select a project" : "No projects to select"}
                value={selectedProjectName}
                onChangeText={() => { }}
                isDropdown={true}
                onPress={() => projects.length > 0 && setProjectModalVisible(true)}
                style={{ marginBottom: 0, marginTop: -10 }}
              />
            </View>
          </View>}

          {/* Section 2: Location */}
          <View style={styles.formSection}>
            <View
              style={styles.formSectionGradient}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <FormField
                    label="Location*"
                    placeholder="Enter Delivery Address"
                    value={deliveryAddress}
                    onChangeText={handleAddressChange}
                    onClear={handleClearAddress}
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <View style={styles.suggestionsDropdown}>
                      <ScrollView
                        style={{ maxHeight: 170 }}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                      >
                        {locationSuggestions.map((suggestion, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => selectSuggestion(suggestion)}
                          >
                            <Ionicons name="location-outline" size={18} color={themeColors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.suggestionText} numberOfLines={2}>
                              {suggestion.display_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.searchButton, (isSearching || loadingDefaultLocation) && { opacity: 0.6 }]}
                  onPress={handleSearchAddress}
                  disabled={isSearching || loadingDefaultLocation}
                >
                  {isSearching || loadingDefaultLocation ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="search" size={20} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  region={mapRegion}
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
              </View>
              <Text style={styles.mapHint}>Hold and move the pin</Text>
            </View>
          </View>

          {/* Section 3: Bin Selection */}
          {serviceType !== 'service' && (
            <View style={styles.formSection}>
              <View

                style={styles.formSectionGradient}>
                <View style={styles.binSectionHeader}>
                  <Text style={styles.formSectionTitleSmall}>Bins *</Text>
                </View>

                {!hasValidCoordinates ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={40} color={themeColors.primary} style={{ marginBottom: 10 }} />
                    <Text style={{ color: '#64748B', textAlign: 'center' }}>
                      Please select a location first before choosing bins
                    </Text>
                  </View>
                ) : fetchingBinTypes ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={themeColors.primary} style={{ marginBottom: 10 }} />
                    <Text style={{ color: '#64748B' }}>Getting available bin types...</Text>
                  </View>
                ) : (
                  <>
                    {bins.map((bin, index) => (
                      <View key={index} style={[styles.binFormContainer, index > 0 && { marginTop: 12 }]}>
                        <View
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
                            placeholder={binTypes.length === 0 ? "No bin types available" : "Select Bin Type"}
                            value={bin.bin_type_name}
                            onChangeText={() => { }}
                            isDropdown
                            onPress={() => binTypes.length > 0 && openTypeModal(index)}
                          />
                          {(!bin.bin_type_id || (bin.bin_type_id && (binSizesMap[parseInt(bin.bin_type_id as string)] === undefined || binSizesMap[parseInt(bin.bin_type_id as string)].length > 0))) && (
                            <FormField
                              label="Bin Size*"
                              placeholder={
                                !bin.bin_type_id
                                  ? "Select Type First"
                                  : fetchingSizes
                                    ? "Getting bin sizes..."
                                    : binSizesMap[parseInt(bin.bin_type_id as string)]?.length === 0
                                      ? "No sizes available"
                                      : "Select Bin Size"
                              }
                              value={bin.bin_size_name}
                              onChangeText={() => { }}
                              isDropdown
                              onPress={() => bin.bin_type_id && openSizeModal(index)}
                            />
                          )}
                          <FormField
                            label="Quantity*"
                            placeholder="Enter Quantity"
                            value={bin.quantity}
                            onChangeText={(val) => updateBin(index, { quantity: val })}
                          />
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={[styles.addBinButton, { marginTop: 10, width: 140, height: 35, alignSelf: 'flex-end' }]}
                      activeOpacity={0.7}
                      onPress={addBin}>
                      <Text style={styles.addBinButtonText}>+ Add More Bin</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Section 4: Service Selection (Conditional) */}
          {serviceType === 'service' && (
            <View style={styles.formSection}>
              <View

                style={styles.formSectionGradient}>
                <View style={styles.binSectionHeader}>
                  <Text style={styles.formSectionTitleSmall}>Select Services *</Text>
                </View>

                {fetchingCategories ? (
                  <ActivityIndicator size="small" color={themeColors.primary} style={{ marginVertical: 20 }} />
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
                          color={selectedServices.includes(category.id) ? themeColors.primary : "#888"}
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
              </View>
            </View>
          )}

          {/* Section 5: Dates */}
          <View style={styles.formSection}>
            <View
              style={styles.formSectionGradient}>
              <View style={styles.binSectionHeader}>
                <Text style={styles.formSectionTitleSmall}>{serviceType === 'commercial' ? 'Dates' : 'Dates *'}</Text>
              </View>
              <FormField
                label={serviceType === 'commercial' ? 'Start Date' : 'Start Date*'}
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
                label={serviceType === 'commercial' ? 'End date' : 'End date*'}
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
            </View>
          </View>

          {/* Section 4: Project & Contact Details */}
          <View style={styles.formSection}>
            <View
              style={styles.formSectionGradient}>
              <FormField
                label="Mobile Number"
                placeholder="Enter Mobile number"
                value={contactNumber}
                onChangeText={setContactNumber}
                keyboardType="phone-pad"
              />
              <FormField
                label="Email Address"
                placeholder="Enter Email Address"
                value={additionalContact}
                onChangeText={setAdditionalContact}
              />
            </View>
          </View>

          {/* Section 5: Instructions */}
          {serviceType !== 'service' && <View style={styles.formSection}>
            <View
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
            </View>
          </View>}

          {/* Section: Upload Attachment */}
          <View style={styles.formSection}>
            <View
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
                {attachments.length < 5 && (
                  <TouchableOpacity
                    style={styles.addAttachmentSquare}
                    onPress={handleAttachmentPress}>
                    <Ionicons name="add" size={32} color="#979897" />
                    <Text style={styles.addAttachmentText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Section 6: Payment Method */}
          {serviceType !== 'commercial' && (
            <View style={styles.formSection}>
              <View

                style={styles.formSectionGradient}>
                <Text style={styles.paymentMethodTitle}>Payment Method*</Text>

                <View style={styles.paymentOptionsContainer}>
                  {/* Online Payment Option */}
                  <TouchableOpacity
                    style={styles.paymentOption}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('online')}>
                    <View
                      style={[
                        styles.paymentOptionGradient,
                        paymentMethod === 'online'
                          ? styles.paymentOptionGradientActive
                          : styles.paymentOptionGradientInactive
                      ]}>
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
                    </View>
                  </TouchableOpacity>

                  {/* Cash on Delivery Option */}
                  <TouchableOpacity
                    style={styles.paymentOption}
                    activeOpacity={0.8}
                    onPress={() => setPaymentMethod('cash')}>
                    <View
                      style={[
                        styles.paymentOptionGradient,
                        paymentMethod === 'cash'
                          ? styles.paymentOptionGradientActive
                          : styles.paymentOptionGradientInactive
                      ]}>
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
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.paymentNote}>
                  Payment will be processed when order is confirmed
                </Text>
              </View>
            </View>
          )}

          {/* Order Summary / Estimated Total */}
          {serviceType !== 'service' && bins.some(b => b.bin_size_id) && deliveryAddress && (serviceType === 'commercial' || (deliveryDate && pickupDate)) && (
            <View style={styles.formSection}>
              <View

                style={styles.formSectionGradient}>

                {fetchingCalculatedPrice ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : priceError ? (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF5F5', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FC8181' }}>
                    <Text style={{ color: '#C53030', fontSize: 13, flex: 1 }}>{priceError}</Text>
                  </View>
                ) : calculatedPrice ? (
                  <>
                    {splitOrders && splitOrders.length > 0 ? (
                      <>
                        <View style={{ backgroundColor: '#FFFAF0', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F6AD55' }}>
                          <Text style={{ color: '#92400E', fontSize: 13 }}>
                            Notice: Bins are not all available from one supplier. Your request will be placed as <Text style={{ fontWeight: 'bold' }}>{splitOrders.length} separated orders</Text>.
                          </Text>
                        </View>
                        {splitOrders.map((split: any, idx: number) => (
                          <View key={idx} style={{ backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' }}>
                            <Text style={{ fontWeight: 'bold', color: '#1F2937', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 4 }}>Order {idx + 1}</Text>
                            <View style={styles.summaryRow}>
                              <Text style={[styles.summaryLabel, { fontSize: 14 }]}>Base Price:</Text>
                              <Text style={[styles.summaryValue, { fontSize: 14 }]}>${split.base_price?.toFixed(2) || '0.00'}</Text>
                            </View>
                            {serviceType !== 'commercial' && calculatedPrice.duration_days && (
                              <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontSize: 14 }]}>Duration:</Text>
                                <Text style={[styles.summaryValue, { fontSize: 14 }]}>{calculatedPrice.duration_days} Day(s)</Text>
                              </View>
                            )}
                            {serviceType !== 'commercial' && split.additional_duration_charge > 0 && (
                              <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontSize: 14, color: '#E53E3E' }]}>Extra Days - {calculatedPrice.exceeded_days} day(s):</Text>
                                <Text style={[styles.summaryValue, { fontSize: 14, color: '#E53E3E' }]}>+${split.additional_duration_charge.toFixed(2)}</Text>
                              </View>
                            )}
                            {serviceType !== 'commercial' && (
                              <>
                                <View style={styles.summaryRow}>
                                  <Text style={[styles.summaryLabel, { fontSize: 14 }]}>Subtotal:</Text>
                                  <Text style={[styles.summaryValue, { fontSize: 14 }]}>${split.subtotal?.toFixed(2) || '0.00'}</Text>
                                </View>
                                <View style={styles.summaryRow}>
                                  <Text style={[styles.summaryLabel, { fontSize: 14 }]}>GST ({calculatedPrice.gst_rate}%):</Text>
                                  <Text style={[styles.summaryValue, { fontSize: 14 }]}>${split.gst_amount?.toFixed(2) || '0.00'}</Text>
                                </View>
                                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 4 }]}>
                                  <Text style={[styles.summaryLabel, { fontWeight: 'bold' }]}>Order Total:</Text>
                                  <Text style={[styles.summaryValue, { fontWeight: 'bold' }]}>${split.total?.toFixed(2) || '0.00'}</Text>
                                </View>
                              </>
                            )}
                          </View>
                        ))}
                        <View style={[styles.dividerLine, { marginVertical: 8 }]} />
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Grand Total:</Text>
                          <Text style={[styles.summaryValue, { color: themeColors.primary }]}>${calculatedPrice.total.toFixed(2)}</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { fontSize: 16 }]}>Subtotal:</Text>
                          <Text style={[styles.summaryValue, { fontSize: 18 }]}>${calculatedPrice.subtotal.toFixed(2)}</Text>
                        </View>

                        {serviceType !== 'commercial' && calculatedPrice.duration_days && (
                          <>
                            <View style={styles.summaryRow}>
                              <Text style={[styles.summaryLabel, { fontSize: 16 }]}>Duration:</Text>
                              <Text style={[styles.summaryValue, { fontSize: 18 }]}>{calculatedPrice.duration_days} Day(s)</Text>
                            </View>

                            {calculatedPrice.additional_duration_charge > 0 && (
                              <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { fontSize: 16, color: '#E53E3E' }]}>Extra Days {calculatedPrice.exceeded_days} day(s):</Text>
                                <Text style={[styles.summaryValue, { fontSize: 18, color: '#E53E3E' }]}>+${calculatedPrice.additional_duration_charge.toFixed(2)}</Text>
                              </View>
                            )}
                          </>
                        )}

                        <View style={styles.summaryRow}>
                          <Text style={[styles.summaryLabel, { fontSize: 16 }]}>GST ({calculatedPrice.gst_rate}%):</Text>
                          <Text style={[styles.summaryValue, { fontSize: 18 }]}>${calculatedPrice.gst_amount.toFixed(2)}</Text>
                        </View>

                        <View style={[styles.dividerLine, { marginVertical: 8 }]} />

                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Estimated Total:</Text>
                          <Text style={[styles.summaryValue, { color: themeColors.primary }]}>
                            ${calculatedPrice.total.toFixed(2)}
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: themeColors.textPrimary, textAlign: 'center' }}>
                    Calculating price...
                  </Text>
                )}

                {fetchingPrices && <ActivityIndicator size="small" color={themeColors.primary} style={{ marginTop: 5 }} />}
              </View>
            </View>
          )}

          {/* Place Order Button */}
          <TouchableOpacity
            style={[styles.placeOrderButton, (loading || fetchingSizes || fetchingCalculatedPrice || (!!priceError && serviceType !== 'service')) && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handlePlaceOrder}
            disabled={loading || fetchingSizes || fetchingCalculatedPrice || (!!priceError && serviceType !== 'service')}>
            {loading || fetchingSizes || fetchingCalculatedPrice ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.placeOrderButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="orderBin" onNavigateAction={handleExternalNavigation} />

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
              {binTypes.map((type) => {
                const availableSizes = binSizesMap[Number(type.id)] || [];
                let isTypeDisabled = false;
                if (availableSizes.length > 0) {
                  isTypeDisabled = availableSizes.every((size: BinSize) =>
                    bins.some((b, idx) =>
                      idx !== activeBinIndex &&
                      b.bin_type_id === type.id.toString() &&
                      b.bin_size_id === size.id.toString()
                    )
                  );
                } else {
                  isTypeDisabled = bins.some((b, idx) =>
                    idx !== activeBinIndex &&
                    b.bin_type_id === type.id.toString()
                  );
                }
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.optionItem, isTypeDisabled && { opacity: 0.5 }]}
                    onPress={() => !isTypeDisabled && selectBinType(type)}
                    disabled={isTypeDisabled}
                  >
                    <Text style={[
                      styles.optionText,
                      bins[activeBinIndex]?.bin_type_id === type.id.toString() && styles.selectedOptionText,
                      isTypeDisabled && { color: '#979897' }
                    ]}>
                      {type.name} {isTypeDisabled ? '(All Sizes Selected)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
              {binSizesMap[parseInt(bins[activeBinIndex]?.bin_type_id)]?.map((size: BinSize) => {
                const isSizeAlreadySelected = bins.some((b, idx) =>
                  idx !== activeBinIndex &&
                  b.bin_type_id === bins[activeBinIndex]?.bin_type_id &&
                  b.bin_size_id === size.id.toString()
                );
                return (
                  <TouchableOpacity
                    key={size.id}
                    onPress={() => !isSizeAlreadySelected && selectBinSize(size)}
                    style={[styles.optionItem, isSizeAlreadySelected && { opacity: 0.5 }]}
                    disabled={isSizeAlreadySelected}
                  >
                    <Text style={[
                      styles.optionText,
                      bins[activeBinIndex]?.bin_size_id === size.id.toString() && styles.selectedOptionText,
                      isSizeAlreadySelected && { color: '#979897' }
                    ]}>
                      {size.size} {isSizeAlreadySelected ? '(Already Selected)' : ''}
                    </Text>
                    {binPrices.some(p => p.bin_size_id === size.id) && (
                      <Text style={[styles.optionPrice, isSizeAlreadySelected && { color: '#979897' }]}>
                        ${binPrices.find(p => p.bin_size_id === size.id)?.admin_final_price}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
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

      <AppConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />

      <AppModal
        visible={projectModalVisible}
        onClose={() => setProjectModalVisible(false)}
        title="Select Project">
        <ScrollView style={{ maxHeight: 400 }}>
          {projects.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.modalItem}
              onPress={() => selectProject(project)}>
              <Text style={styles.modalItemText}>{project.name}</Text>
              {selectedProjectId === project.id && (
                <Ionicons name="checkmark-circle" size={20} color={themeColors.primaryLight} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.modalItem, { borderBottomWidth: 0, marginTop: 10 }]}
            onPress={() => {
              setSelectedProjectId(null);
              setSelectedProjectName('None');
              setProjectModalVisible(false);
            }}>
            <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>None / Clear Selection</Text>
          </TouchableOpacity>
        </ScrollView>
      </AppModal>
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
    backgroundColor: themeColors.primary,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    resizeMode: 'contain',
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
    backgroundColor: themeColors.backgroundLight,
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
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: themeColors.backgroundLight,
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
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    marginTop: -10,
    zIndex: 1000,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    flex: 1,
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#373934',
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
  paymentOptionGradientActive: {
    backgroundColor: themeColors.primaryLight2,
  },
  paymentOptionGradientInactive: {
    backgroundColor: themeColors.backgroundLight,
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
    backgroundColor: themeColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: themeColors.primary,
    fontFamily: fonts.family.semiBold,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: fonts.family.regular,
    color: '#333',
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
    backgroundColor: themeColors.primary,
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
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
    fontFamily: fonts.family.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  errorText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#C53030',
    marginLeft: 8,
    flex: 1,
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
    backgroundColor: themeColors.primaryLight2,
    borderColor: themeColors.primary,
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
