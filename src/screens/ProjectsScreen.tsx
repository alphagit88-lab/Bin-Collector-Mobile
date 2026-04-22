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
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import AppModal from '../components/AppModal';
import toast from '../utils/toast';

// Import SVG images
import BinCollect2 from '../assets/images/Bin.Collect_2.svg';
import PlayIcon from '../assets/images/play.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Project {
  id: number;
  name: string;
  description: string;
  created_at: string;
  order_count?: number | string;
  orders?: any[];
}

const ProjectsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const userName = user?.name || 'User';

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // Create Project Form State
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get<{ projects: Project[] }>(ENDPOINTS.PROJECTS.MY);
      if (response.success && response.data) {
        setProjects(response.data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleCreateProject = async () => {
    if (!newName.trim()) {
      toast.error('Required', 'Project name is required');
      return;
    }

    setCreating(true);
    try {
      const response = await api.post(ENDPOINTS.PROJECTS.CREATE, {
        name: newName,
        description: newDescription,
      });

      if (response.success) {
        toast.success('Success', 'Project created successfully');
        setCreateModalVisible(false);
        setNewName('');
        setNewDescription('');
        fetchProjects();
      } else {
        toast.error('Error', response.message || 'Failed to create project');
      }
    } catch (error) {
      console.error('Create project error:', error);
      toast.error('Error', 'Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  const handleProjectPress = async (project: Project) => {
    setSelectedProject(project);
    setDetailsModalVisible(true);
    
    // Fetch project details with orders
    try {
      const response = await api.get<{ project: Project, orders: any[] }>(ENDPOINTS.PROJECTS.DETAILS(project.id));
      if (response.success && response.data) {
        setSelectedProject({
          ...response.data.project,
          orders: response.data.orders
        });
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
    }
  };

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

        {/* Create New Project Button */}
        <TouchableOpacity
          style={styles.orderButtonContainer}
          activeOpacity={0.8}
          onPress={() => setCreateModalVisible(true)}>
          <LinearGradient
            colors={['#9CCD17', '#009B5F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.orderButtonGradient}>
            <View style={styles.orderButtonIconContainer}>
              <Ionicons name="add" size={28} color="#009B5F" />
            </View>
            <Text style={styles.orderButtonText}>Create New Project</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* My Projects Section */}
        <View style={styles.myProjectsSection}>
           <Text style={styles.sectionTitle}>My Projects</Text>
           
           {loading && !refreshing ? (
             <View style={{ paddingVertical: 40 }}>
               <ActivityIndicator size="large" color="#9CCD17" />
             </View>
           ) : projects.length === 0 ? (
             <View style={styles.emptyContainer}>
               <Ionicons name="folder-open-outline" size={80} color="#979897" />
               <Text style={styles.emptyText}>No projects yet</Text>
               <Text style={styles.emptySubText}>Create a project to group your orders</Text>
             </View>
           ) : (
             <View style={styles.projectsGrid}>
               {projects.map((project, index) => (
                 <TouchableOpacity
                   key={project.id}
                   style={styles.projectCard}
                   activeOpacity={0.9}
                   onPress={() => handleProjectPress(project)}>
                   <LinearGradient
                     colors={index % 2 === 0 ? ['#C0F96F', '#90B93E'] : ['#A7DB3D', '#D6EF72']}
                     start={{ x: 0, y: 0 }}
                     end={{ x: 0.7, y: 1 }}
                     style={styles.projectCardGradient}>
                     <View style={styles.cardContent}>
                       <View style={styles.cardHeader}>
                         <Text style={styles.cardTitle} numberOfLines={1}>{project.name}</Text>
                         <View style={styles.playButtonContainer}>
                           <PlayIcon width={45} height={45} />
                         </View>
                       </View>
                       <View style={styles.cardStats}>
                         <Text style={styles.cardStatValue}>
                           {Number(project.order_count || 0).toString().padStart(2, '0')}
                         </Text>
                         <Text style={styles.cardStatLabel}>Assigned Orders</Text>
                       </View>
                       <View style={styles.binCollectOverlay}>
                         <BinCollect2 width={192} height={128} />
                       </View>
                     </View>
                   </LinearGradient>
                 </TouchableOpacity>
               ))}
             </View>
           )}
        </View>
      </ScrollView>

      {/* Create Project Modal */}
      <AppModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        title="Create New Project">
        <View style={styles.modalBody}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Home Renovation"
              value={newName}
              onChangeText={setNewName}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Enter project details..."
              multiline
              value={newDescription}
              onChangeText={setNewDescription}
            />
          </View>
          <TouchableOpacity
            style={styles.submitButtonContainer}
            onPress={handleCreateProject}
            disabled={creating}>
            <LinearGradient
              colors={['#9CCD17', '#009B5F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}>
              {creating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Project</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* Project Details Modal */}
      <AppModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        title={selectedProject?.name || 'Project Details'}>
        <View style={styles.modalBody}>
          <Text style={styles.projectDescFull}>{selectedProject?.description || 'No description provided.'}</Text>
          
          <Text style={styles.ordersTitle}>Assigned Orders</Text>
          <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
            {!selectedProject?.orders || selectedProject.orders.length === 0 ? (
              <Text style={styles.noOrdersText}>No orders assigned to this project yet.</Text>
            ) : (
              selectedProject.orders.map((order: any) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderItem}
                  onPress={() => {
                    setDetailsModalVisible(false);
                    (navigation as any).navigate('JobDetail', { booking: order });
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.orderId}>{order.request_id}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#999" style={{ marginLeft: 4 }} />
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                      <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.orderInfo}>
                    {order.service_category === 'service'
                      ? (order.service_names?.split(',')[0] || 'General Service')
                      : order.bin_type_name}
                    {order.bin_size ? ` - ${order.bin_size}` : ''}
                  </Text>
                  <Text style={styles.orderLocation} numberOfLines={1}>
                    <Ionicons name="location-outline" size={12} /> {order.location}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.modalCloseButtonContainer}
            onPress={() => setDetailsModalVisible(false)}>
            <LinearGradient
              colors={['#9CCD17', '#009B5F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}>
              <Text style={styles.submitButtonText}>Close</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </AppModal>

      <BottomNavBar activeTab="dashboard" />
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
  },
  orderButtonContainer: {
    marginHorizontal: 33,
    marginTop: 10,
    marginBottom: 20,
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
  myProjectsSection: {
    paddingHorizontal: 19,
  },
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 22,
    color: '#161616',
    marginBottom: 15,
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  projectCard: {
    width: (SCREEN_WIDTH - 48) / 2,
    height: 183,
    borderRadius: 9,
    overflow: 'hidden',
    marginBottom: 10,
  },
  projectCardGradient: {
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
    fontSize: 18,
    lineHeight: 22,
    color: '#373934',
    flex: 1,
    marginRight: 5,
  },
  playButtonContainer: {
    width: 45,
    height: 45,
  },
  cardStats: {
    marginTop: 'auto',
  },
  cardStatValue: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#161616',
  },
  cardStatLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#373934',
    marginTop: 2,
  },
  binCollectOverlay: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.34,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#979897',
    marginTop: 10,
  },
  emptySubText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#979897',
    marginTop: 5,
  },
  modalBody: {
    padding: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButtonContainer: {
    marginTop: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  projectDescFull: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 22,
  },
  ordersTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#161616',
    marginBottom: 15,
  },
  ordersList: {
    maxHeight: 300,
  },
  noOrdersText: {
    fontFamily: fonts.family.light,
    fontStyle: 'italic',
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  orderItem: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: fonts.family.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  orderInfo: {
    fontFamily: fonts.family.regular,
    fontSize: 15,
    color: '#555',
  },
  orderLocation: {
    fontFamily: fonts.family.regular,
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  modalCloseButtonContainer: {
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
});

export default ProjectsScreen;
