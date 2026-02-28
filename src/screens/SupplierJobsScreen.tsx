import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import { useSocket } from '../contexts/SocketContext';
import { api, BASE_URL } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { Image } from 'react-native';
import toast from '../utils/toast';

// Import SVG icons
import BannerImage from '../assets/images/4 1.svg';
import TruckIcon from '../assets/images/14_1.svg';
import ViewArrow from '../assets/images/Ellipse 11.svg';

type JobCategory =
  | 'pending'
  | 'confirmed'
  | 'inProgress'
  | 'completed'
  | 'cancelled'
  | 'all';

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
  customer_name: string;
  customer_phone: string;
  attachment_url?: string;
  payment_method?: string;
}

const categoryLabels: Record<JobCategory, string> = {
  pending: 'Pending Requests',
  confirmed: 'Confirmed Bookings',
  inProgress: 'In-Progress Jobs',
  completed: 'Completed Jobs',
  cancelled: 'Cancelled Jobs',
  all: 'All Jobs',
};

const SupplierJobsScreen: React.FC = () => {
  const { socket } = useSocket();
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState<JobCategory>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get<{ requests: Job[] }>(ENDPOINTS.BOOKINGS.SUPPLIER_REQUESTS);
      if (response.success && response.data) {
        setJobs(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Error', 'Failed to fetch jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const route = useRoute<any>();

  useFocusEffect(
    useCallback(() => {
      if (route.params?.initialCategory) {
        setSelectedCategory(route.params.initialCategory);
        navigation.setParams({ initialCategory: undefined });
      }
      fetchJobs();
    }, [fetchJobs, route.params])
  );

  useEffect(() => {
    if (socket) {
      const handleRefresh = (data?: any) => {
        console.log('Refreshing jobs due to socket update...');
        fetchJobs();

        if (data && data.status === 'ready_to_pickup') {
          toast.info('New Update', data.message || 'A bin is ready for pickup!');
        }
      };

      socket.on('new_request', handleRefresh);
      socket.on('status_update', handleRefresh);

      return () => {
        socket.off('new_request', handleRefresh);
        socket.off('status_update', handleRefresh);
      };
    }
  }, [socket, fetchJobs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getFilteredJobs = () => {
    if (selectedCategory === 'all') return jobs;
    if (selectedCategory === 'inProgress') {
      return jobs.filter(j => ['on_delivery', 'delivered', 'ready_to_pickup', 'pickup'].includes(j.status));
    }
    return jobs.filter(j => j.status === selectedCategory);
  };

  const getCategoryCount = (category: JobCategory) => {
    if (category === 'all') return jobs.length;
    if (category === 'inProgress') {
      return jobs.filter(j => ['on_delivery', 'delivered', 'ready_to_pickup', 'pickup'].includes(j.status)).length;
    }
    return jobs.filter(j => j.status === category).length;
  };

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
        deliveryDate: new Date(job.start_date).toLocaleDateString(),
        pickupDate: new Date(job.end_date).toLocaleDateString(),
        customerName: job.customer_name,
        customerId: job.id.toString(), // or job.customer_id if you want the user id
        customerPhone: job.customer_phone,
        attachment_url: job.attachment_url,
        payment_method: job.payment_method,
      },
    });
  };

  const renderJobItem = (job: Job, index: number) => (
    <View key={job.id} style={styles.jobRow}>
      <View style={styles.jobColumn}>
        {index === 0 && <Text style={styles.columnHeader}>Bin Type</Text>}
        <View style={styles.binTypeCell}>
          <Text style={styles.jobText}>{job.bin_type_name}</Text>
          {job.order_items_count > 1 && (
            <View style={styles.moreBadge}>
              <Text style={styles.moreBadgeText}>+{job.order_items_count - 1} more</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.jobColumn}>
        {index === 0 && (
          <Text style={styles.columnHeader}>Bin Size/Capacity</Text>
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

  // always render grid below

  const categoryColor = (category: JobCategory) => {
    switch (category) {
      case 'pending':
        return '#FF8A00';
      case 'confirmed':
        return '#0B63FF';
      case 'inProgress':
      case 'completed':
      case 'cancelled':
        return '#2F9E00';
      default:
        return '#2F9E00';
    }
  };

  const renderGridCard = (category: JobCategory) => {
    const label = categoryLabels[category];
    // Use design counts to match the provided screenshot (second image)
    const count = String(getCategoryCount(category)).padStart(2, '0');
    const color = categoryColor(category);
    const isSelected = selectedCategory === category;

    return (
      <TouchableOpacity
        key={category + Math.random()}
        activeOpacity={0.8}
        onPress={() => setSelectedCategory(category)}
        style={[styles.gridCard, isSelected && styles.gridCardSelected]}>
        {isSelected && (
          <LinearGradient
            colors={['#D0FF33', '#C7FFD3']}
            locations={[0.1564, 0.762]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.gridCardSelectedBackground}
          />
        )}
        <View style={styles.gridCardContent}>
          <Text style={[styles.gridCount, { color }]}>{count}</Text>
          <Text style={[styles.gridLabel, isSelected && { color: '#242424' }]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Remove expanded layout: always show 2x3 grid (matches second image)

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient */}
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
              <View style={styles.truckIconContainer}>
                <TruckIcon width={148} height={63} />
              </View>
            </View>
            <View style={styles.bannerContainer}>
              <BannerImage width={428} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Job Management Categories Section (updated layout) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Job Management</Text>

          <View style={styles.categoriesWrapperGrid}>
            {/* Render a 2x3 grid to match the second image layout */}
            <View style={styles.gridRow}>
              {renderGridCard('pending')}
              {renderGridCard('confirmed')}
            </View>
            <View style={styles.gridRow}>
              {renderGridCard('inProgress')}
              {renderGridCard('completed')}
            </View>
          </View>
        </View>

        {/* Jobs List Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.jobsListCard}>
            <LinearGradient
              colors={['#EFF2F0', '#EAFFCC']}
              locations={[0.2377, 0.6629]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.jobsListGradient}>
              <View style={styles.jobsListContainer}>
                <Text style={styles.sectionTitle}>
                  {categoryLabels[selectedCategory]}
                </Text>
                {loading && !refreshing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#37B112" />
                  </View>
                ) : getFilteredJobs().length > 0 ? (
                  getFilteredJobs().map((job: Job, index: number) => renderJobItem(job, index))
                ) : (
                  <Text style={styles.emptyText}>No jobs in this category</Text>
                )}
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="jobs" />
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
    paddingTop: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 19,
    paddingTop: 40,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#242424',
    marginBottom: 12,
  },
  categoriesGrid: {
    width: '100%',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryButton: {
    width: '48%',
    height: 61,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryButtonLeft: {
    marginRight: 4,
  },
  categoryButtonRight: {
    marginLeft: 4,
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(137, 217, 87, 0.2)',
    borderColor: '#6DBC00',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryCount: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#242424',
    marginRight: 8,
  },
  categoryCountSelected: {
    color: '#6DBC00',
  },
  categoryLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 13,
    lineHeight: 16,
    color: '#242424',
    flex: 1,
  },
  categoryLabelSelected: {
    color: '#6DBC00',
    fontFamily: fonts.family.medium,
  },
  /* Grid layout (2 columns x 3 rows) */
  categoriesWrapperGrid: {
    backgroundColor: '#E9FFD8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridCard: {
    width: '48%',
    height: 61,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    justifyContent: 'center',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  gridCardSelected: {
    borderColor: 'transparent',
  },
  gridCardSelectedBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  gridCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCount: {
    fontFamily: fonts.family.extraBold,
    fontSize: 36,
    marginRight: 10,
  },
  gridLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 13,
    color: '#242424',
    flexShrink: 1,
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
    color: themeColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierJobsScreen;
