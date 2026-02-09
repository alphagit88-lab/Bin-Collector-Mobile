import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

// Header truck/logo SVGs
import Logo14_1 from '../assets/images/14_1.svg';
import Svg14 from '../assets/images/3_1.svg';
import CloseIcon from '../assets/images/35 3.svg';
import BinCollectBg from '../assets/images/Bin.Collect_2.svg';
import AddIcon from '../assets/images/Bin.Collect (1) 1.svg';
import Rectangle11 from '../assets/images/Rectangle 11.svg';

const { width: screenWidth } = Dimensions.get('window');

const getMapHtml = (city: string, country: string, radiusMeters: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { height: 100vh; width: 100vw; }
    .leaflet-control-attribution { font-size: 8px; } 
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    // Initialize map with a default world view first
    var map = L.map('map', { 
      zoomControl: false,
      attributionControl: true 
    }).setView([20, 0], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Function to geocode and update map
    function updateMapLocation() {
      var query = "${city}, ${country}";
      
      fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(query))
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data && data.length > 0) {
            var lat = parseFloat(data[0].lat);
            var lon = parseFloat(data[0].lon);
            
            // Set view to the result
            map.setView([lat, lon], 10);

            // Add marker
            L.marker([lat, lon]).addTo(map);

            // Add radius circle
            var circle = L.circle([lat, lon], {
              color: '#37B112',
              fillColor: '#77C40A',
              fillOpacity: 0.2,
              radius: ${radiusMeters}
            }).addTo(map);
            
            // Fit bounds to show the whole circle
            map.fitBounds(circle.getBounds());
          } else {
            console.error('Location not found');
          }
        })
        .catch(function(error) {
          console.error('Geocoding error:', error);
        });
    }

    // Run geocoding
    updateMapLocation();
  </script>
</body>
</html>
`;

interface ServiceZoneData {
  id: string;
  country: string;
  city: string;
  areaRadius: string;
}

const ServiceAreaScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [serviceZones, setServiceZones] = useState<ServiceZoneData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addingZone, setAddingZone] = useState(false);

  // New Zone Form State
  const [newCountry, setNewCountry] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newRadius, setNewRadius] = useState('');

  const fetchServiceAreas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ serviceAreas: any[] }>(ENDPOINTS.SUPPLIER.SERVICE_AREAS);
      if (response.success && response.data?.serviceAreas) {
        const mappedZones = response.data.serviceAreas.map((area: any) => ({
          id: area.id.toString(),
          country: area.country,
          city: area.city,
          areaRadius: `${area.area_radius_km}KM`
        }));
        setServiceZones(mappedZones);
      }
    } catch (error) {
      console.error('Error fetching service areas:', error);
      Alert.alert('Error', 'Failed to load service areas.');
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

  const handleAddNewServiceArea = () => {
    setModalVisible(true);
  };

  const submitNewServiceArea = async () => {
    if (!newCountry.trim() || !newCity.trim() || !newRadius.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }

    try {
      setAddingZone(true);
      const response = await api.post(ENDPOINTS.SUPPLIER.SERVICE_AREAS, {
        country: newCountry,
        city: newCity,
        areaRadiusKm: parseInt(newRadius)
      });

      if (response.success) {
        setModalVisible(false);
        setNewCountry('');
        setNewCity('');
        setNewRadius('');
        fetchServiceAreas();
        Alert.alert('Success', 'Service area added successfully.');
      } else {
        Alert.alert('Error', response.message || 'Failed to add service area.');
      }
    } catch (error) {
      console.error('Error adding service area:', error);
      Alert.alert('Error', 'An error occurred while adding service area.');
    } finally {
      setAddingZone(false);
    }
  };

  const handleRemoveZone = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.delete(`${ENDPOINTS.SUPPLIER.SERVICE_AREAS}/${id}`);
      if (response.success) {
        setServiceZones(serviceZones.filter(zone => zone.id !== id));
      } else {
        Alert.alert('Error', response.message || 'Failed to remove service area.');
      }
    } catch (error) {
      console.error('Error removing service area:', error);
      Alert.alert('Error', 'An error occurred while removing service area.');
    } finally {
      setLoading(false);
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

            {/* Title and Subtitle */}
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Operations</Text>
              <Text style={styles.headerSubtitle}>Edit service coverage</Text>
            </View>

            <View style={styles.decorativeImageContainer}>
              <Logo14_1 width={148} height={63} />
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
                        <Text style={styles.infoValue}>{zone.areaRadius}</Text>
                      </View>
                    </View>

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
                      <WebView
                        originWhitelist={['*']}
                        source={{
                          html: getMapHtml(
                            zone.city,
                            zone.country,
                            parseInt(zone.areaRadius.replace(/[^0-9]/g, '')) * 1000 || 45000
                          )
                        }}
                        style={{ width: '100%', height: 200, backgroundColor: 'transparent' }}
                        scrollEnabled={false}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add New Service Area Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Service Area</Text>

            <TextInput
              style={styles.input}
              placeholder="Country"
              value={newCountry}
              onChangeText={setNewCountry}
            />

            <TextInput
              style={styles.input}
              placeholder="City"
              value={newCity}
              onChangeText={setNewCity}
            />

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
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitNewServiceArea}
                disabled={addingZone}
              >
                {addingZone ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    paddingTop: 241,
  },
  headerContainer: {
    position: 'absolute',
    width: 430,
    height: 241,
    left: 0,
    top: 0,
  },
  headerGradient: {
    height: 241,
    paddingTop: 20,
    paddingHorizontal: 19,
    position: 'relative',
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
    right: 60,
    top: 9,
    width: 148,
    height: 63,
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
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
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
    backgroundColor: '#ddd',
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: '#37B112',
    marginLeft: 10,
  },
  buttonText: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default ServiceAreaScreen;
