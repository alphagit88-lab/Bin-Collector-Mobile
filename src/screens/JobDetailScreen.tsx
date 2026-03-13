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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import BottomNavBar from '../components/BottomNavBar';
import AppModal from '../components/AppModal';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import BinAssignmentModal from '../components/BinAssignmentModal';
import AppConfirmModal from '../components/AppConfirmModal';
import toast from '../utils/toast';
import { BASE_URL } from '../config/api';

// Import SVG icons
import BannerImage from '../assets/images/4 1.svg';
import TruckIcon from '../assets/images/14_1.svg';

interface OrderItem {
  id: number;
  bin_type_name: string;
  bin_size: string;
  price?: string;
}

interface JobDetail {
  id: number;
  orderId: string;
  binType: string;
  binSize: string;
  total: string;
  deliveryDate: string;
  pickupDate: string;
  location: string;
  customerName: string;
  customerId: string;
  customerPhone?: string;
  status: string;
  payment_method?: string;
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
}

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: '⏳' },
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

const JobDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const initialData = (route.params as any)?.booking || (route.params as any)?.job || mockJobDetail;

  const formatDisplayDate = (dateStr: any) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return dateStr;
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
      driver_name: data.driver_name
    };
  };

  // Use route params if available, otherwise use mock data
  const [jobDetail, setJobDetail] = useState<JobDetail>(mapBackendToJobDetail(initialData));
  const [fetching, setFetching] = useState(false);

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => { },
    isDestructive: false,
  });
  const [showBinModal, setShowBinModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);
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
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        navigation.goBack();
      },
    });
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

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      toast.error('Permission Denied', 'Camera permission is required to capture delivery photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDeliveryPhoto(result.assets[0].uri);
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

            {/* Second Row - Delivery Date and Pickup Date */}
            <View style={styles.detailsRow}>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Delivery Date</Text>
                <Text style={styles.detailValue}>{jobDetail.deliveryDate}</Text>
              </LinearGradient>
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardSmall}>
                <Text style={styles.detailLabel}>Pickup Date</Text>
                <Text style={styles.detailValue}>{jobDetail.pickupDate}</Text>
              </LinearGradient>
            </View>

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
                  <Ionicons name="navigate-circle" size={24} color={themeColors.primary} />
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
                jobDetail.orderItems.map((item, index) => (
                  <View key={item.id} style={[styles.orderItemRow, index > 0 && { marginTop: 8 }]}>
                    <Text style={styles.detailValue}>
                      • {item.bin_type_name} {item.bin_size ? `( - ${item.bin_size})` : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.detailValue}>
                  {jobDetail.binType} {jobDetail.binSize ? `( - ${jobDetail.binSize})` : ''}
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
                  {user?.role === 'supplier' && jobDetail.status === 'confirmed' && (
                    <TouchableOpacity onPress={() => setShowDriverModal(true)}>
                      <Text style={{ color: themeColors.primary, fontFamily: fonts.family.medium }}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            )}

            {/* Attachment Section */}
            {jobDetail.attachment_url && (
              <LinearGradient
                colors={['#EFF2F0', '#EAFFCC']}
                locations={[0.2377, 0.6629]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.detailCardFull}>
                <Text style={styles.detailLabel}>Attachment</Text>
                <TouchableOpacity
                  onPress={() => {
                    // Logic to view full image could go here
                  }}>
                  <Image
                    source={{ uri: `${BASE_URL}${jobDetail.attachment_url}` }}
                    style={styles.attachmentPreview}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </LinearGradient>
            )}

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
                    style={styles.attachmentPreview}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              </LinearGradient>
            )}

            {fetching && (
              <View style={{ padding: 10, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={themeColors.primary} />
              </View>
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
                      colors={['#29B554', '#6EAD16']}
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
                {user?.role === 'supplier' && !jobDetail.driver_id && jobDetail.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.assignDriverButton}
                    onPress={() => setShowDriverModal(true)}
                  >
                    <Ionicons name="people-outline" size={20} color={themeColors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.assignDriverButtonText}>Assign Driver</Text>
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
                          });
                        } else {
                          setShowBinModal(true);
                        }
                      }}
                      activeOpacity={user?.role === 'driver' && jobDetail.service_category !== 'service' ? 1 : 0.8}
                      disabled={user?.role === 'driver' && jobDetail.service_category !== 'service'}
                    >
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
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
                      })}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Complete Job</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {jobDetail.service_category !== 'service' && jobDetail.status === 'on_delivery' && (
                    <TouchableOpacity
                      style={styles.acceptButtonWrapper}
                      onPress={() => setConfirmModal({
                        visible: true,
                        title: 'Confirm',
                        message: jobDetail.payment_method === 'cash'
                          ? 'Confirm cash collection for this order?'
                          : 'Mark this order as delivered?',
                        confirmText: 'Confirm',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, visible: false }));
                          handleStatusUpdate(jobDetail.payment_method === 'cash' ? 'cash_collected' : 'delivered');
                        },
                        isDestructive: false,
                      })}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>
                          {jobDetail.payment_method === 'cash' ? 'Mark as Cash Collected' : 'Mark as Delivered'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {jobDetail.service_category !== 'service' && (jobDetail.status === 'cash_collected' || (jobDetail.status === 'on_delivery' && jobDetail.payment_method !== 'cash')) && !deliveryPhoto && (
                    <View style={{ width: '100%' }}>
                      <TouchableOpacity
                        style={styles.photoButton}
                        onPress={handleCapturePhoto}
                        activeOpacity={0.8}>
                        <Ionicons name="camera" size={20} color="#374151" />
                        <Text style={styles.photoButtonText}>Take Delivery Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {jobDetail.service_category !== 'service' && (jobDetail.status === 'cash_collected' || (jobDetail.status === 'on_delivery' && jobDetail.payment_method !== 'cash')) && deliveryPhoto && (
                    <View style={{ width: '100%', alignItems: 'center' }}>
                      <Image source={{ uri: deliveryPhoto }} style={styles.deliveryPhotoPreview} />
                      <TouchableOpacity
                        onPress={handleCapturePhoto}
                        style={[styles.photoButton, { marginTop: 8 }]}>
                        <Ionicons name="refresh" size={18} color="#374151" />
                        <Text style={styles.photoButtonText}>Retake Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {jobDetail.service_category !== 'service' && (jobDetail.status === 'cash_collected' || (jobDetail.status === 'on_delivery' && jobDetail.payment_method !== 'cash')) && (
                    <View style={{ width: '100%', marginTop: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.acceptButtonWrapper,
                          (jobDetail.status === 'cash_collected' || (jobDetail.status === 'on_delivery' && jobDetail.payment_method !== 'cash')) && !deliveryPhoto && { opacity: 0.7 }
                        ]}
                        disabled={!deliveryPhoto}
                        onPress={() => {
                          setConfirmModal({
                            visible: true,
                            title: 'Confirm',
                            message: jobDetail.status === 'cash_collected'
                              ? 'Cash collected. Mark this order as delivered now?'
                              : 'Mark this order as delivered?',
                            confirmText: 'Confirm',
                            onConfirm: () => {
                              setConfirmModal(prev => ({ ...prev, visible: false }));
                              handleStatusUpdate('delivered');
                            },
                            isDestructive: false,
                          });
                        }}
                        activeOpacity={0.8}>
                        <LinearGradient
                          colors={['#29B554', '#6EAD16']}
                          style={styles.acceptButton}>
                          <Text style={styles.acceptButtonText}>Mark as Delivered</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  {jobDetail.service_category !== 'service' && jobDetail.status === 'ready_to_pickup' && (
                    <TouchableOpacity
                      style={styles.acceptButtonWrapper}
                      onPress={() => setConfirmModal({
                        visible: true,
                        title: 'Confirm',
                        message: 'Start pickup process for this order?',
                        confirmText: 'Confirm',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, visible: false }));
                          handleStatusUpdate('pickup');
                        },
                        isDestructive: false,
                      })}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Start Pickup</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {jobDetail.service_category !== 'service' && jobDetail.status === 'pickup' && (
                    <TouchableOpacity
                      style={styles.acceptButtonWrapper}
                      onPress={() => setConfirmModal({
                        visible: true,
                        title: 'Confirm',
                        message: 'Complete this job? Bins will be marked as available.',
                        confirmText: 'Confirm',
                        onConfirm: () => {
                          setConfirmModal(prev => ({ ...prev, visible: false }));
                          handleStatusUpdate('completed');
                        },
                        isDestructive: false,
                      })}
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        style={styles.acceptButton}>
                        <Text style={styles.acceptButtonText}>Complete Job</Text>
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
                    if (jobDetail.service_category === 'service' && (step as any).isPhysical) return false;
                    return true;
                  })
                  .map((step, index, filteredSteps) => {
                    const currentIndex = filteredSteps.findIndex(s => s.key === jobDetail.status);
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;

                    return (
                      <View key={step.key} style={styles.timelineItem}>
                        <View style={[
                          styles.timelineIconContainer,
                          isCompleted ? styles.timelineIconActive : styles.timelineIconInactive
                        ]}>
                          <Text style={styles.timelineIcon}>{step.icon}</Text>
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={[
                            styles.timelineLabel,
                            isCompleted && styles.timelineLabelActive,
                            isCurrent && styles.timelineLabelCurrent
                          ]}>
                            {step.label}
                          </Text>
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

      <AppConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
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
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: '#f0f0f0',
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
    color: themeColors.primary,
    lineHeight: 14,
  },
  deliveryPhotoPreview: {
    width: '100%',
    height: 150,
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
    color: themeColors.primary,
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
});

export default JobDetailScreen;
