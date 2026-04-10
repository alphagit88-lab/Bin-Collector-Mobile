import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import AppModal from '../components/AppModal';
import AppConfirmModal from '../components/AppConfirmModal';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

// Header truck/logo SVGs
import Svg14 from '../assets/images/3_1.svg';
import CloseIcon from '../assets/images/35 3.svg';
import BinCollectBg from '../assets/images/Bin.Collect_2.svg';
import AddIcon from '../assets/images/Bin.Collect (1) 1.svg';
import Rectangle11 from '../assets/images/Rectangle 11.svg';

const { width: screenWidth } = Dimensions.get('window');

interface ServiceZoneData {
  id: string;
  country: string;
  city: string;
  areaRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
}

const ServiceAreaScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [serviceZones, setServiceZones] = useState<ServiceZoneData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingZone, setAddingZone] = useState(false);

  // New Zone Form State
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRadius, setNewRadius] = useState('');
  const [newLatitude, setNewLatitude] = useState<number | null>(null);
  const [newLongitude, setNewLongitude] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: -37.8136, // Default (e.g. Melbourne)
    longitude: 144.9631,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const mapRef = useRef<MapView>(null);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<string | null>(null);

  const fetchServiceAreas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ serviceAreas: any[] }>(ENDPOINTS.SUPPLIER.SERVICE_AREAS);
      if (response.success && response.data?.serviceAreas) {
        const mappedZones = response.data.serviceAreas.map((area: any) => ({
          id: area.id.toString(),
          country: area.country,
          city: area.city,
          areaRadiusKm: parseFloat(area.area_radius_km),
          latitude: area.latitude ? parseFloat(area.latitude) : null,
          longitude: area.longitude ? parseFloat(area.longitude) : null,
        }));
        setServiceZones(mappedZones);
      }
    } catch (error) {
      console.error('Error fetching service areas:', error);
      toast.error('Error', 'Failed to load service areas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchServiceAreas();
    }, [fetchServiceAreas])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSetupPricing = (zone: ServiceZoneData) => {
    navigation.navigate('SupplierBinPricing', {
      serviceAreaId: zone.id,
      city: zone.city,
    });
  };

  const handleAddNewServiceArea = () => {
    setNewCountry('');
    setNewCity('');
    setNewRadius('');
    setNewLatitude(null);
    setNewLongitude(null);
    setMapRegion({
      latitude: -37.8136,
      longitude: 144.9631,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    });
    setModalVisible(true);
  };

  const submitNewServiceArea = async () => {
    if (!newCity.trim() || !newRadius.trim()) {
      toast.error('Validation Error', 'Please enter a city/address and radius.');
      return;
    }

    try {
      setAddingZone(true);
      const response = await api.post(ENDPOINTS.SUPPLIER.SERVICE_AREAS, {
        country: newCountry || 'Australia',
        city: newCity,
        areaRadiusKm: parseFloat(newRadius),
        latitude: newLatitude,
        longitude: newLongitude,
      });

      if (response.success) {
        setModalVisible(false);
        setNewCountry('');
        setNewCity('');
        setNewRadius('');
        setNewLatitude(null);
        setNewLongitude(null);
        fetchServiceAreas();
        toast.success('Success', 'Service area added successfully.');
      } else {
        toast.error('Error', response.message || 'Failed to add service area.');
      }
    } catch (error) {
      console.error('Error adding service area:', error);
      toast.error('Error', 'An error occurred while adding service area.');
    } finally {
      setAddingZone(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!newCity) return;
    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(newCity)}&format=json&limit=1&addressdetails=1`,
        { headers: { 'User-Agent': 'BinRentalApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name, address = {} } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setNewLatitude(newLat);
        setNewLongitude(newLon);

        // Extract city and country safely
        const detectedCountry = address.country || '';
        const detectedCity = address.city || address.town || address.village || address.suburb || address.state || display_name;

        if (detectedCountry) setNewCountry(detectedCountry);
        setNewCity(detectedCity);

        const newRegion = {
          latitude: newLat,
          longitude: newLon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setMapRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      } else {
        toast.error('Location not found. Please try another search.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  const onMarkerDragEnd = async (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setNewLatitude(newLat);
    setNewLongitude(newLon);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLon}&format=json&addressdetails=1`,
        { headers: { 'User-Agent': 'BinRentalApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) {
        const { address = {}, display_name } = data;
        const detectedCountry = address.country || '';
        const detectedCity = address.city || address.town || address.village || address.suburb || address.state || display_name;

        if (detectedCountry) setNewCountry(detectedCountry);
        setNewCity(detectedCity);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleRemoveZone = (id: string) => {
    setZoneToDelete(id);
    setConfirmVisible(true);
  };

  const executeRemoveZone = async () => {
    if (!zoneToDelete) return;
    const id = zoneToDelete;
    setConfirmVisible(false);

    try {
      setLoading(true);
      const response = await api.delete(`${ENDPOINTS.SUPPLIER.SERVICE_AREAS}/${id}`);
      if (response.success) {
        setServiceZones(serviceZones.filter(zone => zone.id !== id));
        toast.success('Success', 'Service area removed successfully.');
      } else {
        toast.error('Error', response.message || 'Failed to remove service area.');
      }
    } catch (error) {
      console.error('Error removing service area:', error);
      toast.error('Error', 'An error occurred while removing service area.');
    } finally {
      setLoading(false);
      setZoneToDelete(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Section with Gradient Background */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={['#37B112', '#77C40A']}
            locations={[0.2227, 0.5982]}
            start={{ x: 0.12, y: 0.05 }}
            end={{ x: 0.88, y: 0.95 }}
            style={styles.headerGradient}>
            {/* subtle translucent overlay */}
            <LinearGradient
              colors={['rgba(137,217,87,0.2)', 'rgba(137,217,87,0.2)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.overlayGradient}
              pointerEvents="none"
            />

            <View style={styles.headerContent}>
              {/* Title and Subtitle */}
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Operations</Text>
                <Text style={styles.headerSubtitle}>Edit service coverage</Text>
              </View>

              <View style={styles.headerIconsWrapper}>
                <HeaderActionIcons useWhiteWrapper />
              </View>
            </View>

            <View style={styles.headerSvgContainer} pointerEvents="none">
              <Svg14 width={screenWidth - 4} height={177} />
            </View>
          </LinearGradient>
        </View>

        {/* Service Area Section */}
        <View style={styles.sectionContainer}>
          {/* Add New Service Area Card - Outer Container */}
          <LinearGradient
            colors={['#C0F96F', '#90B93E']}
            locations={[0.2009, 0.7847]}
            start={{ x: 0.15, y: 0.15 }}
            end={{ x: 0.85, y: 0.85 }}
            style={styles.addServiceAreaOuter}>
            {/* Background image with lowered opacity */}
            <View style={styles.addCardBackground} pointerEvents="none">
              <BinCollectBg width={391} height={119} />
            </View>

            {/* Service Area Header with Back Button — inside card top */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Service Area</Text>
              <TouchableOpacity
                style={styles.backButtonContainer}
                onPress={handleBack}>
                <Text style={styles.backText}>Back</Text>
                <View style={styles.backArrowCircle}>
                  <Text style={styles.backArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Inner Gradient Pill Button */}
            <LinearGradient
              colors={['#9ED654', '#6EAD16']}
              locations={[0.2, 0.8]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addServiceAreaCard}>
              <TouchableOpacity
                style={styles.addServiceAreaContent}
                activeOpacity={0.85}
                onPress={handleAddNewServiceArea}>
                <View style={styles.ellipseWhite}>
                  <AddIcon width={35} height={28} />
                </View>
                <Text style={styles.addServiceAreaText}>
                  Add New Service Area
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </LinearGradient>
        </View>

        {/* Service Zone Section */}
        <View style={styles.serviceZoneContainer}>
          <LinearGradient
            colors={['#EFF2F0', '#EAFFCC']}
            locations={[0.2377, 0.6629]}
            start={{ x: 0.11, y: 0 }}
            end={{ x: 0.89, y: 1 }}
            style={styles.serviceZoneCard}>
            <Text style={styles.serviceZoneTitle}>Service Zone</Text>

            {/* Service Zone Rows */}
            {loading ? (
              <ActivityIndicator size="small" color={themeColors.primary} style={{ marginVertical: 20 }} />
            ) : (
              <>
                {serviceZones.length === 0 && (
                  <View style={[styles.mapContainer, { height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', marginVertical: 20 }]}>
                    <Text style={{ fontFamily: fonts.family.regular, color: '#666' }}>No service areas configured.</Text>
                  </View>
                )}

                {serviceZones.map(zone => (
                  <View key={zone.id} style={styles.serviceZoneItemContainer}>
                    {/* Info Rows */}
                    <View style={styles.infoRowContainer}>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Country</Text>
                        <Text style={styles.infoValue}>{zone.country}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>City</Text>
                        <Text style={styles.infoValue}>{zone.city}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.infoLabel}>Area Radius</Text>
                        <Text style={styles.infoValue}>{zone.areaRadiusKm} KM</Text>
                      </View>
                    </View>

                    {/* Pricing Setup Button */}
                    <TouchableOpacity
                      style={[styles.removeButton, { marginBottom: 10 }]}
                      activeOpacity={0.8}
                      onPress={() => handleSetupPricing(zone)}>
                      <LinearGradient
                        colors={['#29B554', '#6EAD16']}
                        style={styles.removeButtonInner}>
                        <Ionicons name="pricetag-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.removeText}>Setup Bin Pricing</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Remove Button */}
                    <TouchableOpacity
                      style={styles.removeButton}
                      activeOpacity={0.8}
                      onPress={() => handleRemoveZone(zone.id)}>
                      <View style={styles.removeButtonInner}>
                        <CloseIcon width={16} height={16} />
                        <Text style={styles.removeText}>Remove Area</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Map for this specific area */}
                    <View style={styles.mapContainer}>
                      <MapView
                        provider={PROVIDER_GOOGLE}
                        style={{ width: '100%', height: 200 }}
                        region={{
                          latitude: zone.latitude || 0,
                          longitude: zone.longitude || 0,
                          latitudeDelta: 0.1,
                          longitudeDelta: 0.1,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                      >
                        {zone.latitude && zone.longitude && (
                          <>
                            <Marker coordinate={{ latitude: zone.latitude, longitude: zone.longitude }} />
                            <Circle
                              center={{ latitude: zone.latitude, longitude: zone.longitude }}
                              radius={zone.areaRadiusKm * 1000}
                              fillColor="rgba(119, 196, 10, 0.2)"
                              strokeColor="#37B112"
                              strokeWidth={2}
                            />
                          </>
                        )}
                      </MapView>
                    </View>
                  </View>
                ))}
              </>
            )}
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <AppModal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New Service Area</Text>

              <View style={styles.searchContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Enter City or Address"
                  value={newCity}
                  onChangeText={setNewCity}
                />
                <TouchableOpacity
                  style={styles.searchIconButton}
                  onPress={handleSearchAddress}
                  disabled={isSearching}
                >
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    style={styles.searchIconGradient}
                  >
                    {isSearching ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="search" size={20} color="#FFF" />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              <View style={[styles.mapContainer, { height: 200, width: '100%', marginBottom: 15 }]}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={StyleSheet.absoluteFillObject}
                  region={mapRegion}
                  onRegionChangeComplete={(region) =>
                    setMapRegion(prev => ({
                      ...prev,
                      latitudeDelta: region.latitudeDelta,
                      longitudeDelta: region.longitudeDelta,
                    }))
                  }
                >
                  {newLatitude && newLongitude && (
                    <>
                      <Marker
                        coordinate={{ latitude: newLatitude, longitude: newLongitude }}
                        draggable
                        onDragEnd={onMarkerDragEnd}
                      />
                      <Circle
                        center={{ latitude: newLatitude, longitude: newLongitude }}
                        radius={(parseFloat(newRadius) || 0) * 1000}
                        fillColor="rgba(119, 196, 10, 0.2)"
                        strokeColor="#37B112"
                        strokeWidth={2}
                      />
                    </>
                  )}
                </MapView>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Radius (KM)"
                value={newRadius}
                onChangeText={setNewRadius}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={addingZone}
                >
                  <Text style={[styles.buttonText, { color: '#666' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  activeOpacity={0.8}
                  onPress={submitNewServiceArea}
                  disabled={addingZone}
                >
                  <LinearGradient
                    colors={['#29B554', '#6EAD16']}
                    style={StyleSheet.absoluteFillObject}
                  />
                  {addingZone ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Add Area</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </AppModal>

      <AppConfirmModal
        visible={confirmVisible}
        title="Remove Service Area"
        message="Are you sure you want to remove this service area?"
        confirmText="Remove"
        isDestructive={true}
        onConfirm={executeRemoveZone}
        onCancel={() => {
          setConfirmVisible(false);
          setZoneToDelete(null);
        }}
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
    paddingTop: 15,
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
    borderRadius: 0,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 3,
  },
  headerTextContainer: {
    flex: 1,
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
  headerIconsWrapper: {
    zIndex: 3,
  },
  headerSvgContainer: {
    position: 'absolute',
    left: 2,
    top: 64,
    width: 430 - 4,
    height: 177,
    borderRadius: 12,
    overflow: 'hidden',
    zIndex: 2,
  },
  sectionContainer: {
    paddingHorizontal: 19,
    marginBottom: 12,
  },
  // Moved inside the card — now sits at the top of the green gradient
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  sectionTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#373934',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 4,
  },
  backText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  backArrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 16,
    color: '#504A4A',
    fontWeight: '600',
  },
  addServiceAreaOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 28,
    paddingBottom: 14,
    paddingHorizontal: 14,
  },
  addCardBackground: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.34,
  },
  addServiceAreaCard: {
    borderRadius: 30,
    height: 56,
    overflow: 'hidden',
  },
  addServiceAreaContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ellipseWhite: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  addServiceAreaText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  serviceZoneContainer: {
    paddingHorizontal: 19,
  },
  serviceZoneCard: {
    borderRadius: 9,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  serviceZoneTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 18,
    color: '#242424',
    marginBottom: 16,
  },
  serviceZoneItemContainer: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 20,
  },
  infoRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#242424',
  },
  removeButton: {
    marginBottom: 16,
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
  },
  removeButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  removeText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  mapContainer: {
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 120,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontFamily: fonts.family.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  submitButton: {
    marginLeft: 10,
    overflow: 'hidden',
  },
  buttonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#333',
  },
  submitButtonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    zIndex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    width: screenWidth,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  searchIconButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
  },
  searchIconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ServiceAreaScreen;
