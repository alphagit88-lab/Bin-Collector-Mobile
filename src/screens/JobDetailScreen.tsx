import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Linking } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import BottomNavBar from '../components/BottomNavBar';
import AppModal from '../components/AppModal';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import BinAssignmentModal from '../components/BinAssignmentModal';
import AppConfirmModal from '../components/AppConfirmModal';
import toast from '../utils/toast';
import { BASE_URL } from '../config/api';

// Import SVG icons
import BannerImage from '../assets/images/4 1.svg';

interface OrderItem {
  id: number;
  bin_type_name: string;
  bin_size: string;
  price?: string;
  status?: string;
  physical_bin_id?: number | null;
  bin_code?: string | null;
  physical_bin_status?: string | null;
  delivery_photo_url?: string | null;
}

interface JobDetail {
  id: number;
  orderId: string;
  binType: string;
  binSize: string;
  total: string;
  deliveryDate: string | null;
  pickupDate: string | null;
  location: string;
  customerName: string;
  customerId: string;
  customerPhone?: string;
  status: string;
  payment_method?: string;
  payment_status?: string;
  status_history?: any[];
  orderItems?: OrderItem[];
  attachment_url?: string;
  latitude?: number | string;
  longitude?: number | string;
  delivery_photo_url?: string;
  service_category?: string;
  selected_services?: any;
  service_names?: string;
  selected_services_count?: number;
  driver_id?: number | string;
  driver_name?: string;
  supplier_id?: number | string;
  po_number?: string;
  additional_images?: string[];
}

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'awaiting_payment', label: 'Awaiting Payment', icon: '💳' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'on_delivery', label: 'On Delivery', icon: '🚚', isPhysical: true },
  { key: 'cash_collected', label: 'Cash Collected', icon: '💵', cashOnly: true },
  { key: 'delivered', label: 'Delivered', icon: '📦', isPhysical: true },
  { key: 'ready_to_pickup', label: 'Ready to Pickup', icon: '🔄', isPhysical: true },
  { key: 'pickup', label: 'Pickup', icon: '📥', isPhysical: true },
  { key: 'completed', label: 'Completed', icon: '🎉' },
];

