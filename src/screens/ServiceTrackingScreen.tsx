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
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext'; // Ensure this exists and exports useSocket
import { fonts } from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { api, BASE_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import AppConfirmModal from '../components/AppConfirmModal';
import toast from '../utils/toast';
import { useStripe } from '@stripe/stripe-react-native';

// Import SVG images
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import BinCollectIcon from '../assets/images/Bin.Collect (1) 1.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusSteps = [
  { key: 'pending', label: 'Pending', icon: 'clock-outline', iconType: 'material' },
  { key: 'awaiting_payment', label: 'Awaiting Payment', icon: 'card-outline', iconType: 'ionicon' },
  { key: 'confirmed', label: 'Confirmed', icon: 'checkmark-circle-outline', iconType: 'ionicon' },
  { key: 'on_delivery', label: 'On Delivery', icon: 'truck-delivery-outline', iconType: 'material' },
  { key: 'cash_collected', label: 'Cash Collected', icon: 'cash-outline', iconType: 'ionicon', cashOnly: true },
  { key: 'delivered', label: 'Delivered', icon: 'cube-outline', iconType: 'ionicon' },
  { key: 'ready_to_pickup', label: 'Ready to Pickup', icon: 'sync-outline', iconType: 'ionicon' },
  { key: 'pickup', label: 'Pickup', icon: 'download-outline', iconType: 'ionicon' },
  { key: 'completed', label: 'Completed', icon: 'checkmark-done-circle-outline', iconType: 'ionicon' },
];

