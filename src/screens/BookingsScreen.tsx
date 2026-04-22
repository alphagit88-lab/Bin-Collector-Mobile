import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { api, BASE_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import AppModal from '../components/AppModal';
import { Image } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import toast from '../utils/toast';

// Import SVG images
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import Icon20_3 from '../assets/images/20_3.svg';
import PlayIcon from '../assets/images/play.svg';
import BinCollectIcon from '../assets/images/Bin.Collect (1) 1.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Booking {
  id: number;
  request_id: string;
  bin_type_name: string;
  bin_size: string;
  status: string;
  total_price: string | number;
  estimated_price?: string | number;
  start_date: string;
  end_date: string;
  order_items_count: number;
  items?: any[];
  attachment_url?: string;
  service_category?: string;
  service_names?: string;
  selected_services_count?: number;
  contact_number?: string;
  contact_email?: string;
  instructions?: string;
  payment_method?: string;
  location?: string;
  po_number?: string;
  additional_images?: string | string[];
  delivery_photo_url?: string;
  latitude?: number | string;
  longitude?: number | string;
  base_price?: string | number;
  additional_duration_charge?: string | number;
  duration_days?: number;
  exceeded_days?: number;
  project_name?: string;
}

const BookingsScreen: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigation = useNavigation();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const userName = user?.name || 'User';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const [paying, setPaying] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = React.useRef<MapView>(null);

  const filteredBookings = bookings.filter(booking => {
    const query = searchQuery.toLowerCase();
    const requestIdMatch = booking.request_id.toLowerCase().includes(query);
    const binTypeMatch = booking.bin_type_name?.toLowerCase().includes(query);
    const locationMatch = booking.location?.toLowerCase().includes(query);
    const serviceMatch = booking.service_names?.toLowerCase().includes(query);
    
    return requestIdMatch || binTypeMatch || locationMatch || serviceMatch;
  });

  const fetchBookings = useCallback(async () => {
    try {
      const response = await api.get<{ requests: Booking[] }>(ENDPOINTS.BOOKINGS.MY_REQUESTS);
      if (response.success && response.data) {
        setBookings(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (socket) {
      socket.on('status_update', (data) => {
        console.log('Booking status updated via socket, refreshing list...');
        fetchBookings();
      });
      return () => {
        socket.off('status_update');
      };
    }
  }, [socket, fetchBookings]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const fitMapToPins = useCallback(() => {
    if (!mapRef.current) return;

    const coords = bookings
      .filter(b => b.latitude && b.longitude)
      .map(b => ({
        latitude: parseFloat(b.latitude as string),
        longitude: parseFloat(b.longitude as string),
      }));

    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [bookings]);

  useEffect(() => {
    if (viewMode === 'map') {
      const timer = setTimeout(fitMapToPins, 500);
      return () => clearTimeout(timer);
    }
  }, [viewMode, bookings, fitMapToPins]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'on_delivery':
      case 'delivered':
      case 'pickup':
        return '#66E91F';
      case 'ready_to_pickup':
        return '#FF9500';
      case 'confirmed':
      case 'awaiting_payment':
        return '#408FC7';
      case 'completed':
        return '#2E8015';
      case 'pending':
        return '#C4CA00';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const activeBookingsCount = bookings.filter(b =>
    !['completed', 'cancelled'].includes(b.status.toLowerCase())
  ).length;

  const completedServicesCount = bookings.filter(b =>
    b.status.toLowerCase() === 'completed'
  ).length;

  const formatPrice = (price: string | number) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const handlePayNow = async () => {
    if (!selectedBooking) return;
    if (selectedBooking.payment_method !== 'online') return;

    setPaying(true);
    try {
      const paymentResponse = await api.post('/payments/create-intent', {
        requestId: selectedBooking.id,
      }) as any;

      if (!paymentResponse.success) {
        toast.error('Payment Error', paymentResponse.message || 'Failed to initiate payment');
        return;
      }

      const { clientSecret } = paymentResponse.data;
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Bin Rental Inc',
        paymentIntentClientSecret: clientSecret,
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: false,
          currencyCode: 'USD',
        },
        defaultBillingDetails: {
          name: user?.name,
          email: user?.email,
        }
      });

      if (initError) {
        toast.error('Payment Error', initError.message);
        return;
      }

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if ((presentError as any).code === 'Canceled') {
          toast.info('Payment Canceled', 'Payment was not completed. Your order is still pending payment.');
        } else {
          toast.error('Payment Failed', presentError.message);
        }
        return;
      }

      // Fallback confirmation for environments where webhook forwarding isn't active.
      await api.post('/payments/confirm-success', {
        requestId: selectedBooking.id,
        paymentIntentId: (paymentResponse.data as any)?.paymentIntentId,
      });

      toast.success('Success', 'Payment submitted. Confirming...');
      // Webhook will update status/payment; refresh list to reflect confirmed status
      await fetchBookings();
      setDetailsModalVisible(false);
    } catch (e: any) {
      console.error('Pay now error:', e);
      toast.error('Error', 'Something went wrong while processing payment');
    } finally {
      setPaying(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return `${startStr} - ${endStr}`;
  };

  const getStatusDisplay = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getCardColors = (index: number) => {
    const colorPairs = [
      ['#B4FFF3', '#D9DCEF'],
      ['#FFB4B4', '#EFD9D9'],
      ['#F6FFB4', '#E8EFD9'],
    ];
    return colorPairs[index % colorPairs.length];
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9CCD17']} />
        }>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingText}>{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'},</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <HeaderActionIcons />
          </View>
        </View>

        {/* Order New Bin Button */}
        <TouchableOpacity
          style={styles.orderButtonContainer}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('OrderBin' as never)}>
          <LinearGradient
            colors={['#9CCD17', '#009B5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}>
            <View style={styles.orderButtonIconContainer}>
              <BinCollectIcon width={39} height={32} />
            </View>
            <Text style={styles.orderButtonText}>Order New Bin</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Tracking and Booking Cards Row */}
        <View style={styles.trackingBookingRow}>
          <TouchableOpacity
            style={styles.trackingCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ServiceTracking' as never)}>
            <LinearGradient
              colors={['#C0F96F', '#90B93E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.trackingCardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Tracking</Text>
                  <View style={styles.playButtonContainer}>
                    <PlayIcon width={45} height={45} />
                  </View>
                </View>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStatValue}>{activeBookingsCount.toString().padStart(2, '0')}</Text>
                  <Text style={styles.cardStatLabel}>Active Bookings</Text>
                </View>
                <View style={styles.binCollectOverlay}>
                  <BinCollect2 width={192} height={128} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookingCard}
            activeOpacity={0.9}
            onPress={() => setViewMode('list')}>
            <LinearGradient
              colors={['#A7DB3D', '#D6EF72', '#D8FF3A']}
              locations={[0.1651, 0.6554, 0.8017]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={styles.bookingCardGradient}>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>History</Text>
                  <View style={styles.playButtonContainer}>
                    <PlayIcon width={45} height={45} />
                  </View>
                </View>
                <View style={styles.cardStats}>
                  <Text style={styles.cardStatValue}>{completedServicesCount.toString().padStart(2, '0')}</Text>
                  <Text style={styles.cardStatLabel}>Completed Services</Text>
                </View>
                <View style={styles.binCollectOverlayUpsideDown}>
                  <View
                    style={{
                      width: 192,
                      height: 128,
                      transform: [{ rotate: '180deg' }],
                      opacity: 0.34,
                    }}>
                    <BinCollect2 width={192} height={128} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My Bookings Section */}
        <View style={styles.myBookingsSection}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.85, y: 0 }}
            end={{ x: 0.15, y: 1 }}
            style={styles.myBookingsCard}>
            <View style={styles.myBookingsHeader}>
              <Text style={styles.myBookingsTitle}>My Bookings</Text>
              <View style={styles.viewToggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.toggleButtonTextActive]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
                  onPress={() => setViewMode('map')}
                >
                  <Text style={[styles.toggleButtonText, viewMode === 'map' && styles.toggleButtonTextActive]}>Map</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.searchBarContainer}>
              <Ionicons name="search" size={20} color="#979897" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by ID, bin type or location..."
                placeholderTextColor="#979897"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length > 0) setShowAll(false);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#979897" />
                </TouchableOpacity>
              )}
            </View>

            {loading && !refreshing ? (
              <View style={{ paddingVertical: 40 }}>
                <ActivityIndicator size="large" color="#9CCD17" />
              </View>
            ) : viewMode === 'list' ? (
              filteredBookings.length > 0 ? (
                (showAll ? filteredBookings : filteredBookings.slice(0, 5)).map((booking, index) => {
                  const colors = getCardColors(index);
                  return (
                    <View key={booking.id} style={styles.bookingCardItem}>
                      <LinearGradient
                        colors={colors}
                        locations={[0.2377, 0.6629]}
                        start={{ x: 0.85, y: 0 }}
                        end={{ x: 0.15, y: 1 }}
                        style={styles.bookingCardGradientItem}>
                        <View style={styles.bookingCardContent}>
                          {/* First Row: Booking ID, Service, Dates */}
                          <View style={styles.bookingInfoRow}>
                            <View style={styles.bookingInfoItem}>
                              <Text style={styles.bookingLabel}>Booking ID</Text>
                              <Text style={styles.bookingValue}>#{booking.request_id.slice(-5).toUpperCase()}</Text>
                            </View>
                            <View style={styles.bookingInfoItem}>
                              <Text style={styles.bookingLabel}>{booking.service_category === 'service' ? 'Service(s)' : 'Bin(s)'}</Text>
                              {booking.items && booking.items.length > 0 ? (
                                <Text numberOfLines={1} style={styles.bookingValue}>
                                  {booking.items.length}x {booking.items[0].bin_type_name}
                                  {booking.items.length > 1 ? '...' : ''}
                                </Text>
                              ) : booking.service_names && booking.service_names.length > 0 ? (
                                <Text numberOfLines={1} style={styles.bookingValue}>
                                  {booking.service_names.split(',').length}x {booking.service_names.split(',')[0]}
                                  {booking.service_names.split(',').length > 1 ? '...' : ''}
                                </Text>
                              ) : (
                                <Text numberOfLines={1} style={styles.bookingValue}>{booking.bin_type_name}</Text>
                              )}
                            </View>
                            <View style={styles.bookingInfoItem}>
                              <Text style={styles.bookingLabel}>Dates</Text>
                              <Text style={styles.bookingValue}>
                                {formatDateRange(booking.start_date, booking.end_date)}
                              </Text>
                            </View>
                          </View>
                          {/* Second Row: Amount, Status */}
                          <View style={styles.amountStatusRow}>
                            <View style={styles.amountBox}>
                              <LinearGradient
                                colors={[
                                  'rgba(110, 173, 22, 0.1)',
                                  'rgba(201, 226, 101, 0.1)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.amountStatusGradient}>
                                <View style={styles.amountStatusContent}>
                                  <Text style={styles.bookingLabel}>Amount</Text>
                                  <Text style={styles.bookingValue}>{formatPrice(booking.total_price || booking.estimated_price || 0)}</Text>
                                </View>
                              </LinearGradient>
                            </View>
                            <View style={styles.statusBox}>
                              <LinearGradient
                                colors={[
                                  'rgba(110, 173, 22, 0.1)',
                                  'rgba(201, 226, 101, 0.1)',
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.amountStatusGradient}>
                                <View style={styles.amountStatusContent}>
                                  <Text style={styles.bookingLabel}>Status</Text>
                                  <Text style={styles.bookingValue}>{getStatusDisplay(booking.status)}</Text>
                                </View>
                              </LinearGradient>
                            </View>
                          </View>
                          {/* Buttons Row */}
                          <View style={styles.bookingActionsRow}>
                            <TouchableOpacity
                              style={styles.viewButtonNew}
                              activeOpacity={0.7}
                              onPress={() => {
                                setSelectedBooking(booking);
                                setDetailsModalVisible(true);
                                console.log(booking)
                              }}>
                              <PlayIcon width={21} height={17} />
                              <Text style={styles.viewButtonTextNew}>View</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.trackButtonNew}
                              activeOpacity={0.7}
                              onPress={() => (navigation as any).navigate('ServiceTracking', { requestId: booking.id })}>
                              <PlayIcon width={21} height={17} />
                              <Text style={styles.trackButtonTextNew}>Track Order</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </LinearGradient>
                    </View>
                  );
                })
              ) : (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.family.medium, color: '#666' }}>No bookings found</Text>
                </View>
              )
            ) : (
              <View style={styles.mapWrapper}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: 6.9271,
                    longitude: 79.8612,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                  }}
                >
                  {filteredBookings.filter(b => b.latitude && b.longitude).map((booking) => (
                    <Marker
                      key={booking.id}
                      coordinate={{
                        latitude: parseFloat(booking.latitude as string),
                        longitude: parseFloat(booking.longitude as string),
                      }}
                      pinColor={getStatusColor(booking.status)}
                      onPress={() => {
                        setSelectedBooking(booking);
                        setDetailsModalVisible(true);
                      }}
                    >
                      <Callout>
                          <View style={styles.calloutContainer}>
                            <Text style={styles.calloutTitle}>{booking.request_id}</Text>
                            <Text style={styles.calloutText}>
                              {booking.service_category === 'service'
                                ? (booking.service_names?.split(',')[0] || 'General Service')
                                : booking.bin_type_name}
                              {booking.bin_size ? ` (${booking.bin_size})` : ''}
                            </Text>
                            <Text style={[styles.calloutStatus, { color: getStatusColor(booking.status) }]}>
                              {booking.status.replace(/_/g, ' ').toUpperCase()}
                            </Text>
                            <TouchableOpacity style={styles.calloutButton}>
                              <Text style={styles.calloutButtonText}>View Details</Text>
                            </TouchableOpacity>
                          </View>
                        </Callout>
                      </Marker>
                    )
                  )}
                </MapView>
              </View>
            )}

            {bookings.length > 5 && viewMode === 'list' && (
              <TouchableOpacity
                style={styles.viewAllLink}
                activeOpacity={0.7}
                onPress={() => {
                  setSearchQuery('');
                  setShowAll(!showAll);
                }}
              >
                <Text style={styles.viewAllLinkText}>
                  {showAll ? 'View less' : `View all (${bookings.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="bookings" />

      {/* Booking Details Modal */}
      <AppModal
        visible={detailsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              {selectedBooking && (
                <>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Order ID</Text>
                    <Text style={styles.modalValue}>#{selectedBooking.request_id}</Text>
                  </View>

                  {selectedBooking.project_name && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Assigned Project</Text>
                      <Text style={styles.modalValue}>{selectedBooking.project_name}</Text>
                    </View>
                  )}

                  {selectedBooking.po_number && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>PO Number</Text>
                      <Text style={styles.modalValue}>{selectedBooking.po_number}</Text>
                    </View>
                  )}

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <Text style={styles.modalValue}>{getStatusDisplay(selectedBooking.status)}</Text>
                  </View>

                   <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Date Range</Text>
                    <Text style={styles.modalValue}>{formatDateRange(selectedBooking.start_date, selectedBooking.end_date)}</Text>
                  </View>

                  {selectedBooking.duration_days && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Duration</Text>
                      <Text style={styles.modalValue}>{selectedBooking.duration_days} Day(s)</Text>
                    </View>
                  )}

                  {parseFloat(selectedBooking.additional_duration_charge as string) > 0 && (
                    <>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>
                          Base Price ({parseInt(String(selectedBooking.duration_days)) - parseInt(String(selectedBooking.exceeded_days || 0))} Days)
                        </Text>
                        <Text style={styles.modalValue}>{formatPrice(selectedBooking.base_price || 0)}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Extra Duration Charge ({selectedBooking.exceeded_days} days)</Text>
                        <Text style={[styles.modalValue, { color: '#E53E3E' }]}>+{formatPrice(selectedBooking.additional_duration_charge || 0)}</Text>
                      </View>
                    </>
                  )}

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Total Amount</Text>
                    <Text style={[styles.modalValue, { fontSize: 18, color: '#29B554' }]}>
                      {formatPrice(selectedBooking.total_price || selectedBooking.estimated_price || 0)}
                    </Text>
                  </View>

                  {selectedBooking.status === 'awaiting_payment' && selectedBooking.payment_method === 'online' && (
                    <TouchableOpacity
                      style={[styles.closeButtonContainer, { marginTop: 0, marginBottom: 10, opacity: paying ? 0.7 : 1 }]}
                      onPress={handlePayNow}
                      disabled={paying}
                    >
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.closeButtonGradient}
                      >
                        <Text style={styles.closeButtonText}>{paying ? 'Opening Payment...' : 'Pay Now'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <Text style={styles.modalSectionTitle}>
                    {selectedBooking.service_category === 'service' ? 'Requested Services' : 'Items'}
                  </Text>

                  {selectedBooking.service_category === 'service' ? (
                    <View style={styles.orderItemContainer}>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Budget</Text>
                        <Text style={styles.modalValue}>{formatPrice(selectedBooking.estimated_price || 0)}</Text>
                      </View>
                      {selectedBooking.service_names ? (
                        <View style={[styles.modalRow, { marginTop: 8, alignItems: 'flex-start' }]}>
                          <Text style={styles.modalLabel}>Services</Text>
                          <View style={{ flex: 1 }}>
                            {selectedBooking.service_names.split(',').map((name, index) => (
                              <Text key={index} style={[styles.modalValue, { textAlign: 'right', marginBottom: 4, width: '100%' }]}>
                                {name.trim()}
                              </Text>
                            ))}
                          </View>
                        </View>
                      ) : (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Service</Text>
                          <Text style={styles.modalValue}>N/A</Text>
                        </View>
                      )}
                    </View>
                  ) : selectedBooking.items && selectedBooking.items.length > 0 ? (
                    selectedBooking.items.map((item, index) => (
                      <View key={index} style={styles.orderItemContainer}>
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Bin Type</Text>
                          <Text style={styles.modalValue}>{item.bin_type_name}</Text>
                        </View>
                        {item.bin_size && <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Size</Text>
                          <Text style={styles.modalValue}>{item.bin_size}</Text>
                        </View>}
                      </View>
                    ))
                  ) : (
                    <View style={styles.orderItemContainer}>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Bin Type</Text>
                        <Text style={styles.modalValue}>{selectedBooking.bin_type_name || 'N/A'}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Size</Text>
                        <Text style={styles.modalValue}>{selectedBooking.bin_size || 'N/A'}</Text>
                      </View>
                    </View>
                  )}

                  {selectedBooking.location && (
                    <>
                      <Text style={styles.modalSectionTitle}>Location</Text>
                      <View style={styles.orderItemContainer}>
                        <Text style={[styles.modalValue, { textAlign: 'left', lineHeight: 22 }]}>
                          {selectedBooking.location}
                        </Text>
                      </View>
                    </>
                  )}

                  <Text style={styles.modalSectionTitle}>Contact & Notes</Text>
                  <View style={styles.orderItemContainer}>
                    {selectedBooking.contact_number && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Contact No</Text>
                        <Text style={styles.modalValue}>{selectedBooking.contact_number}</Text>
                      </View>
                    )}
                    {selectedBooking.contact_email && (
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Email</Text>
                        <Text style={styles.modalValue}>{selectedBooking.contact_email}</Text>
                      </View>
                    )}
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Payment</Text>
                      <Text style={styles.modalValue}>{getStatusDisplay(selectedBooking.payment_method || 'online')}</Text>
                    </View>
                    {selectedBooking.instructions && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={styles.modalLabel}>
                          {selectedBooking.service_category === 'service' ? 'Description' : 'Instructions'}
                        </Text>
                        <Text style={[styles.modalValue, { textAlign: 'left', marginTop: 4, fontFamily: fonts.family.regular }]}>
                          {selectedBooking.instructions}
                        </Text>
                      </View>
                    )}
                  </View>

                  {selectedBooking.attachment_url || (selectedBooking as any).additional_images ? (
                    <View style={styles.modalAttachmentSection}>
                      <Text style={styles.modalSectionTitle}>Attachments</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {selectedBooking.attachment_url && (
                          <Image
                            source={{ uri: `${BASE_URL}${selectedBooking.attachment_url}` }}
                            style={styles.modalAttachmentPreview}
                            resizeMode="cover"
                          />
                        )}
                        {(selectedBooking as any).additional_images && (() => {
                          const imgs = (selectedBooking as any).additional_images;
                          let parsed: string[] = [];
                          if (Array.isArray(imgs)) parsed = imgs;
                          else if (typeof imgs === 'string') {
                            try { parsed = JSON.parse(imgs); } catch (e) { }
                          }
                          return Array.isArray(parsed) ? parsed.map((img, i) => (
                            <Image
                              key={i}
                              source={{ uri: `${BASE_URL}${img}` }}
                              style={styles.modalAttachmentPreview}
                              resizeMode="cover"
                            />
                          )) : null;
                        })()}
                        {selectedBooking.delivery_photo_url && (
                          <Image
                            source={{ uri: `${BASE_URL}${selectedBooking.delivery_photo_url}` }}
                            style={styles.modalAttachmentPreview}
                            resizeMode="cover"
                          />
                        )}
                      </ScrollView>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.closeButtonContainer, { marginTop: 20, marginBottom: 10 }]}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      (navigation as any).navigate('OrderBin', { repeatData: selectedBooking });
                    }}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.closeButtonGradient}
                    >
                      <Text style={styles.closeButtonText}>Repeat Order</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButtonContainer}
              onPress={() => setDetailsModalVisible(false)}
            >
              <LinearGradient
                colors={['#9CCD17', '#009B5F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.closeButtonGradient}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#373934',
  },
  userNameText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#A7DB3D',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerProfileButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#29B554',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.family.bold,
  },
  orderButtonContainer: {
    marginHorizontal: 33,
    marginTop: 10,
    marginBottom: 10,
    height: 56,
    borderRadius: 38,
    overflow: 'hidden',
  },
  orderButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderButtonIconContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  trackingBookingRow: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    marginTop: 10,
    marginBottom: 10,
    gap: 7,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#373934',
  },
  trackingCard: {
    flex: 1,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
  },
  trackingCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  bookingCard: {
    flex: 1,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
  },
  bookingCardGradient: {
    flex: 1,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
  },
  cardContent: {
    flex: 1,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  playButtonContainer: {
    width: 45,
    height: 45,
  },
  ellipseContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#424141',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ellipse2: {
    width: 21,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardStats: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  cardStatValue: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#161616',
  },
  cardStatLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#373934',
    marginTop: 4,
  },
  binCollectOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  binCollectOverlayUpsideDown: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  myBookingsSection: {
    marginHorizontal: 19,
    marginTop: 10,
    marginBottom: 20,
  },
  myBookingsCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
    paddingBottom: 20,
  },
  myBookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  myBookingsTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#242424',
  },
  mapWrapper: {
    width: '100%',
    height: 400,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  map: {
    flex: 1,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  calloutTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#242424',
    marginBottom: 2,
  },
  calloutText: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calloutStatus: {
    fontFamily: fonts.family.bold,
    fontSize: 10,
    marginBottom: 8,
  },
  calloutButton: {
    backgroundColor: '#242424',
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: fonts.family.bold,
  },
  bookingCardItem: {
    marginBottom: 17,
    borderRadius: 9,
    overflow: 'hidden',
    width: SCREEN_WIDTH - 38 - 28, // Screen width minus margins (19*2) minus padding (14*2)
    minHeight: 161,
    alignSelf: 'stretch',
  },
  bookingCardGradientItem: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 14,
    paddingLeft: 14,
    paddingRight: 14,
    paddingBottom: 15,
    width: '100%',
  },
  bookingCardContent: {
    gap: 12,
    width: '100%',
  },
  bookingInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  bookingInfoItem: {
    flex: 1,
  },
  amountStatusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'nowrap',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  amountBox: {
    flex: 1,
    height: 49,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statusBox: {
    flex: 1,
    height: 49,
    borderRadius: 4,
    overflow: 'hidden',
  },
  amountStatusGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingLeft: 8,
    paddingRight: 8,
    paddingVertical: 5,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  amountStatusContent: {
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  bookingLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 4,
  },
  bookingValue: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  bookingActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  viewButtonNew: {
    flex: 1,
    maxWidth: 167,
    height: 31,
    backgroundColor: '#89D957',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewButtonTextNew: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  trackButtonNew: {
    flex: 1,
    maxWidth: 167,
    height: 31,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  trackButtonTextNew: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 15,
    color: '#242424',
  },
  viewAllLink: {
    alignSelf: 'flex-end',
    marginTop: 10,
  },
  viewAllLinkText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    lineHeight: 19,
    color: '#242424',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#333',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalScrollContent: {
    padding: 20,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  modalValue: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    lineHeight: 18,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  modalAttachmentSection: {
    marginTop: 5,
  },
  modalAttachmentPreview: {
    width: 250,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  modalSectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  orderItemContainer: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  closeButtonContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  closeButtonGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.family.bold,
    fontSize: 16,
  },
});

export default BookingsScreen;
