import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AppModal from '../components/AppModal';
import AppConfirmModal from '../components/AppConfirmModal';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import HeaderActionIcons from '../components/HeaderActionIcons';
import toast from '../utils/toast';
import { api } from '../config/api';

// Import SVG icons
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon11_1 from '../assets/images/11 1.svg';
import Icon11_2 from '../assets/images/11 1 (1).svg';
import Icon11_3 from '../assets/images/11 1 (2).svg';
import Icon11_4 from '../assets/images/11 1 (3).svg';
import Icon11_5 from '../assets/images/11 1 (4).svg';
import Icon11_6 from '../assets/images/11 1 (5).svg';
import Icon11_7 from '../assets/images/11 1 (6).svg';
import BinCollectDelete from '../assets/images/Bin.Collect_2.svg';
import Group14 from '../assets/images/Group 14.svg';
import ArrowIcon from '../assets/images/20 1.svg';

const { width } = Dimensions.get('window');

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    style={styles.settingsItem}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={styles.settingsItemLeft}>
      <View style={styles.settingsItemIcon}>{icon}</View>
      <Text style={styles.settingsItemLabel}>{label}</Text>
    </View>
    <View style={styles.settingsItemArrow}>
      <ArrowIcon width={12} height={12} />
    </View>
  </TouchableOpacity>
);