const mockJobDetail: JobDetail = {
  id: 0,
  orderId: '#10021',
  binType: 'General Waste',
  binSize: '6m³ - Medium',
  total: '$210.00',
  deliveryDate: 'March 15, 2024',
  pickupDate: 'March 20, 2024',
  location: '21-B Chaplin Rd, Toronto',
  customerName: 'Herper Russo',
  customerId: '#29123',
  status: 'pending',
  orderItems: [
    { id: 1, bin_type_name: 'General Waste', bin_size: '6m³ - Medium' }
  ]
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return '#F59E0B'; // Amber
    case 'awaiting_payment': return '#3B82F6'; // Blue
    case 'confirmed': return '#10B981'; // Green
    case 'on_delivery':
    case 'loaded': return '#8B5CF6'; // Purple
    case 'delivered': return '#059669'; // Emerald
    case 'ready_to_pickup': return '#EF4444'; // Red
    case 'picked_up':
    case 'pickup': return '#6B7280'; // Gray
    case 'completed': return '#10B981'; // Green
    case 'cancelled': return '#DC2626'; // Dark Red
    default: return '#9CA3AF'; // Light Gray
  }
};

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const routeParams = route.params as any;
  const passedJobId = routeParams?.jobId || routeParams?.job?.id || routeParams?.booking?.id;
  const initialData = routeParams?.booking || routeParams?.job || (passedJobId ? { id: passedJobId } : null) || mockJobDetail;

  const formatDisplayDate = (dateStr: any) => {
    if (!dateStr || dateStr === 'N/A') return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return null;
    }
  };

  const mapBackendToJobDetail = (data: any): JobDetail => {
    if (!data) return mockJobDetail;
    return {
      id: data.id,
      orderId: data.request_id || data.orderId || '#0000',
      binType: data.bin_type_name || data.binType,
      binSize: data.bin_size || data.binSize,
      total: data.total_price || data.estimated_price || data.total || '$0.00',
      deliveryDate: formatDisplayDate(data.start_date || data.deliveryDate),
      pickupDate: formatDisplayDate(data.end_date || data.pickupDate),
      location: data.location || 'N/A',
      customerName: data.customer_name || data.customerName || 'N/A',
      customerId: data.customer_id || data.customerId || 'N/A',
      customerPhone: data.customer_phone || data.customerPhone,
      status: data.status,
      payment_method: data.payment_method,
      payment_status: data.payment_status,
      status_history: data.status_history,
      orderItems: data.orderItems || data.items,
      attachment_url: data.attachment_url,
      latitude: data.latitude,
      longitude: data.longitude,
      delivery_photo_url: data.delivery_photo_url,
      service_category: data.service_category,
      selected_services: data.selected_services,
      service_names: data.service_names,
      selected_services_count: data.selected_services_count,
      driver_id: data.driver_id,
      driver_name: data.driver_name,
      supplier_id: data.supplier_id || data.supplierId,
      po_number: data.po_number,
      additional_images: Array.isArray(data.additional_images)
        ? data.additional_images
        : (typeof data.additional_images === 'string' && data.additional_images.startsWith('[')
          ? JSON.parse(data.additional_images)
          : [])
    };
  };

  // Use route params if available, otherwise use mock data
  const [jobDetail, setJobDetail] = useState<JobDetail>(mapBackendToJobDetail(initialData));
  const [fetching, setFetching] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [itemPhotos, setItemPhotos] = useState<Record<number, string>>({});
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => { },
    isDestructive: false,
    singleButton: false,
  });
  const [showBinModal, setShowBinModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [selectedItemForBinAssignment, setSelectedItemForBinAssignment] = useState<OrderItem | null>(null);
  const { user } = require('../contexts/AuthContext').useAuth();

  const isPending = jobDetail.status === 'pending';



  const fetchDrivers = React.useCallback(async () => {
    try {
      const response = await api.get<{ drivers: any[] }>(ENDPOINTS.SUPPLIER.DRIVERS);
      if (response.success && response.data) {
        setDrivers(response.data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, []);

  const fetchJobData = React.useCallback(async () => {
    if (!jobDetail.id) return;
    setFetching(true);
    try {
      const response = await api.get<{ request: any }>(ENDPOINTS.BOOKINGS.DETAILS(jobDetail.id.toString()));
      if (response.success && response.data?.request) {
        setJobDetail(mapBackendToJobDetail(response.data.request));
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setFetching(false);
    }
  }, [jobDetail.id]);

  React.useEffect(() => {
    fetchJobData();
    if (user?.role === 'supplier') {
      fetchDrivers();
    }
  }, [user?.role, fetchDrivers, fetchJobData]);



  const handleAssignDriver = async (driverId: number) => {
    setAssigningDriver(true);
    try {
      const response = await api.post(ENDPOINTS.SUPPLIER.ASSIGN_DRIVER, {
        requestId: jobDetail.id,
        driverId: driverId
      });

      if (response.success) {
        toast.success('Success', 'Driver assigned successfully');
        setShowDriverModal(false);

        // Update local state
        setJobDetail(prev => {
          const updated = { ...prev };
          updated.driver_id = driverId;
          const driver = drivers.find(d => d.id === driverId);
          if (driver) updated.driver_name = driver.name;
          return updated;
        });
      } else {
        toast.error('Error', response.message || 'Failed to assign driver');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while assigning driver');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleAcceptOrder = async () => {
    setSubmitting(true);
    try {
      const response = await api.post(ENDPOINTS.BOOKINGS.ACCEPT(jobDetail.id.toString()), {});

      if (response.success) {
        // Navigate to the success screen with order details
        navigation.navigate('SupplierOrderAccepted', {
          orderDetails: {
            orderId: jobDetail.orderId,
            binType: jobDetail.binType,
            binSize: jobDetail.binSize,
            deliveryDate: jobDetail.deliveryDate,
            collectionDate: jobDetail.pickupDate,
          },
        });
      } else {
        toast.error('Error', response.message || 'Failed to accept order');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while accepting the order');
    } finally {
      setSubmitting(false);
      setConfirmModal(prev => ({ ...prev, visible: false }));
    }
  };

  const handleDeclineOrder = () => {
    setConfirmModal({
      visible: true,
      title: 'Decline Order',
      message: `Are you sure you want to decline order ${jobDetail.orderId}?`,
      confirmText: 'Decline',
      isDestructive: true,
      singleButton: false,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      },
    });
  };

  const handleCancelOrder = async () => {
    try {
      const response = await api.delete(ENDPOINTS.BOOKINGS.CANCEL(jobDetail.id.toString()));

      if (response.success) {
        toast.success('Success', 'Order cancelled successfully');
        setConfirmModal(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      } else {
        toast.error('Error', response.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error('Error', error?.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleStatusUpdate = async (newStatus: string, binCodes?: string[]) => {
    if (newStatus === 'delivered' && !deliveryPhoto) {
      toast.error('Error', 'Please take a delivery photo first');
      return;
    }
    setUpdatingStatus(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);

      if (binCodes) {
        formData.append('bin_codes', JSON.stringify(binCodes));
      }

      if (newStatus === 'delivered' && deliveryPhoto) {
        const filename = deliveryPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('delivery_photo', {
          uri: deliveryPhoto,
          name: filename,
          type,
        } as any);
      }

      const response = await api.put(ENDPOINTS.BOOKINGS.UPDATE_STATUS(jobDetail.id.toString()), formData);

      if (response.success) {
        toast.success('Success', `Status updated to ${newStatus}`);
        navigation.goBack();
      } else {
        toast.error('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Error', 'An error occurred while updating status');
    } finally {
      setUpdatingStatus(false);
      setShowBinModal(false);
    }
  };

  const handleItemStatusUpdate = async (itemId: number, newStatus: string, itemPhoto?: string | null, binCode?: string | null) => {
    if (newStatus === 'delivered' && !itemPhoto) {
      toast.error('Error', 'Please take a delivery photo for this bin first');
      return;
    }
    setUpdatingStatus(true);
    try {
      const formData = new FormData();
      formData.append('status', newStatus);

      if (binCode) {
        formData.append('bin_code', binCode);
      }

      if (newStatus === 'delivered' && itemPhoto) {
        const filename = itemPhoto.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('delivery_photo', {
          uri: itemPhoto,
          name: filename,
          type,
        } as any);
      }

      const response = await api.put(
        ENDPOINTS.BOOKINGS.UPDATE_ITEM_STATUS(jobDetail.id.toString(), itemId),
        formData
      );

      if (response.success) {
        toast.success('Success', `Bin status updated to ${newStatus}`);

        // Refresh job details to show updated state
        fetchJobData();

        // Reset item photo state
        setItemPhotos(prev => {
          const updated = { ...prev };
          delete updated[itemId];
          return updated;
        });
      } else {
        toast.error('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update item status error:', error);
      toast.error('Error', 'An error occurred while updating bin status');
    } finally {
      setUpdatingStatus(false);
    }
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
      return uri;
    }
  };

  const handleCaptureItemPhoto = async (itemId: number) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Camera permission is required to capture delivery photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
    });

    if (!result.canceled) {
      const compressedUri = await compressImage(result.assets[0].uri);
      setItemPhotos(prev => ({
        ...prev,
        [itemId]: compressedUri
      }));
    }
  };

  const handleOpenDirections = () => {
    const lat = jobDetail.latitude;
    const lon = jobDetail.longitude;
    const addr = encodeURIComponent(jobDetail.location);

    if (lat && lon) {
      const url = Platform.select({
        ios: `maps:0,0?q=${addr}@${lat},${lon}`,
        android: `geo:0,0?q=${lat},${lon}(${addr})`,
      });
      if (url) Linking.openURL(url);
    } else {
      const url = Platform.select({
        ios: `maps:0,0?q=${addr}`,
        android: `geo:0,0?q=${addr}`,
      });
      if (url) Linking.openURL(url);
    }
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
                <View style={styles.headerIconsWrapper}>
                  <HeaderActionIcons useWhiteWrapper />
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
            <Text style={styles.pendingTitle}>
              {isPending ? 'Pending Requests' : 'Job Details'}
            </Text>
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
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.orderSummaryCard}>
            <View style={styles.orderSummaryRow}>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>Order ID</Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.orderId}
                </Text>
              </View>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>
                  {jobDetail.service_category === 'service' ? 'Service Type' : 'Bin Type'}
                </Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.service_category === 'service' ? 'General Service' : jobDetail.binType}
                </Text>
              </View>
              <View style={styles.orderSummaryColumn}>
                <Text style={styles.orderSummaryLabel}>
                  {jobDetail.service_category === 'service' ? 'Budget' : 'Size/Capacity'}
                </Text>
                <Text style={styles.orderSummaryValue}>
                  {jobDetail.service_category === 'service' ? `$${jobDetail.total}` : jobDetail.binSize}
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.orderDetailsCard}>
            <Text style={styles.orderDetailsTitle}>Order Details</Text>

            {/* First Row - Order # and Total */}
            <View style={styles.detailsRow}>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Order #</Text>
                <Text style={styles.detailValue}>{jobDetail.orderId}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.detailValue}>{jobDetail.total}</Text>
              </LinearGradient>
            </View>

            {/* PO Number Row (If exists) */}
            {jobDetail.po_number && (
              <View style={styles.detailsRow}>
                <LinearGradient
                  colors={['#EFF2F0', '#EAFFCC']}
                  locations={[0.2377, 0.6629]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.detailCardFull}>
                  <Text style={styles.detailLabel}>PO Number</Text>
                  <Text style={styles.detailValue}>{jobDetail.po_number}</Text>
                </LinearGradient>
              </View>
            )}

            {/* Second Row - Delivery Date and Pickup Date */}
            {(jobDetail.deliveryDate || jobDetail.pickupDate) && (
              <View style={styles.detailsRow}>
                {jobDetail.deliveryDate && (
                  <LinearGradient
                    colors={['#EFF2F0', '#EAFFCC']}
                    locations={[0.2377, 0.6629]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.detailCardSmall}>
                    <Text style={styles.detailLabel}>Delivery Date</Text>
                    <Text style={styles.detailValue}>{jobDetail.deliveryDate}</Text>
                  </LinearGradient>
                )}
                {jobDetail.pickupDate && (
                  <LinearGradient
                    colors={['#EFF2F0', '#EAFFCC']}
                    locations={[0.2377, 0.6629]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.detailCardSmall, !jobDetail.deliveryDate && { flex: 1 }]}>
                    <Text style={styles.detailLabel}>Pickup Date</Text>
                    <Text style={styles.detailValue}>{jobDetail.pickupDate}</Text>
                  </LinearGradient>
                )}
              </View>
            )}

            {/* Location Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCardFull}>
              <View style={styles.locationHeader}>
                <Text style={styles.detailLabel}>Location</Text>
                <TouchableOpacity
                  style={styles.directionsButton}
                  onPress={handleOpenDirections}
                >
                  <Ionicons name="navigate-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.directionsText}>Directions</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.detailValue}>{jobDetail.location}</Text>
            </LinearGradient>

            {/* Bin Types Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCardFull}>
              <Text style={styles.detailLabel}>Order Requirements</Text>
              {jobDetail.service_category === 'service' ? (
                <View style={styles.serviceListContainer}>
                  {jobDetail.service_names ? (
                    jobDetail.service_names.split(',').map((name: string, idx: number) => (
                      <View key={idx} style={styles.serviceTag}>
                        <Ionicons name="checkmark-circle" size={16} color={themeColors.primary} />
                        <Text style={styles.serviceTagText}>{name.trim()}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.serviceTag}>
                      <Ionicons name="checkmark-circle" size={16} color={themeColors.primary} />
                      <Text style={styles.serviceTagText}>General Service</Text>
                    </View>
                  )}
                </View>
              ) : jobDetail.orderItems && jobDetail.orderItems.length > 0 ? (
                jobDetail.orderItems.map((item, index) => {
                  const isUserStaff = user?.role === 'supplier' || user?.role === 'driver';
                  const showActions = isUserStaff && !isPending;
                  const itemPhoto = itemPhotos[item.id];

                  return (
                    <View key={item.id} style={[styles.orderItemCard, index > 0 && { marginTop: 12 }]}>
                      <View style={styles.orderItemHeader}>
                        <Text style={styles.orderItemTitle}>
                          • {item.bin_type_name} {item.bin_size ? `(${item.bin_size})` : ''}
                        </Text>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(item.status || 'pending') }
                        ]}>
                          <Text style={styles.statusBadgeText}>
                            {(item.status || 'pending').toUpperCase().replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>

                      {item.bin_code && (
                        <Text style={styles.binCodeText}>
                          Assigned Bin: <Text style={{ fontFamily: fonts.family.bold }}>{item.bin_code}</Text>
                        </Text>
                      )}

                      {/* Display delivery photo for this item if it exists in backend */}
                      {item.delivery_photo_url && (
                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.detailLabel}>Delivery Photo:</Text>
                          <Image
                            source={{ uri: `${BASE_URL}${item.delivery_photo_url}` }}
                            style={styles.itemPhotoPreview}
                            resizeMode="contain"
                          />
                        </View>
                      )}

                      {/* Supplier/Driver Action Buttons for individual item */}
                      {showActions && (
                        <View style={styles.itemActionContainer}>
                          {item.status === 'loaded' && (
                            <View style={{ width: '100%', gap: 8 }}>
                              {!itemPhoto ? (
                                <TouchableOpacity
                                  style={styles.itemPhotoButton}
                                  onPress={() => handleCaptureItemPhoto(item.id)}
                                >
                                  <Ionicons name="camera" size={18} color="#374151" style={{ marginRight: 6 }} />
                                  <Text style={styles.photoButtonText}>Take Delivery Photo</Text>
                                </TouchableOpacity>
                              ) : (
                                <View style={{ alignItems: 'center', width: '100%' }}>
                                  <Image source={{ uri: itemPhoto }} style={styles.itemPhotoPreview} resizeMode="contain" />
                                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, width: '100%' }}>
                                    <TouchableOpacity
                                      style={[styles.itemPhotoButton, { flex: 1 }]}
                                      onPress={() => handleCaptureItemPhoto(item.id)}
                                    >
                                      <Ionicons name="refresh" size={16} color="#374151" style={{ marginRight: 6 }} />
                                      <Text style={styles.photoButtonText}>Retake</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={[styles.itemDeliverButton, { flex: 1 }]}
                                      onPress={() => handleItemStatusUpdate(item.id, 'delivered', itemPhoto)}
                                    >
                                      <Text style={styles.itemDeliverButtonText}>Deliver Bin</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                          )}

                          {(item.status === 'pending' || item.status === 'confirmed' || !item.status) && (
                            <TouchableOpacity
                              style={styles.itemLoadButton}
                              onPress={() => setSelectedItemForBinAssignment(item)}
                            >
                              <Ionicons name="cube-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                              <Text style={styles.itemLoadButtonText}>Start Delivery (Assign Bin)</Text>
                            </TouchableOpacity>
                          )}

                          {item.status === 'ready_to_pickup' && (
                            <TouchableOpacity
                              style={styles.itemPickupButton}
                              onPress={() => handleItemStatusUpdate(item.id, 'pickup')}
                            >
                              <Text style={styles.itemPickupButtonText}>Start Pickup</Text>
                            </TouchableOpacity>
                          )}

                          {item.status === 'picked_up' && (
                            <TouchableOpacity
                              style={styles.itemCompleteButton}
                              onPress={() => handleItemStatusUpdate(item.id, 'completed')}
                            >
                              <Text style={styles.itemCompleteButtonText}>Complete Pickup</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.detailValue}>
                  {jobDetail.binType} {jobDetail.binSize ? `(${jobDetail.binSize})` : ''}
                </Text>
              )}
            </LinearGradient>

            {/* Customer Card */}
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailCardFull}>
              <Text style={styles.detailLabel}>Customer</Text>
              <Text style={styles.detailValue}>
                {jobDetail.customerName}
              </Text>
              {!isPending && jobDetail.customerPhone && (
                <Text style={[styles.detailValue, { marginTop: 4, fontFamily: fonts.family.regular, fontSize: 14 }]}>
                  Phone: {jobDetail.customerPhone}
                </Text>
              )}
            </LinearGradient>

            {/* Driver Card */}
            {jobDetail.driver_id && (
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardFull}>
                <Text style={styles.detailLabel}>Assigned Driver</Text>
                <View style={styles.driverInfoRow}>
                  <Text style={styles.detailValue}>
                    {jobDetail.driver_name || 'Driver Assigned'}
                  </Text>
                  {user?.role === 'supplier' && !['completed', 'cancelled'].includes(jobDetail.status) && (
                    <TouchableOpacity onPress={() => setShowDriverModal(true)}>
                      <Text style={{ color: themeColors.primary, fontFamily: fonts.family.medium }}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            )}

            {/* Attachments Section (All Images) */}
            {(() => {
              let allImages: string[] = [];
              if (jobDetail.attachment_url) {
                allImages.push(jobDetail.attachment_url);
              }
              if (jobDetail.additional_images && jobDetail.additional_images.length > 0) {
                allImages = [...allImages, ...jobDetail.additional_images];
              }

              if (allImages.length > 0) {
                return (
                  <LinearGradient
                    colors={['#EFF2F0', '#EAFFCC']}
                    locations={[0.2377, 0.6629]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.detailCardFull}>
                    <Text style={styles.detailLabel}>Attachments ({allImages.length})</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsHorizontalScroll}>
                      {allImages.map((img, idx) => (
                        <TouchableOpacity key={idx} style={styles.attachmentThumbnailWrapper}>
                          <Image
                            source={{ uri: `${BASE_URL}${img}` }}
                            style={[styles.attachmentThumbnail, { aspectRatio: imageAspectRatios[`all_${idx}`] || 1.5 }]}
                            resizeMode="contain"
                            onLoad={(event) => {
                              const { width, height } = event.nativeEvent.source;

                              setImageAspectRatios(prev => ({
                                ...prev,
                                [`all_${idx}`]: width / height
                              }));
                            }}
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </LinearGradient>
                );
              }
              return null;
            })()}

            {/* Delivery Confirmation Photo Section */}
            {jobDetail.delivery_photo_url && (
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardFull}>
                <Text style={styles.detailLabel}>Delivery Confirmation</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Logic to view full image could go here
                  }}>
                  <Image
                    source={{ uri: `${BASE_URL}${jobDetail.delivery_photo_url}` }}
                    style={[styles.attachmentPreview, { aspectRatio: imageAspectRatios['delivery_photo'] || 1.5 }]}
                    resizeMode="contain"
                    onLoad={(event) => {
                      const { width, height } = event.nativeEvent.source;

                      setImageAspectRatios(prev => ({
                        ...prev,
                        delivery_photo: width / height
                      }));
                    }}
                  />
                </TouchableOpacity>
              </LinearGradient>
            )}

            {fetching && (
              <View style={{ padding: 10, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={themeColors.primary} />
              </View>
            )}

            {/* Communication Actions */}
            {!isPending && (
              <View style={styles.communicationRow}>
                <TouchableOpacity
                  style={[styles.chatButtonContainer, { flex: 1, marginBottom: 0 }]}
                  onPress={async () => {
                    try {
                      const recipientId = (user?.role === 'customer')
                        ? jobDetail.supplier_id
                        : jobDetail.customerId;

                      if (!recipientId) {
                        toast.error('Error', 'Cannot identify chat recipient');
                        return;
                      }

                      const response = await api.post<{ id: number }>('/messages/start-order-chat', {
                        orderId: jobDetail.id,
                        recipientId: recipientId
                      });

                      if (response.success && response.data) {
                        navigation.navigate('ChatDetail', { conversationId: response.data.id });
                      }
                    } catch (error) {
                      toast.error('Error', 'Failed to start chat');
                    }
                  }}
                >
                  <Feather name="message-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.chatButtonText}>Chat</Text>
                </TouchableOpacity>

                {jobDetail.customerPhone && (
                  <TouchableOpacity
                    style={[styles.callButtonContainer, { flex: 1 }]}
                    onPress={() => {
                      if (jobDetail.customerPhone) {
                        Linking.openURL(`tel:${jobDetail.customerPhone}`);
                      } else {
                        toast.error('Error', 'Phone number not available');
                      }
                    }}
                  >
                    <Ionicons name="call" size={20} color="#FFFFFF" />
                    <Text style={styles.callButtonText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}



            {/* Repeat Order Button (Customer only) */}
            {user?.role === 'customer' && (
              <TouchableOpacity
                style={styles.repeatOrderButton}
                onPress={() => {
                  navigation.navigate('OrderBin', { repeatData: initialData });
                }}
              >
                <Ionicons name="refresh" size={20} color={themeColors.primaryDark} />
                <Text style={styles.repeatOrderText}>Repeat Order</Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            {(user?.role === 'supplier' || user?.role === 'driver') && isPending && (
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={handleDeclineOrder}
                  activeOpacity={0.8}>
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.acceptButtonWrapper, { marginLeft: 8 }]}
                  onPress={() => setConfirmModal({
                    visible: true,
                    title: 'Accept Order',
                    message: `Are you sure you want to accept order ${jobDetail.orderId}?`,
                    confirmText: 'Accept',
                    isDestructive: false,
                    singleButton: false,
                    onConfirm: handleAcceptOrder,
                  })}
                  disabled={submitting}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[
                      'rgba(137, 217, 87, 0.2)',
                      'rgba(137, 217, 87, 0.2)',
                    ]}
                    locations={[0, 1]}
                    style={styles.acceptButtonOverlay}>
                    <LinearGradient
                      colors={[themeColors.primaryLight2, themeColors.primaryLight]}
                      locations={[0.2227, 0.7018]}
                      start={{ x: 0.1, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.acceptButton}>
                      {submitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Text style={styles.acceptButtonText}>Accept Order</Text>
                      )}
                    </LinearGradient>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Status Update Buttons for Supplier/Driver */}
            {(user?.role === 'supplier' || user?.role === 'driver') && !isPending && (
              <View style={{ gap: 8 }}>
                {user?.role === 'supplier' && !jobDetail.driver_id && !['completed', 'cancelled'].includes(jobDetail.status) && (
                  <TouchableOpacity
                    style={styles.assignDriverButton}
                    onPress={() => setShowDriverModal(true)}
                  >
                    <Ionicons name="people-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.assignDriverButtonText}>Assign Driver</Text>
                  </TouchableOpacity>
                )}

                {/* Cancel Order Button for Suppliers */}
                {user?.role === 'supplier' && jobDetail.status !== 'completed' && jobDetail.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={[styles.assignDriverButton, { backgroundColor: 'transparent', paddingVertical: 0, overflow: 'hidden' }]}
                    onPress={() => {
                      setConfirmModal({
                        visible: true,
                        title: 'Cancel Order',
                        message: 'Are you sure you want to cancel this order?',
                        confirmText: 'Cancel Order',
                        isDestructive: true,
                        singleButton: false,
                        onConfirm: handleCancelOrder,
                      });
                    }}
                  >
                    <LinearGradient
                      colors={['#EF4444', '#DC2626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' }}
                    >
                      <Text style={{ fontFamily: fonts.family.bold, fontSize: 16, color: '#FFFFFF' }}>Cancel Order</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <View style={styles.actionButtonsContainer}>
                  {jobDetail.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[
                        styles.acceptButtonWrapper,
                        user?.role === 'driver' && jobDetail.service_category !== 'service' && styles.disabledContent
                      ]}
                      onPress={() => {
                        if (user?.role === 'driver' && jobDetail.service_category !== 'service') return;
                        if (jobDetail.service_category === 'service') {
                          setConfirmModal({
                            visible: true,
                            title: 'Complete Service',
                            message: jobDetail.payment_method === 'cash'
                              ? 'Confirm cash collection and complete this service?'
                              : 'Mark this service as completed?',
                            confirmText: 'Confirm',
                            onConfirm: () => {
                              setConfirmModal(prev => ({ ...prev, visible: false }));
                              if (jobDetail.payment_method === 'cash') {
                                handleStatusUpdate('cash_collected');
                              } else {
                                handleStatusUpdate('completed');
                              }
                            },
                            isDestructive: false,
                            singleButton: false,
                          });
                        } else {
                          setShowBinModal(true);
                        }
                      }}
                      activeOpacity={user?.role === 'driver' && jobDetail.service_category !== 'service' ? 1 : 0.8}
                      disabled={user?.role === 'driver' && jobDetail.service_category !== 'service'}
                    >
                      <LinearGradient
                        colors={[themeColors.primaryLight2, themeColors.primaryLight]}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>
                          {jobDetail.service_category === 'service'
                            ? (jobDetail.payment_method === 'cash' ? 'Collect Cash & Complete' : 'Mark as Completed')
                            : 'Start Delivery (Assign Bins)'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {jobDetail.service_category === 'service' && jobDetail.status === 'cash_collected' && (
                    <TouchableOpacity
                      style={styles.acceptButtonWrapper}
                      onPress={() => setConfirmModal({
                        visible: true,
                        title: 'Complete Job',
                        message: 'Mark this service as fully completed?',
                        confirmText: 'Confirm',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, visible: false }));
                          handleStatusUpdate('completed');
                        },
                        isDestructive: false,
                        singleButton: false,
                      })}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={[themeColors.primaryLight2, themeColors.primaryLight]}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Complete Job</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                  {/* Cash Collected button: show when cash order, at least one bin delivered, not yet collected */}
                  {jobDetail.service_category !== 'service' &&
                    jobDetail.payment_method === 'cash' &&
                    jobDetail.status !== 'cash_collected' &&
                    jobDetail.payment_status !== 'paid' &&
                    Array.isArray(jobDetail.orderItems) &&
                    jobDetail.orderItems.some(item =>
                      ['delivered', 'ready_to_pickup', 'picked_up', 'completed'].includes(item.status || '')
                    ) && (
                      <TouchableOpacity
                        style={styles.acceptButtonWrapper}
                        onPress={() => setConfirmModal({
                          visible: true,
                          title: 'Collect Cash',
                          message: 'Confirm that cash has been collected from the customer?',
                          confirmText: 'Confirm',
                          onConfirm: () => {
                            setConfirmModal(prev => ({ ...prev, visible: false }));
                            handleStatusUpdate('cash_collected');
                          },
                          isDestructive: false,
                          singleButton: false,
                        })}
                        activeOpacity={0.8}>
                        <LinearGradient
                          colors={[themeColors.primaryLight2, themeColors.primaryLight]}
                          style={styles.acceptButton}>
                          <Text style={styles.acceptButtonText}>Mark as Cash Collected</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}


                  {jobDetail.status === 'completed' && (
                    <View style={styles.acceptButtonWrapper}>
                      <LinearGradient
                        colors={['#BCBCBC', '#999999']}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Order Completed</Text>
                      </LinearGradient>
                    </View>
                  )}
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Status Timeline Section */}
        {!isPending && (
          <View style={[styles.sectionContainer, { marginTop: 16 }]}>
            <View style={styles.timelineCard}>
              <Text style={styles.timelineTitle}>Status Timeline</Text>
              <View style={styles.timelineList}>
                {statusSteps
                  .filter(step => {
                    if (step.cashOnly && jobDetail.payment_method !== 'cash') return false;
                    if (step.key === 'awaiting_payment' && jobDetail.payment_method === 'cash') return false;
                    if (jobDetail.service_category === 'service' && (step as any).isPhysical) return false;
                    return true;
                  })
                  .map((step, index, filteredSteps) => {
                    const currentIndex = filteredSteps.findIndex(s => s.key === jobDetail.status);

                    let isCompleted = false;
                    let isPartiallyCompleted = false;
                    let hintText = '';
                    const totalItemsCount = Array.isArray(jobDetail.orderItems) ? jobDetail.orderItems.length : 0;

                    if (step.key === 'cash_collected') {
                      isCompleted = jobDetail.payment_status === 'paid' ||
                        jobDetail.status === 'cash_collected' ||
                        (Array.isArray(jobDetail.status_history) && jobDetail.status_history.some((h: any) => h.status === 'cash_collected'));
                    } else if (jobDetail.service_category !== 'service' && totalItemsCount > 0) {
                      const items = jobDetail.orderItems as any[];
                      if (step.key === 'on_delivery') {
                        const targetStatuses = ['loaded', 'cash_collected', 'delivered', 'ready_to_pickup', 'picked_up', 'completed'];
                        const reachedCount = items.filter(item => targetStatuses.includes(item.status || '')).length;
                        isCompleted = reachedCount === totalItemsCount;
                        isPartiallyCompleted = reachedCount > 0 && reachedCount < totalItemsCount;
                        if (reachedCount > 0) {
                          hintText = `(${reachedCount}/${totalItemsCount} loaded)`;
                        }
                      } else if (step.key === 'delivered') {
                        const targetStatuses = ['delivered', 'ready_to_pickup', 'picked_up', 'completed'];
                        const reachedCount = items.filter(item => targetStatuses.includes(item.status || '')).length;
                        isCompleted = reachedCount === totalItemsCount;
                        isPartiallyCompleted = reachedCount > 0 && reachedCount < totalItemsCount;
                        if (reachedCount > 0) {
                          hintText = `(${reachedCount}/${totalItemsCount} delivered)`;
                        }
                      } else if (step.key === 'ready_to_pickup') {
                        const targetStatuses = ['ready_to_pickup', 'picked_up', 'completed'];
                        const reachedCount = items.filter(item => targetStatuses.includes(item.status || '')).length;
                        isCompleted = reachedCount === totalItemsCount;
                        isPartiallyCompleted = reachedCount > 0 && reachedCount < totalItemsCount;
                        if (reachedCount > 0) {
                          hintText = `(${reachedCount}/${totalItemsCount} ready)`;
                        }
                      } else if (step.key === 'pickup') {
                        const targetStatuses = ['picked_up', 'completed'];
                        const reachedCount = items.filter(item => targetStatuses.includes(item.status || '')).length;
                        isCompleted = reachedCount === totalItemsCount;
                        isPartiallyCompleted = reachedCount > 0 && reachedCount < totalItemsCount;
                        if (reachedCount > 0) {
                          hintText = `(${reachedCount}/${totalItemsCount} picked up)`;
                        }
                      } else {
                        isCompleted = index <= currentIndex;
                      }
                    } else {
                      isCompleted = index <= currentIndex;
                    }

                    const isCurrent = index === currentIndex;

                    return (
                      <View key={step.key} style={styles.timelineItem}>
                        <View style={[
                          styles.timelineIconContainer,
                          isCompleted ? styles.timelineIconActive :
                            isPartiallyCompleted ? styles.timelineIconPartial : styles.timelineIconInactive
                        ]}>
                          <Text style={styles.timelineIcon}>{step.icon}</Text>
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[
                            styles.timelineLabel,
                            isCompleted && styles.timelineLabelActive,
                            isPartiallyCompleted && styles.timelineLabelActive,
                            isCurrent && styles.timelineLabelCurrent
                          ]}>
                            {step.label}
                          </Text>
                          {hintText ? (
                            <Text style={styles.timelineHintText}>{hintText}</Text>
                          ) : null}
                        </View>
                        {index < filteredSteps.length - 1 && (
                          <View style={[
                            styles.timelineConnector,
                            index < currentIndex && styles.timelineConnectorActive
                          ]} />
                        )}
                      </View>
                    );
                  })}
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Driver Assignment Modal */}
      <AppModal
        visible={showDriverModal}
        onRequestClose={() => !assigningDriver && setShowDriverModal(false)}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Driver</Text>
              <TouchableOpacity onPress={() => !assigningDriver && setShowDriverModal(false)}>
                <Ionicons name="close" size={24} color="#17360F" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {drivers.length === 0 ? (
                <View style={styles.emptyDrivers}>
                  <Text style={styles.emptyText}>No drivers available</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowDriverModal(false);
                      navigation.navigate('SupplierDrivers');
                    }}
                    style={styles.addDriverLink}
                  >
                    <Text style={styles.addDriverLinkText}>Add New Driver</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                drivers.map((driver) => (
                  <TouchableOpacity
                    key={driver.id}
                    style={styles.driverItem}
                    onPress={() => handleAssignDriver(driver.id)}
                    disabled={assigningDriver}
                  >
                    <View style={styles.driverItemInfo}>
                      <Text style={styles.driverItemName}>{driver.name}</Text>
                      <Text style={styles.driverItemPhone}>{driver.phone}</Text>
                    </View>
                    {assigningDriver ? (
                      <ActivityIndicator size="small" color={themeColors.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#CCC" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </AppModal>

      {/* Bin Assignment Modal */}
      <BinAssignmentModal
        visible={showBinModal}
        orderItems={jobDetail.orderItems || []}
        onClose={() => setShowBinModal(false)}
        onSubmit={handleStatusUpdate}
        isLoading={updatingStatus}
      />

      {/* Single Bin Assignment Modal */}
      {selectedItemForBinAssignment && (
        <BinAssignmentModal
          visible={!!selectedItemForBinAssignment}
          orderItems={[selectedItemForBinAssignment]}
          onClose={() => setSelectedItemForBinAssignment(null)}
          onSubmit={async (status, assignments) => {
            const binCode = assignments[0];
            await handleItemStatusUpdate(selectedItemForBinAssignment.id, 'loaded', null, binCode);
            setSelectedItemForBinAssignment(null);
          }}
          isLoading={updatingStatus}
        />
      )}

      <AppConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
        singleButton={confirmModal.singleButton}
      />

      {user?.role === 'customer' ? (
        <BottomNavBar activeTab="bookings" />
      ) : (
        <SupplierBottomNavBar activeTab={user?.role === 'driver' ? 'jobs' : 'requests'} />
      )}
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
    paddingTop: 15,
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
  headerIconsWrapper: {
    zIndex: 3,
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
    transform: [{ rotate: '180deg' }],
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
  attachmentPreview: {
    width: '100%',
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItemRow: {
    width: '100%',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap'
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 22,
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  priceInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 24,
    fontFamily: fonts.family.bold,
    textAlign: 'center',
    color: '#333',
    marginBottom: 25,
  },
  disabledContent: {
    opacity: 0.5,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#EEE',
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: fonts.family.bold,
    color: '#666',
  },
  modalConfirmButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#37B112',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontFamily: fonts.family.bold,
    color: '#FFF',
  },
  // Timeline Styles
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  timelineTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineIconActive: {
    backgroundColor: '#10B981',
  },
  timelineIconInactive: {
    backgroundColor: '#E5E7EB',
  },
  timelineIconPartial: {
    backgroundColor: '#E6F4EA',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  timelineHintText: {
    fontSize: 12,
    color: '#059669',
    fontFamily: fonts.family.medium,
    marginTop: 2,
  },
  timelineIcon: {
    fontSize: 18,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 15,
    color: '#666',
  },
  timelineLabelCurrent: {
    fontFamily: fonts.family.bold,
    color: '#333',
  },
  timelineLabelCompleted: {
    color: '#333',
  },
  currentStatusBadge: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: fonts.family.medium,
    marginTop: 2,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c2404e1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  directionsText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 14,
  },
  deliveryPhotoPreview: {
    width: '100%',
    borderRadius: 10,
    marginTop: 10,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  photoButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#374151',
  },
  serviceListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3FFE2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5EFD1',
    gap: 6,
  },
  serviceTagText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
  },
  assignDriverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0c2404e1',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  assignDriverButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  driverInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabelActive: {
    fontFamily: fonts.family.bold,
    color: '#10B981',
  },
  timelineConnector: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 16,
    backgroundColor: '#E5E7EB',
    zIndex: -1,
  },
  timelineConnectorActive: {
    backgroundColor: '#10B981',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  modalScroll: {
    width: '100%',
    maxHeight: 300,
  },
  emptyDrivers: {
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  addDriverLink: {
    padding: 10,
  },
  addDriverLinkText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: themeColors.primary,
  },
  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  driverItemInfo: {
    flex: 1,
  },
  driverItemName: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#333',
  },
  driverItemPhone: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
  },
  chatButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#373934',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 16,
  },
  attachmentsHorizontalScroll: {
    marginTop: 8,
  },
  attachmentThumbnailWrapper: {
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentThumbnail: {
    width: 80,
  },
  repeatOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  repeatOrderText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 16,
  },
  communicationRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  callButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.primaryLight2,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 16,
  },
  cancelButtonContainer: {
    marginHorizontal: 19,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButtonGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 16,
  },
  orderItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderItemTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 11,
  },
  binCodeText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  itemActionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  itemPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  itemDeliverButton: {
    backgroundColor: themeColors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDeliverButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 14,
  },
  itemPickupButton: {
    backgroundColor: themeColors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  itemPickupButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 14,
  },
  itemCompleteButton: {
    backgroundColor: themeColors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  itemCompleteButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 14,
  },
  itemPhotoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  itemLoadButton: {
    backgroundColor: themeColors.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  itemLoadButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 14,
  },
});

export default JobDetailScreen;
