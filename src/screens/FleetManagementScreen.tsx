import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert, // Keeping Alert for confirmation dialog
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import AppModal from '../components/AppModal';
import AppConfirmModal from '../components/AppConfirmModal';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast'; // Added toast import

// Header truck/logo SVGs
import Logo14_1 from '../assets/images/14_1.svg';
import Svg14 from '../assets/images/14.svg';
// replaced AddBinIcon SVG import due to bundler resolution issues
import EditIcon from '../assets/images/35 2.svg';
import DeleteIcon from '../assets/images/35 3.svg';

const { width: screenWidth } = Dimensions.get('window');

interface BinItem {
  id: number;
  bin_code: string;
  bin_type_name: string;
  bin_size: string;
  status: string;
  notes?: string;
}

interface BinType {
  id: number;
  name: string;
}

interface BinSize {
  id: number;
  size: string;
}

const FleetManagementScreen: React.FC = () => {
  const navigation = useNavigation();
  const [bins, setBins] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [binTypes, setBinTypes] = useState<BinType[]>([]);
  const [binSizes, setBinSizes] = useState<BinSize[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fetchingSizes, setFetchingSizes] = useState(false);
  const [statusLoading, setStatusLoading] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{ binId: number; status: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get<{ bins: BinItem[] }>(ENDPOINTS.BINS.PHYSICAL);
      if (response.success && response.bins) {
        setBins(response.bins || []);
      }
    } catch (error) {
      console.error('Error fetching bins:', error);
      toast.error('Error', 'Failed to fetch fleet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchTypes = async () => {
    try {
      const response = await api.get<{ binTypes: BinType[] }>(ENDPOINTS.BINS.TYPES);
      if (response.success && response.data) {
        setBinTypes(response.data.binTypes);
      }
    } catch (error) {
      console.error('Error fetching types:', error);
    }
  };

  const fetchSizes = async (typeId: number) => {
    setFetchingSizes(true);
    try {
      const response = await api.get<{ binSizes: BinSize[] }>(ENDPOINTS.BINS.SIZES(typeId));
      if (response.success && response.data) {
        setBinSizes(response.data.binSizes);
      }
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setFetchingSizes(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTypes();
  }, [fetchData]);

  useEffect(() => {
    if (selectedTypeId) {
      setSelectedSizeId(''); // Clear previous size selection when type changes
      fetchSizes(parseInt(selectedTypeId));
    } else {
      setBinSizes([]);
      setSelectedSizeId('');
    }
  }, [selectedTypeId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddNewBin = async () => {
    const typeNeedsSize = binSizes.length > 0;

    if (!selectedTypeId || (typeNeedsSize && !selectedSizeId)) {
      toast.error('Validation Error', `Please select bin type${typeNeedsSize ? ' and size' : ''}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(ENDPOINTS.BINS.PHYSICAL, {
        bin_type_id: parseInt(selectedTypeId),
        bin_size_id: selectedSizeId ? parseInt(selectedSizeId) : null,
        notes: notes || undefined,
      });

      if (response.success) {
        toast.success('Success', 'Bin added successfully');
        setShowAddModal(false);
        setSelectedTypeId('');
        setSelectedSizeId('');
        setNotes('');
        fetchData();
      } else {
        toast.error('Error', response.message || 'Failed to add bin');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while adding bin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = (binId: number, status: string) => {
    setPendingUpdate({ binId, status });
    setConfirmVisible(true);
  };

  const executeStatusUpdate = async () => {
    if (!pendingUpdate) return;
    const { binId, status } = pendingUpdate;
    setConfirmVisible(false);

    try {
      const response = await api.put(ENDPOINTS.BINS.UPDATE_PHYSICAL(binId), { status });
      if (response.success) {
        fetchData();
      } else {
        toast.error('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while updating status');
    }
  };

  const handleRemoveBin = (binId: number) => {
    handleUpdateStatus(binId, 'unavailable');
  };

  const renderBinCard = (bin: BinItem, index: number) => (
    <LinearGradient
      key={bin.id}
      colors={['#EFF2F0', '#EAFFCC']}
      locations={[0.2377, 0.6629]}
      start={{ x: 0.11, y: 0 }}
      end={{ x: 0.89, y: 1 }}
      style={styles.binCard}>
      {/* Bin Details Row */}
      <View style={styles.binDetailsRow}>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin Code</Text>
          <Text style={styles.binDetailValue}>{bin.bin_code}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin Type</Text>
          <Text style={styles.binDetailValue}>{bin.bin_type_name}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Bin Size</Text>
          <Text style={styles.binDetailValue}>{bin.bin_size}</Text>
        </View>
        <View style={styles.binDetailColumn}>
          <Text style={styles.binDetailLabel}>Status:</Text>
          <Text style={[styles.binDetailValue, { color: bin.status === 'available' ? '#10B981' : '#EF4444' }]}>
            {bin.status.replace(/_/g, ' ').charAt(0).toUpperCase() + bin.status.replace(/_/g, ' ').slice(1)}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: '#CCC' }]}
          onPress={() => { }}
          disabled={true}
          activeOpacity={0.8}>
          <View style={styles.buttonIconContainer}>
            <EditIcon width={21} height={17} />
          </View>
          <Text style={styles.editButtonText}>Edit Bin</Text>
        </TouchableOpacity>

        {bin.status === 'available' ? (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveBin(bin.id)}
            activeOpacity={0.8}>
            <View style={styles.buttonIconContainer}>
              <DeleteIcon width={21} height={17} />
            </View>
            <Text style={styles.removeButtonText}>Unavailable</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: bin.status === 'unavailable' ? '#10B981' : '#CCC' }]}
            onPress={() => handleUpdateStatus(bin.id, 'available')}
            disabled={bin.status !== 'unavailable'}
            activeOpacity={0.8}>
            <View style={styles.buttonIconContainer}>
              <EditIcon width={21} height={17} />
            </View>
            <Text style={styles.editButtonText}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{ x: 0.12, y: 0.05 }}
            end={{ x: 0.88, y: 0.95 }}
            style={styles.headerGradient}>
            {/* Overlay */}
            <LinearGradient
              colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayGradient}
              pointerEvents="none"
            />

            {/* Title and Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operations</Text>
              <Text style={styles.headerSubtitle}>Edit service coverage</Text>
            </View>

            {/* Decorative Image (truck/logo) */}
            <View style={styles.decorativeImageContainer}>
              <Logo14_1 width={148} height={63} />
            </View>

            {/* Large truck SVG */}
            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Fleet Management Card */}
        <View style={styles.fleetManagementContainer}>
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{ x: 0.146, y: 0 }}
            end={{ x: 0.854, y: 1 }}
            style={styles.fleetManagementCard}>
            {/* Background pattern overlay */}
            <View style={styles.patternOverlay} />

            {/* Title Row */}
            <View style={styles.fleetTitleRow}>
              <Text style={styles.fleetManagementTitle}>Fleet Management</Text>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.8}>
                <Text style={styles.backButtonText}>Back</Text>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrow}> › </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Add New Bin Button */}
            <TouchableOpacity
              style={styles.addNewBinButton}
              onPress={() => {
                fetchTypes();
                setShowAddModal(true);
              }}
              activeOpacity={0.85}>
              <LinearGradient
                colors={['rgba(137, 217, 87, 0.2)', 'rgba(137, 217, 87, 0.2)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.addNewBinOverlay}
              />
              <LinearGradient
                colors={['#9CCD17', '#009B5F']}
                locations={[0, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.addNewBinGradient}>
                <View style={styles.addBinIconCircle}>
                  <Text style={styles.addBinPlus}>+</Text>
                </View>
                <Text style={styles.addNewBinText}>Add New Bin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Bins List Container */}
        <View style={styles.binsListContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.11, y: 0 }}
            end={{ x: 0.89, y: 1 }}
            style={styles.binsListCard}>
            {/* Fleet Management Header */}
            <Text style={styles.binsListTitle}>Fleet Management</Text>

            {/* Bins List */}
            {loading ? (
              <ActivityIndicator size="large" color={themeColors.primary} style={{ marginVertical: 40 }} />
            ) : bins.length === 0 ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.family.regular, color: '#666' }}>No bins found</Text>
              </View>
            ) : (
              bins.map((bin, index) => renderBinCard(bin, index))
            )}

            {/* View All Link */}
            <View style={styles.viewAllContainer}>
              <TouchableOpacity activeOpacity={0.7} onPress={fetchData}>
                <Text style={styles.viewAllText}>Refresh items</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Bin Modal */}
      <AppModal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Bin</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bin Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                {binTypes.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setSelectedTypeId(type.id.toString())}
                    style={[
                      styles.typeChip,
                      selectedTypeId === type.id.toString() && styles.typeChipSelected
                    ]}>
                    <Text style={[
                      styles.typeChipText,
                      selectedTypeId === type.id.toString() && styles.typeChipTextSelected
                    ]}>
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {(!selectedTypeId || (selectedTypeId && binSizes.length > 0)) && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bin Size</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                  {binSizes.length === 0 ? (
                    <Text style={styles.emptyText}>Select type first</Text>
                  ) : (
                    binSizes.map(size => (
                      <TouchableOpacity
                        key={size.id}
                        onPress={() => setSelectedSizeId(size.id.toString())}
                        style={[
                          styles.typeChip,
                          selectedSizeId === size.id.toString() && styles.typeChipSelected
                        ]}>
                        <Text style={[
                          styles.typeChipText,
                          selectedSizeId === size.id.toString() && styles.typeChipTextSelected
                        ]}>
                          {size.size}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: Located at south gate..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, (submitting || fetchingSizes) && { opacity: 0.7 }]}
                onPress={handleAddNewBin}
                disabled={submitting || fetchingSizes}>
                {submitting || fetchingSizes ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add Bin</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>

      <AppConfirmModal
        visible={confirmVisible}
        title="Update Status"
        message={`Are you sure you want to mark this bin as ${pendingUpdate?.status}?`}
        onConfirm={executeStatusUpdate}
        onCancel={() => setConfirmVisible(false)}
      />

      <OperationsBottomNavBar activeTab="operations" />
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
    marginBottom: 16,
  },
  headerGradient: {
    height: 241,
    paddingTop: 20,
    paddingHorizontal: 19,
    position: 'relative',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  headerTextContainer: {
    zIndex: 3,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    lineHeight: 28,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    lineHeight: 17,
    color: '#FFFFFF',
    marginTop: 4,
  },
  decorativeImageContainer: {
    position: 'absolute',
    right: 0,
    top: 9,
    width: 148,
    height: 63,
    zIndex: 2,
  },
  headerSvgContainer: {
    position: 'absolute',
    left: 2,
    top: 64,
    width: screenWidth - 4,
    height: 177,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
  },

  // Fleet Management Card Section
  fleetManagementContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  fleetManagementCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  fleetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  fleetManagementTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
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
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backArrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 14,
    color: '#252525',
    fontWeight: 'bold',
    marginLeft: 1,
  },
  addNewBinButton: {
    borderRadius: 38,
    overflow: 'hidden',
  },
  addNewBinOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  addNewBinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  addBinIconCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addBinPlus: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    color: '#009B5F',
    lineHeight: 20,
  },
  addNewBinText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Bins List Section
  binsListContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  binsListCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 10,
  },
  binsListTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  binCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 14,
    marginBottom: 12,
  },
  binDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  binDetailColumn: {
    flex: 1,
  },
  binDetailLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
    marginBottom: 4,
  },
  binDetailValue: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    lineHeight: 15,
    color: '#242424',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#89D957',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  buttonIconContainer: {
    marginRight: 6,
  },
  editButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  removeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  removeButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 15,
    color: '#FFFFFF',
  },
  viewAllContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginRight: 4,
  },
  viewAllText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    lineHeight: 19,
    color: '#FFFFFF',
  },

  // Job Management Tab
  jobManagementContainer: {
    paddingHorizontal: 19,
    marginBottom: 16,
  },
  jobManagementTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFFC7',
    borderRadius: 12,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  jobIconPlaceholder: {
    width: 35,
    height: 28,
    marginRight: 8,
  },
  jobManagementText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#4E4B4B',
  },

  bottomSpacing: {
    height: 120,
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
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  typeChipSelected: {
    backgroundColor: '#37B112',
    borderColor: '#37B112',
  },
  typeChipText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#666',
  },
  typeChipTextSelected: {
    color: '#FFF',
  },
  emptyText: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#37B112',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFF',
  },
});

export default FleetManagementScreen;