const AccountScreen: React.FC = () => {
  const { user, logout, updateProfile, updateProfilePhoto, changePassword, refreshUser } = useAuth();
  const navigation = useNavigation<any>();
  const userName = user?.name || 'Herper Russo';
  const userId = `BIN_User${user?.id || '1299'}`;

  // Modals state
  const [emailModalVisible, setEmailModalVisible] = React.useState(false);
  const [locationModalVisible, setLocationModalVisible] = React.useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = React.useState(false);

  // Input state
  const [newEmail, setNewEmail] = React.useState('');
  const [defaultLocation, setDefaultLocation] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [confirmModal, setConfirmModal] = React.useState({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => { },
    isDestructive: false,
  });

  // Profile picture state
  const [profilePhoto, setProfilePhoto] = React.useState<string | null>(null);

  // Map / location picker state
  const [mapAddress, setMapAddress] = React.useState('');
  const [mapSearching, setMapSearching] = React.useState(false);
  const [gpsLoading, setGpsLoading] = React.useState(false);
  const [mapLat, setMapLat] = React.useState<number | null>(null);
  const [mapLon, setMapLon] = React.useState<number | null>(null);
  const [mapRegion, setMapRegion] = React.useState({
    latitude: -37.8136,
    longitude: 144.9631,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  // Load default location + profile photo on mount
  React.useEffect(() => {
    loadDefaultLocation();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshUser();
    }, [refreshUser])
  );

  const loadDefaultLocation = async () => {
    try {
      const raw = await AsyncStorage.getItem('defaultLocation');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setDefaultLocation(parsed.address || raw);
        } catch {
          setDefaultLocation(raw);
        }
      }
    } catch (error) {
      console.error('Error loading location:', error);
    }
  };

  const handleUpdateProfilePhoto = async () => {
    Alert.alert(
      'Update Profile Photo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Permission Denied', 'Camera permission is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets.length > 0) {
              const uri = result.assets[0].uri;
              setProfilePhoto(uri);
              const uploadResult = await updateProfilePhoto(uri);
              if (uploadResult.success) {
                toast.success('Success', 'Profile photo updated');
              } else {
                toast.error('Error', uploadResult.message || 'Upload failed');
              }
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              toast.error('Permission Denied', 'Gallery permission is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });
            if (!result.canceled && result.assets.length > 0) {
              const uri = result.assets[0].uri;
              setProfilePhoto(uri);
              const uploadResult = await updateProfilePhoto(uri);
              if (uploadResult.success) {
                toast.success('Success', 'Profile photo updated');
              } else {
                toast.error('Error', uploadResult.message || 'Upload failed');
              }
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSearchMapAddress = async () => {
    if (!mapAddress.trim()) return;
    Keyboard.dismiss();
    setMapSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(mapAddress)}&format=json&limit=1&countrycodes=ca`,
        { headers: { 'User-Agent': 'BinDropApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setMapLat(newLat);
        setMapLon(newLon);
        setMapAddress(display_name);
        setMapRegion(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
      } else {
        toast.error('Address not found', 'Please try a more specific address.');
      }
    } catch (error) {
      toast.error('Error', 'Failed to search address.');
    } finally {
      setMapSearching(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setMapLat(newLat);
    setMapLon(newLon);
    setMapRegion(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLon}&format=json`,
        { headers: { 'User-Agent': 'BinDropApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) setMapAddress(data.display_name);
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleMarkerDragEnd = async (e: any) => {
    const { latitude: newLat, longitude: newLon } = e.nativeEvent.coordinate;
    setMapLat(newLat);
    setMapLon(newLon);
    setMapRegion(prev => ({ ...prev, latitude: newLat, longitude: newLon }));
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${newLat}&lon=${newLon}&format=json`,
        { headers: { 'User-Agent': 'BinDropApp/1.0' } }
      );
      const data = await response.json();
      if (data && data.display_name) setMapAddress(data.display_name);
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const openLocationModal = async () => {
    // Pre-fill modal with existing default location if available
    let hasExistingLocation = false;
    try {
      const raw = await AsyncStorage.getItem('defaultLocation');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setMapAddress(parsed.address || '');
          if (parsed.latitude && parsed.longitude) {
            setMapLat(parsed.latitude);
            setMapLon(parsed.longitude);
            setMapRegion(prev => ({ ...prev, latitude: parsed.latitude, longitude: parsed.longitude }));
          }
          hasExistingLocation = true;
        } catch {
          setMapAddress(raw);
          hasExistingLocation = true;
        }
      }
    } catch (error) {
      console.error('Error loading location for modal:', error);
    }

    // Open modal immediately so user sees it right away
    setLocationModalVisible(true);

    // If no saved location, fetch GPS in background with visible loader
    if (!hasExistingLocation) {
      setGpsLoading(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = pos.coords;
          setMapLat(latitude);
          setMapLon(longitude);
          setMapRegion(prev => ({ ...prev, latitude, longitude }));

          // Reverse geocode
          try {
            const geoResp = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'BinDropApp/1.0' } }
            );
            const geoData = await geoResp.json();
            if (geoData && geoData.display_name) {
              setMapAddress(geoData.display_name);
            }
          } catch {
            // Silent failure for reverse geocoding
          }
        }
      } catch (err) {
        console.error('Error fetching GPS for modal:', err);
        toast.error('Location Error', 'Could not get current location. You can search manually.');
      } finally {
        setGpsLoading(false);
      }
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Error', 'Please enter a valid email');
      return;
    }
    setLoading(true);
    const result = await updateProfile(newEmail);
    setLoading(false);
    if (result.success) {
      setEmailModalVisible(false);
      toast.success('Success', 'Email updated successfully');
      setNewEmail('');
    } else {
      toast.error('Error', result.message || 'Failed to update email');
    }
  };

  const handleUpdateLocation = async () => {
    if (!mapAddress.trim()) {
      toast.error('Error', 'Please select a location on the map');
      return;
    }
    try {
      const locationData = JSON.stringify({
        address: mapAddress,
        latitude: mapLat,
        longitude: mapLon,
      });
      await AsyncStorage.setItem('defaultLocation', locationData);
      setDefaultLocation(mapAddress);
      setLocationModalVisible(false);
      toast.success('Success', 'Default location updated');
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Error', 'Failed to save location');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Error', 'Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);
    if (result.success) {
      setPasswordModalVisible(false);
      toast.success('Success', 'Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error('Error', result.message || 'Failed to change password');
    }
  };

  const handleLogout = async () => {
    setConfirmModal({
      visible: true,
      title: 'Logout',
      message: 'Are you sure you want to logout?',
      confirmText: 'Logout',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        await logout();
      },
      isDestructive: true,
    });
  };

  const handleDeleteProfile = () => {
    setConfirmModal({
      visible: true,
      title: 'Delete Profile',
      message: 'Are you sure you want to delete your profile? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, visible: false }));
        console.log('Delete profile');
      },
      isDestructive: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
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

        {/* Main Content Card */}
        <View style={styles.mainCard}>
          <LinearGradient
            colors={['#EFF2F0', '#F8FFEE']}
            start={{ x: 0.23, y: 0 }}
            end={{ x: 0.66, y: 1 }}
            style={styles.innerCard}>
            {/* Profile Header Section */}
            <View style={styles.profileHeader}>
              {/* Profile Avatar */}
              <TouchableOpacity style={styles.avatarContainer} onPress={handleUpdateProfilePhoto} activeOpacity={0.8}>
                {user?.profilePhoto || profilePhoto ? (
                  <View style={styles.avatarGradient}>
                    <Image 
                      source={{ 
                        uri: profilePhoto && profilePhoto.startsWith('file://') 
                          ? profilePhoto 
                          : (user?.profilePhoto?.startsWith('http') 
                              ? user.profilePhoto 
                              : api.getBaseUrl() + user?.profilePhoto) 
                      }} 
                      style={styles.avatarPhoto} 
                    />
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#6EAD16', '#E1FFB7']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.avatarGradient}>
                    <View style={styles.avatarInner}>
                      <Text style={styles.avatarText}>
                        {userName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                )}
                <View style={styles.avatarCameraIcon}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              {/* User Name and ID */}
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileId}>{userId}</Text>
            </View>

            {/* General Settings Section */}
            <Text style={styles.sectionTitle}>General Settings</Text>

            <View style={styles.settingsSection}>
              <SettingsItem
                icon={<Icon11_1 width={42} height={42} />}
                label={user?.email ? "Change Email" : "Add Email"}
                onPress={() => {
                  setNewEmail(user?.email || '');
                  setEmailModalVisible(true);
                }}
              />
              <SettingsItem
                icon={<Icon11_2 width={35} height={35} />}
                label={defaultLocation ? "Change Default Location" : "Add Default Location"}
                onPress={openLocationModal}
              />
              <SettingsItem
                icon={<Icon11_3 width={30} height={30} />}
                label="Change Password"
                onPress={() => setPasswordModalVisible(true)}
              />
            </View>

            {/* Information Section */}
            <Text style={styles.sectionTitle}>Information</Text>

            <View style={styles.settingsSection}>
              {user?.canViewBilling && (
                <SettingsItem
                  icon={<MaterialCommunityIcons name="receipt" size={28} color="#9CCD17" style={{ marginRight: 8 }} />}
                  label="Billing & Invoices"
                  onPress={() => navigation.navigate('Billing')}
                />
              )}
              <SettingsItem
                icon={<Feather name="headphones" size={28} color="#9CCD17" style={{ marginRight: 8 }} />}
                label="Customer Service"
                onPress={async () => {
                  try {
                    const response = await api.post<{ id: number }>('/messages/start-support-chat', {});
                    if (response.success && response.data) {
                      navigation.navigate('ChatDetail', { conversationId: response.data.id });
                    }
                  } catch (error) {
                    toast.error('Error', 'Failed to start support chat');
                  }
                }}
              />
              <SettingsItem
                icon={<Icon11_4 width={35} height={35} />}
                label="About App"
                onPress={() => console.log('About App')}
              />
              <SettingsItem
                icon={<Icon11_5 width={35} height={35} />}
                label="Terms & Conditions"
                onPress={() => console.log('Terms & Conditions')}
              />
              <SettingsItem
                icon={<Icon11_6 width={35} height={35} />}
                label="Privacy Policy"
                onPress={() => console.log('Privacy Policy')}
              />
              <SettingsItem
                icon={<Icon11_7 width={35} height={35} />}
                label="Share This App"
                onPress={() => console.log('Share This App')}
              />
            </View>
          </LinearGradient>

          {/* Delete Profile Button */}
          <TouchableOpacity
            style={styles.deleteProfileContainer}
            onPress={handleDeleteProfile}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#FAD7D7', '#F9D9D9']}
              start={{ x: 0.66, y: 0.24 }}
              end={{ x: 0.24, y: 0.66 }}
              style={styles.deleteProfileGradient}>
              <View style={styles.settingsItemLeft}>
                <View style={styles.deleteIconContainer}>
                  <Group14 width={35} height={35} />
                </View>
                <Text style={styles.deleteProfileText}>Delete Profile</Text>
              </View>
              <View style={styles.settingsItemArrow}>
                <ArrowIcon width={12} height={12} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButtonContainer}
            onPress={handleLogout}
            activeOpacity={0.8}>
            <LinearGradient
              colors={['#9CCD17', '#009B5F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.logoutButtonGradient}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <AppConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />

      {user?.role === 'supplier' || user?.role === 'driver' ? (
        <SupplierBottomNavBar activeTab="account" />
      ) : (
        <BottomNavBar activeTab="account" />
      )}

      {/* Email Modal */}
      <AppModal
        animationType="fade"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEmailModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setEmailModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{user?.email ? 'Change Email' : 'Add Email'}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter email"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.modalButton, loading && { opacity: 0.7 }]}
              onPress={handleUpdateEmail}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>{loading ? 'Updating...' : (user?.email ? 'Update Email' : 'Add Email')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AppModal>

      {/* Location Map Modal */}
      <AppModal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.mapModalContainer}>
          {/* Header */}
          <View style={styles.mapModalHeader}>
            <Text style={styles.mapModalTitle}>Set Default Location</Text>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View style={styles.mapSearchRow}>
            <TextInput
              style={styles.mapSearchInput}
              placeholder="Search address..."
              placeholderTextColor="#979897"
              value={mapAddress}
              onChangeText={setMapAddress}
              onSubmitEditing={handleSearchMapAddress}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.mapSearchBtn} onPress={handleSearchMapAddress} disabled={mapSearching}>
              {mapSearching
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Ionicons name="search" size={18} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View style={{ flex: 1 }}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapView}
              region={mapRegion}
              onPress={handleMapPress}
            >
              {mapLat !== null && mapLon !== null && (
                <Marker
                  coordinate={{ latitude: mapLat, longitude: mapLon }}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                />
              )}
            </MapView>
            {gpsLoading && (
              <View style={styles.gpsLoadingOverlay}>
                <ActivityIndicator size="large" color="#9AD346" />
                <Text style={styles.gpsLoadingText}>Detecting your location...</Text>
              </View>
            )}
          </View>

          {/* Address preview + confirm */}
          {mapAddress ? (
            <View style={styles.mapAddressRow}>
              <Ionicons name="location" size={16} color="#9AD346" />
              <Text style={styles.mapAddressText} numberOfLines={2}>{mapAddress}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.mapConfirmBtn, !mapAddress && { opacity: 0.5 }]}
            onPress={handleUpdateLocation}
            disabled={!mapAddress}
          >
            <Text style={styles.mapConfirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </AppModal>

      {/* Password Modal */}
      <AppModal
        animationType="fade"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPasswordModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setPasswordModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.modalButton, loading && { opacity: 0.7 }]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>{loading ? 'Updating...' : 'Change Password'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </AppModal>
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
    paddingTop: 15,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
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
  greetingText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#4D4D4D',
  },
  userNameText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 21,
    color: '#82D100',
  },
  mainCard: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
  },
  innerCard: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: '#EFEFEF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 102,
    height: 102,
    borderRadius: 51,
    marginBottom: 10,
    position: 'relative',
  },
  avatarGradient: {
    width: 102,
    height: 102,
    borderRadius: 51,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPhoto: {
    width: 102,
    height: 102,
    borderRadius: 51,
  },
  avatarCameraIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#9AD346',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarInner: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.family.bold,
    fontSize: 40,
    color: '#6EAD16',
  },
  profileName: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#414141',
    textAlign: 'center',
  },
  profileId: {
    fontFamily: fonts.family.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#414141',
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    lineHeight: 24,
    color: '#414141',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  settingsSection: {
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemIcon: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsItemLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#414141',
  },
  settingsItemArrow: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteProfileContainer: {
    marginTop: 16,
    borderRadius: 9,
    overflow: 'hidden',
  },
  deleteProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  deleteIconContainer: {
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteProfileText: {
    fontFamily: fonts.family.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#414141',
  },
  logoutButtonContainer: {
    marginTop: 16,
    height: 56,
    borderRadius: 38,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 38,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  logoutButtonText: {
    fontFamily: fonts.family.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 20,
    color: '#373934',
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontFamily: fonts.family.regular,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#9AD346',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
  // Map modal styles
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mapModalTitle: {
    fontFamily: fonts.family.semiBold,
    fontSize: 18,
    color: '#373934',
  },
  mapSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  mapSearchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: '#373934',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mapSearchBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#9AD346',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapView: {
    flex: 1,
  },
  mapAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#F9FFF0',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  mapAddressText: {
    flex: 1,
    fontFamily: fonts.family.regular,
    fontSize: 13,
    color: '#414141',
    lineHeight: 18,
  },
  mapConfirmBtn: {
    margin: 16,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#9AD346',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapConfirmBtnText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  gpsLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  gpsLoadingText: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#555',
  },
});

export default AccountScreen;
