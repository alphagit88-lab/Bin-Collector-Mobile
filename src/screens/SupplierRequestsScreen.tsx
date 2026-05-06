import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { api, BASE_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { Image } from 'react-native';
import toast from '../utils/toast';

// Shared visual style with SupplierJobsScreen
import BannerImage from '../assets/images/4 1.svg';
import ViewArrow from '../assets/images/Ellipse 11.svg';

interface OrderItem {
  id: number;
  bin_type_name: string;
  bin_size: string;
  price?: string;
}

interface Job {
  id: number;
  request_id: string;
  bin_type_name: string;
  bin_size: string;
  order_items_count: number;
  location: string;
  status: string;
  total_price?: string;
  estimated_price?: string;
  orderItems?: OrderItem[];
  items?: OrderItem[];
  start_date: string;
  end_date: string;
  attachment_url?: string;
  customer_name?: string;
  customer_phone?: string;
  payment_method?: string;
  latitude?: number;
  longitude?: number;
  delivery_photo_url?: string;
  service_category?: string;
  service_names?: string;
  selected_services_count?: number;
}

const SupplierRequestsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = React.useRef<MapView>(null);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const response = await api.get<{ requests: Job[] }>(ENDPOINTS.BOOKINGS.PENDING);

      if (response.success && response.data) {
        setPendingJobs(response.data.requests);
      } else {
        toast.error('Error', response.message || 'Failed to fetch pending requests');
        if (response.debugInfo) console.log('Debug Info:', response.debugInfo);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      toast.error('Error', `Failed to fetch pending requests: ${error instanceof Error ? error.message : 'Network error'}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPendingRequests();
    }, [fetchPendingRequests])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const getFilteredRequests = () => {
    if (!searchQuery.trim()) return pendingJobs;
    const query = searchQuery.toLowerCase();
    return pendingJobs.filter(job => {
      return (
        job.request_id.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.bin_type_name?.toLowerCase().includes(query) ||
        job.service_names?.toLowerCase().includes(query) ||
        job.customer_name?.toLowerCase().includes(query)
      );
    });
  };

  const fitMapToPins = useCallback(() => {
    if (!mapRef.current) return;

    const filtered = getFilteredRequests();
    const coords = filtered
      .filter(j => j.latitude && j.longitude)
      .map(j => ({
        latitude: parseFloat(String(j.latitude)),
        longitude: parseFloat(String(j.longitude)),
      }));

    if (coords.length > 0) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [pendingJobs, searchQuery]);

  useEffect(() => {
    if (viewMode === 'map') {
      const timer = setTimeout(fitMapToPins, 500);
      return () => clearTimeout(timer);
    }
  }, [viewMode, pendingJobs, searchQuery, fitMapToPins]);

  const handleViewJob = (job: Job) => {
    navigation.navigate('JobDetail', {
      job: {
        id: job.id,
        orderId: job.request_id,
        binType: job.bin_type_name,
        binSize: job.bin_size,
        itemsCount: job.order_items_count,
        total: job.total_price || job.estimated_price || '$0.00',
        location: job.location,
        status: job.status,
        orderItems: job.items || job.orderItems || [],
        deliveryDate: job.start_date ? new Date(job.start_date).toLocaleDateString() : 'N/A',
        pickupDate: job.end_date ? new Date(job.end_date).toLocaleDateString() : 'N/A',
        customerName: job.customer_name || 'N/A',
        customerId: job.id.toString(),
        customerPhone: job.customer_phone,
        attachment_url: job.attachment_url,
        payment_method: job.payment_method,
        latitude: job.latitude,
        longitude: job.longitude,
        delivery_photo_url: job.delivery_photo_url,
        service_category: job.service_category,
        service_names: job.service_names,
        selected_services_count: job.selected_services_count,
      },
    });
  };

  const renderJobItem = (job: Job, index: number) => (
    <View key={job.id} style={styles.jobRow}>
      <View style={styles.jobColumn}>
        {index === 0 && <Text style={styles.columnHeader}>Bin Type / Service</Text>}
        <View style={styles.binTypeCell}>
          <Text style={styles.jobText} numberOfLines={1}>
            {job.service_category === 'service'
              ? (job.service_names?.split(',')[0] || 'Unknown')
              : job.bin_type_name}
          </Text>
          {job.service_category === 'service' ? (
            (job.selected_services_count || 0) > 1 && (
              <View style={styles.moreBadge}>
                <Text style={styles.moreBadgeText}>+{(job.selected_services_count || 0) - 1} more</Text>
              </View>
            )
          ) : (
            (job.order_items_count || 0) > 1 && (
              <View style={styles.moreBadge}>
                <Text style={styles.moreBadgeText}>+{(job.order_items_count || 0) - 1} more</Text>
              </View>
            )
          )}
        </View>
      </View>
      <View style={styles.jobColumn}>
        {index === 0 && (
          <Text style={styles.columnHeader}>Size/Capacity</Text>
        )}
        <Text style={styles.jobText}>{job.bin_size}</Text>
      </View>
      <View style={styles.actionColumn}>
        {index === 0 && <Text style={styles.columnHeaderAction}>Action</Text>}
        <TouchableOpacity
          style={styles.viewButton}
          activeOpacity={0.7}
          onPress={() => handleViewJob(job)}>
          <LinearGradient
            colors={['#1F1F1F', '#2B2B2B']}
            locations={[0, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.viewButtonGradient}>
            <Text style={styles.viewButtonText}>View</Text>
            <View style={styles.viewArrow}>
              <ViewArrow width={14} height={14} />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#37B112']} />
        }>
        {/* Header Section - same as Jobs screen */}
        <View style={styles.headerContainer}>
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
        </View>

        {/* Pending Requests Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.jobsListCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.jobsListGradient}>
              <View style={styles.jobsListContainer}>
                <View style={styles.jobsListHeader}>
                  <Text style={styles.sectionTitle}>Pending Requests</Text>
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
                    placeholder="Search by ID, location or bin type..."
                    placeholderTextColor="#979897"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#979897" />
                    </TouchableOpacity>
                  )}
                </View>

                {loading && !refreshing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#37B112" />
                  </View>
                ) : viewMode === 'list' ? (
                  getFilteredRequests().length > 0 ? (
                    getFilteredRequests().map((job, index) => renderJobItem(job, index))
                  ) : (
                    <Text style={styles.emptyText}>No pending requests available</Text>
                  )
                ) : (
                  <View style={styles.mapWrapper}>
                    <MapView
                      ref={mapRef}
                      provider={PROVIDER_GOOGLE}
                      style={styles.map}
                      initialRegion={{
                        latitude: -37.8136,
                        longitude: 144.9631,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                      }}
                    >
                      {getFilteredRequests().filter(j => j.latitude && j.longitude).map(job => (
                        <Marker
                          key={job.id}
                          coordinate={{
                            latitude: parseFloat(String(job.latitude)),
                            longitude: parseFloat(String(job.longitude)),
                          }}
                          onPress={() => handleViewJob(job)}
                        >
                          <Callout>
                            <View style={styles.calloutContainer}>
                              <Text style={styles.calloutTitle}>{job.request_id}</Text>
                              <Text style={styles.calloutText}>{job.customer_name || 'New Customer'}</Text>
                              <Text style={styles.calloutText}>{job.location}</Text>
                            </View>
                          </Callout>
                        </Marker>
                      ))}
                    </MapView>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="requests" />
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
  headerGradient: {
    width: '100%',
    paddingTop: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#242424',
    marginBottom: 12,
  },
  jobsListCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  jobsListGradient: {
    flex: 1,
  },
  jobsListContainer: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobColumn: {
    flex: 1,
  },
  actionColumn: {
    width: 80,
    alignItems: 'center',
  },
  columnHeader: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
  },
  columnHeaderAction: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 8,
    textAlign: 'center',
  },
  jobText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 4,
  },
  binTypeCell: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  moreBadge: {
    backgroundColor: '#37B11220',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  moreBadgeText: {
    fontFamily: fonts.family.medium,
    fontSize: 10,
    color: '#37B112',
  },
  viewButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#FFFFFF',
    marginRight: 4,
  },
  viewArrow: {
    marginLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 40,
  },
  bottomSpacing: {
    height: 100,
  },
  // New styles for search and toggle
  jobsListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
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
});

export default SupplierRequestsScreen;
