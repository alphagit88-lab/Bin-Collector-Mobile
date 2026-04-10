import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import AppModal from '../components/AppModal';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

const { width: screenWidth } = Dimensions.get('window');

interface Driver {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: string;
  created_at: string;
}

const SupplierDriversScreen: React.FC = () => {
  const navigation = useNavigation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const response = await api.get<{ drivers: Driver[] }>(ENDPOINTS.SUPPLIER.DRIVERS);
      if (response.success && response.data) {
        setDrivers(response.data.drivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Error', 'Failed to fetch drivers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDrivers();
  };

  const handleAddDriver = async () => {
    if (!name || !phone || !password) {
      toast.error('Missing Info', 'Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post(ENDPOINTS.SUPPLIER.DRIVERS, {
        name,
        phone,
        email,
        password,
        role: 'driver'
      });

      if (response.success) {
        toast.success('Success', 'Driver added successfully');
        setShowAddModal(false);
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        fetchDrivers();
      } else {
        toast.error('Error', response.message || 'Failed to add driver');
      }
    } catch (error) {
      console.error('Add driver error:', error);
      toast.error('Error', 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
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
          <Text style={styles.headerTitle}>My Drivers</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#37B112']} />
        }>
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fleet Drivers</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <LinearGradient
                colors={['#37B112', '#77C40A']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addButtonText}>Add Driver</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#37B112" style={{ marginTop: 40 }} />
          ) : drivers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No drivers added yet</Text>
              <Text style={styles.emptySubtext}>Add drivers to assign them bookings</Text>
            </View>
          ) : (
            drivers.map((driver) => (
              <View key={driver.id} style={styles.driverCard}>
                <View style={styles.driverIconContainer}>
                  <Ionicons name="person" size={24} color="#37B112" />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.name}</Text>
                  <Text style={styles.driverPhone}>{driver.phone}</Text>
                  {driver.email && <Text style={styles.driverEmail}>{driver.email}</Text>}
                </View>
              </View>
            ))
          )}
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <AppModal
        visible={showAddModal}
        onRequestClose={() => !submitting && setShowAddModal(false)}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Driver</Text>
              <TouchableOpacity onPress={() => !submitting && setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#17360F" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter driver name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 0771234567"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="driver@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Initial Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Min 6 characters"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleAddDriver}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#37B112', '#77C40A']}
                  style={styles.submitButtonGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </AppModal>

      <OperationsBottomNavBar activeTab="operations" />
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#17360F',
  },
  addButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFF',
    fontFamily: fonts.family.semiBold,
    fontSize: 12,
    marginLeft: 4,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  driverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(55, 177, 18, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#17360F',
    marginBottom: 2,
  },
  driverPhone: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#666',
  },
  driverEmail: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#17360F',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#17360F',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#111827',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 10,
  },
  submitButtonGradient: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  submitButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFF',
  },
  bottomSpacing: {
    height: 100,
  },
});

export default SupplierDriversScreen;
