import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

interface Job {
  id: number;
  request_id: string;
  location: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  service_category?: string;
  bin_type_name?: string;
  bin_size?: string;
  start_date: string;
  end_date: string;
}

const DriverJobsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get<{ requests: Job[] }>(ENDPOINTS.BOOKINGS.SUPPLIER_REQUESTS);
      if (response.success && response.data) {
        setJobs(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching driver jobs:', error);
      toast.error('Error', 'Failed to fetch your jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [fetchJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const filteredJobs = jobs.filter(job => {
    if (filter === 'active') {
      return !['delivered', 'completed', 'cancelled'].includes(job.status);
    } else {
      return ['delivered', 'completed'].includes(job.status);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'on_delivery': return '#3B82F6';
      case 'ready_to_pickup': return '#F59E0B';
      case 'pickup': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#37B112', '#77C40A']}
          style={styles.headerGradient}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Assigned Jobs</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, filter === 'active' && styles.activeTab]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.tabText, filter === 'active' && styles.activeTabText]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'completed' && styles.activeTab]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.tabText, filter === 'completed' && styles.activeTabText]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#37B112']} />
        }
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="large" color="#37B112" style={{ marginTop: 40 }} />
          ) : filteredJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="clipboard-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No {filter} jobs found</Text>
            </View>
          ) : (
            filteredJobs.map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => navigation.navigate('JobDetail', { booking: job })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.requestId}>#{job.request_id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1}>{job.location}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{job.customer_name}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="cube-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {job.service_category === 'service' ? 'Labour/Service' : `${job.bin_size} ${job.bin_type_name}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.dateText}>
                    {new Date(job.start_date).toLocaleDateString()}
                  </Text>
                  <View style={styles.viewDetail}>
                    <Text style={styles.viewDetailText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={14} color="#37B112" />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      <SupplierBottomNavBar activeTab="jobs" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    height: 70,
  },
  headerGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#FFF',
  },
  placeholder: {
    width: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 4,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#37B112',
  },
  tabText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },
  requestId: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#17360F',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: fonts.family.bold,
    fontSize: 10,
  },
  cardBody: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  dateText: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    color: '#888',
  },
  viewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontFamily: fonts.family.bold,
    fontSize: 12,
    color: '#37B112',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});

export default DriverJobsScreen;