const ServiceTrackingScreen: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigation = useNavigation();
  const userName = user?.name || 'Customer';
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [paying, setPaying] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const response = await api.get<{ requests: any[] }>(ENDPOINTS.BOOKINGS.MY_REQUESTS);
      if (response.success && response.data) {
        // Filter for active requests (not cancelled, maybe mostly active)
        // The web frontend filtered !['completed', 'cancelled']
        const active = (response.data.requests || []);
        setRequests(active);

        // Check for route params first
        const state = navigation.getState();
        const routeParams = (state?.routes?.find(r => r.name === 'ServiceTracking')?.params as any);
        if (routeParams?.requestId) {
          const target = active.find((r: any) => r.id === routeParams.requestId);
          if (target) {
            setSelectedRequest(target);
            return;
          }
        }

        // Select the first one if none selected or if selected is no longer active
        if (active.length > 0) {
          // If we already have a selected request, try to keep it updated
          if (selectedRequest) {
            const updated = active.find((r: any) => r.id === selectedRequest.id);
            setSelectedRequest(updated || active[0]);
          } else {
            setSelectedRequest(active[0]);
          }
        } else {
          setSelectedRequest(null);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRequest]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [])
  );

  useEffect(() => {
    if (socket) {
      const handleStatusUpdate = () => {
        fetchRequests();
      };

      socket.on('status_update', handleStatusUpdate);
      socket.on('request_status_updated', handleStatusUpdate); // Listen to both just in case

      return () => {
        socket.off('status_update', handleStatusUpdate);
        socket.off('request_status_updated', handleStatusUpdate);
      };
    }
  }, [socket, fetchRequests]);

  useEffect(() => {
    if (selectedRequest) {
      fetchOrderItems(selectedRequest.id);
    }
  }, [selectedRequest]);

  const fetchOrderItems = async (requestId: number) => {
    try {
      const response = await api.get<{ orderItems: any[] }>(ENDPOINTS.BOOKINGS.ORDER_ITEMS(requestId.toString()));
      if (response.success && response.data && response.data.orderItems) {
        setOrderItems(response.data.orderItems);
      } else {
        setOrderItems([]);
      }
    } catch (error) {
      console.error('Error fetching order items:', error);
      setOrderItems([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleMarkReadyToPickup = async () => {
    if (!selectedRequest) return;
    setConfirmVisible(true);
  };

  const handlePayNow = async () => {
    if (!selectedRequest) return;
    if (selectedRequest.payment_method !== 'online') return;
    if (selectedRequest.status !== 'awaiting_payment') return;

    setPaying(true);
    try {
      const paymentResponse = await api.post('/payments/create-intent', {
        requestId: selectedRequest.id,
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
        requestId: selectedRequest.id,
        paymentIntentId: (paymentResponse.data as any)?.paymentIntentId,
      });

      toast.success('Success', 'Payment submitted. Confirming...');
      await fetchRequests();
    } catch (e) {
      console.error('Pay now error:', e);
      toast.error('Error', 'Something went wrong while processing payment');
    } finally {
      setPaying(false);
    }
  };

  const executeMarkReady = async () => {
    if (!selectedRequest) return;
    setConfirmVisible(false);
    setLoading(true);
    try {
      const response = await api.put(ENDPOINTS.BOOKINGS.MARK_READY(selectedRequest.id.toString()));
      if (response.success) {
        toast.success('Success', 'Pickup requested successfully');
        fetchRequests();
      } else {
        toast.error('Error', response.message || 'Failed to request pickup');
      }
    } catch (error) {
      console.error('Error requesting pickup:', error);
      toast.error('Error', 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStepIndex = (status: string) => {
    return statusSteps.findIndex(step => step.key === status);
  };

  const renderTimeline = (currentStatus: string, paymentMethod: string, category: string) => {
    const isService = category === 'service';
    const filteredSteps = statusSteps.filter(step => {
      if (step.cashOnly && paymentMethod !== 'cash') return false;
      if (isService && ['on_delivery', 'delivered', 'ready_to_pickup', 'pickup'].includes(step.key)) return false;
      return true;
    });
    const currentIndex = filteredSteps.findIndex(step => step.key === currentStatus);

    return (
      <View style={styles.timelineContainer}>
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Status Timeline</Text>
        <View style={styles.timelineList}>
          {filteredSteps.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <View key={step.key} style={styles.timelineItem}>
                <View style={[
                  styles.timelineIconContainer,
                  isCompleted ? styles.timelineIconActive : styles.timelineIconInactive
                ]}>
                  {step.iconType === 'material' ? (
                    <MaterialCommunityIcons name={step.icon as any} size={22} color="#FFFFFF" />
                  ) : (
                    <Ionicons name={step.icon as any} size={22} color="#FFFFFF" />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    isCurrent && styles.timelineLabelCurrent,
                    isCompleted && styles.timelineLabelCompleted
                  ]}>
                    {step.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.currentStatusBadge}>Current Status</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOrderDetails = (request: any) => {
    return (
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>Order Details</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Order ID</Text>
          <Text style={styles.detailValue}>{request.request_id}</Text>
        </View>

        <View style={[styles.detailRow, { marginTop: 8, alignItems: 'flex-start' }]}>
          <Text style={[styles.detailLabel, { fontFamily: fonts.family.medium }]}>
            {request.service_category === 'service' ? 'Service' : (orderItems.length > 1 ? 'Bins' : 'Bin')}
          </Text>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            {request.service_category === 'service' ? (
              request.service_names ? (
                request.service_names.split(',').map((name: string, index: number) => (
                  <Text key={index} style={[styles.detailValue, { textAlign: 'right', marginBottom: 4 }]}>
                    {name.trim()}
                  </Text>
                ))
              ) : (
                <Text style={[styles.detailValue, { textAlign: 'right' }]}>General Service</Text>
              )
            ) : orderItems.length > 0 ? (
              orderItems.map((item, index) => (
                <Text key={index} style={[styles.detailValue, { textAlign: 'right', marginBottom: 4 }]}>
                  {item.bin_type_name} - {item.bin_size} {item.bin_code ? `(${item.bin_code})` : ''}
                </Text>
              ))
            ) : (
              <Text style={[styles.detailValue, { textAlign: 'right' }]}>
                {request.bin_type_name} - {request.bin_size} {request.bin_code ? `(${request.bin_code})` : ''}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.detailRow, { marginTop: 12 }]}>
          <Text style={styles.detailLabel}>Location</Text>
          <Text style={styles.detailValue}>{request.location}</Text>
        </View>
        {request.supplier_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier</Text>
            <Text style={styles.detailValue}>{request.supplier_name}</Text>
          </View>
        )}
        {request.start_date && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Date</Text>
            <Text style={styles.detailValue}>{new Date(request.start_date).toLocaleDateString()}</Text>
          </View>
        )}
        {request.po_number && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PO Number</Text>
            <Text style={styles.detailValue}>{request.po_number}</Text>
          </View>
        )}
        {request.instructions && (
          <View style={[styles.detailRow, { flexDirection: 'column', gap: 4, marginTop: 8 }]}>
            <Text style={styles.detailLabel}>Instructions</Text>
            <Text style={[styles.detailValue, { maxWidth: '100%', textAlign: 'left' }]}>{request.instructions}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
          onPress={() => navigation.navigate('OrderBin' as never)}
        >
          <LinearGradient
            colors={['#9CCD17', '#009B5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}
          >
            <View style={styles.orderButtonIconContainer}>
              <BinCollectIcon width={39} height={32} />
            </View>
            <Text style={styles.orderButtonText}>Order New Bin</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Service Tracking Container */}
        <View style={styles.trackingContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.85, y: 0 }}
            end={{ x: 0.15, y: 1 }}
            style={styles.trackingContainerGradient}
          >
            {/* Service Tracking Header */}
            <Text style={styles.serviceTrackingTitle}>Service Tracking</Text>

            {/* Separator Line */}
            <View style={styles.separatorLine} />

            {/* Content Area */}
            {loading ? (
              <ActivityIndicator size="large" color="#009B5F" style={{ marginTop: 100 }} />
            ) : requests.length === 0 ? (
              /* No Active Services Content */
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIcon}>
                  <BinCollect2 width={148} height={100} style={{ opacity: 0.34 }} />
                </View>
                <Text style={styles.emptyStateText}>No active services</Text>
              </View>
            ) : (
              <View style={styles.trackingContent}>
                {/* Request Selector if multiple */}
                {requests.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
                    {requests.map(req => (
                      <TouchableOpacity
                        key={req.id}
                        style={[
                          styles.chip,
                          selectedRequest?.id === req.id && styles.chipActive
                        ]}
                        onPress={() => setSelectedRequest(req)}
                      >
                        <Text style={[
                          styles.chipText,
                          selectedRequest?.id === req.id && styles.chipTextActive
                        ]}>
                          #{req.request_id}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {selectedRequest && (
                  <>
                    {renderOrderDetails(selectedRequest)}

                    {/* Pay Now Button (online orders after supplier acceptance) */}
                    {selectedRequest.status === 'awaiting_payment' && selectedRequest.payment_method === 'online' && (
                      <TouchableOpacity
                        style={styles.actionButtonContainer}
                        onPress={handlePayNow}
                        activeOpacity={0.8}
                        disabled={paying}
                      >
                        <LinearGradient
                          colors={['#29B554', '#6EAD16']}
                          style={[styles.actionButton, paying && { opacity: 0.7 }]}
                        >
                          <Text style={styles.actionButtonText}>{paying ? 'Opening Payment...' : 'Pay Now'}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {/* Ready to Pickup Button */}
                    {selectedRequest.status === 'delivered' && (
                      <TouchableOpacity
                        style={styles.actionButtonContainer}
                        onPress={handleMarkReadyToPickup}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#29B554', '#6EAD16']}
                          style={styles.actionButton}
                        >
                          <Text style={styles.actionButtonText}>Mark Ready for Pickup</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}

                    {renderTimeline(selectedRequest.status, selectedRequest.payment_method, selectedRequest.service_category)}

                    {(selectedRequest.attachment_url || selectedRequest.additional_images || selectedRequest.delivery_photo_url) && (
                      <View style={styles.attachmentsSection}>
                        <Text style={styles.sectionTitle}>Attachments</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                          {selectedRequest.attachment_url && (
                            <Image
                              source={{ uri: `${BASE_URL}${selectedRequest.attachment_url}` }}
                              style={styles.attachmentPreview}
                              resizeMode="cover"
                            />
                          )}
                          {selectedRequest.additional_images && (() => {
                            let parsed = [];
                            try {
                              parsed = typeof selectedRequest.additional_images === 'string' 
                                ? JSON.parse(selectedRequest.additional_images) 
                                : selectedRequest.additional_images;
                            } catch(e) {}
                            return Array.isArray(parsed) ? parsed.map((img, i) => (
                              <Image
                                key={i}
                                source={{ uri: `${BASE_URL}${img}` }}
                                style={styles.attachmentPreview}
                                resizeMode="cover"
                              />
                            )) : null;
                          })()}
                          {selectedRequest.delivery_photo_url && (
                            <Image
                              source={{ uri: `${BASE_URL}${selectedRequest.delivery_photo_url}` }}
                              style={styles.attachmentPreview}
                              resizeMode="cover"
                            />
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

          </LinearGradient>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <AppConfirmModal
        visible={confirmVisible}
        title="Request Pickup"
        message="Are you sure the bin is ready for pickup?"
        onConfirm={executeMarkReady}
        onCancel={() => setConfirmVisible(false)}
      />

      <BottomNavBar activeTab="tracking" />
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
    gap: 6,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderButtonContainer: {
    marginHorizontal: 21,
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
  trackingContainer: {
    marginHorizontal: 12,
    marginTop: 10,
    width: SCREEN_WIDTH - 24,
    maxWidth: 408,
    minHeight: 500,
    borderRadius: 9,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  trackingContainerGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  serviceTrackingTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 11,
    fontFamily: fonts.family.bold,
    fontSize: 24,
    lineHeight: 29,
    textAlign: 'center',
    color: '#373934',
    zIndex: 10,
  },
  separatorLine: {
    position: 'absolute',
    left: 1,
    right: 1,
    top: 51,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.15)',
    zIndex: 10,
  },
  trackingContent: {
    marginTop: 60,
    flex: 1,
    paddingHorizontal: 20,
  },
  // Action Button
  actionButtonContainer: {
    marginBottom: 20,
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 252,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 148,
    height: 63,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    width: 219,
    height: 23,
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    textAlign: 'center',
    color: '#373934',
  },
  // New Styles
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    marginTop: 16,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right',
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  timelineLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
  },
  timelineLabelCurrent: {
    fontFamily: fonts.family.bold,
    color: '#333',
  },
  timelineLabelCompleted: {
    color: '#333',
  },
  currentStatusBadge: {
    fontSize: 12,
    color: '#10B981',
    fontFamily: fonts.family.medium,
    marginTop: 2,
  },
  chipsContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    maxHeight: 40,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    height: 40,
  },
  chipActive: {
    backgroundColor: '#29B554',
    borderColor: '#29B554',
  },
  chipText: {
    fontFamily: fonts.family.medium,
    color: '#666',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  // Attachments
  attachmentsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attachmentPreview: {
    width: 250,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  }
});

export default ServiceTrackingScreen;
