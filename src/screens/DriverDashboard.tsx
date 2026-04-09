import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { useAuth } from '../contexts/AuthContext';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';

// Icons

const { width: screenWidth } = Dimensions.get('window');

const DriverDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    active: 0,
    completed: 0
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [jobsRes, notificationRes, messageRes] = await Promise.all([
        api.get<any>(ENDPOINTS.BOOKINGS.SUPPLIER_REQUESTS),
        api.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
        api.get<{ count: number }>(ENDPOINTS.MESSAGES.UNREAD_COUNT),
      ]);
      if (jobsRes.success && jobsRes.data) {
        const jobs = jobsRes.data.requests || [];
        setRecentJobs(jobs.slice(0, 5));
        
        const active = jobs.filter((j: any) => 
          ['confirmed', 'on_delivery', 'pickup', 'ready_to_pickup'].includes(j.status)
        ).length;
        
        const completed = jobs.filter((j: any) => j.status === 'delivered' || j.status === 'completed').length;
        
        setStats({ active, completed });
      }
      if (notificationRes.success && notificationRes.data) {
        setNotificationCount(Number(notificationRes.data.count) || 0);
      }
      if (messageRes.success && messageRes.data) {
        setMessageCount(Number(messageRes.data.count) || 0);
      }
    } catch (error) {
      console.error('Error fetching driver dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleJobPress = (job: any) => {
    navigation.navigate('JobDetail' as never, { booking: job } as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#37B112']} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Hello,</Text>
                <Text style={styles.userNameText}>{user?.name || 'Driver'}</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity 
                  style={styles.headerIconButton} 
                  onPress={() => navigation.navigate('Notifications' as never)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                  </View>
                  {notificationCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerIconButton} 
                  onPress={() => navigation.navigate('MessageInbox' as never)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="chatbox-outline" size={22} color="#FFFFFF" />
                  </View>
                  {messageCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.badgeText}>{messageCount > 99 ? '99+' : messageCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.headerProfileButton} 
                  onPress={() => navigation.navigate('Account' as never)}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Cards Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active Jobs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Recent Jobs Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('DriverJobs' as never)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#37B112" style={{ marginTop: 20 }} />
          ) : recentJobs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="briefcase-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No jobs assigned yet</Text>
            </View>
          ) : (
            recentJobs.map((job) => (
              <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => handleJobPress(job)}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobId}>#{job.request_id}</Text>
                  <Text style={styles.jobLocation}>{job.location}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(job.status) }]}>
                      {job.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Links */}
        <View style={styles.sectionContainer}>
           <Text style={styles.sectionTitle}>Main Menu</Text>
           <View style={styles.menuGrid}>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('DriverJobs' as never)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#EBF7FF' }]}>
                  <Ionicons name="list" size={24} color="#3B82F6" />
                </View>
                <Text style={styles.menuText}>My Jobs</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Account' as never)}>
                <View style={[styles.menuIconContainer, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="person" size={24} color="#10B981" />
                </View>
                <Text style={styles.menuText}>Account</Text>
             </TouchableOpacity>
           </View>
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <SupplierBottomNavBar activeTab="dashboard" />
    </View>
  );
};

const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10B981';
      case 'on_delivery': return '#3B82F6';
      case 'delivered': return '#6B7280';
      case 'ready_to_pickup': return '#F59E0B';
      case 'pickup': return '#8B5CF6';
      case 'completed': return '#059669';
      default: return '#9CA3AF';
    }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerGradient: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  userNameText: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#FFF',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconButton: {
    position: 'relative',
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
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#37B112',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.family.bold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  statNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#FFF',
  },
  statLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#17360F',
  },
  seeAllText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#37B112',
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  jobInfo: {
    flex: 1,
  },
  jobId: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#17360F',
    marginBottom: 4,
  },
  jobLocation: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  menuGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  menuItem: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
  },
  menuIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  menuText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#17360F',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 40,
  }
});

export default DriverDashboard;
