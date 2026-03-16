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
} from 'react-native';
import AppModal from '../components/AppModal';
import AppConfirmModal from '../components/AppConfirmModal';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';
import SupplierBottomNavBar from '../components/SupplierBottomNavBar';
import toast from '../utils/toast';

// Import SVG icons
import Logo14_1 from '../assets/images/14_1.svg';
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

const USA_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
  'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

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
  const { user, logout, updateProfile, changePassword } = useAuth();
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

  // Load default location on mount
  React.useEffect(() => {
    loadDefaultLocation();
  }, []);

  const loadDefaultLocation = async () => {
    try {
      const location = await AsyncStorage.getItem('defaultLocation');
      if (location) setDefaultLocation(location);
    } catch (error) {
      console.error('Error loading location:', error);
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

  const handleUpdateLocation = async (location: string) => {
    try {
      await AsyncStorage.setItem('defaultLocation', location);
      setDefaultLocation(location);
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
            <Text style={styles.greetingText}>Good Morning,</Text>
            <Text style={styles.userNameText}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Logo14_1 width={148} height={63} />
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
              <View style={styles.avatarContainer}>
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
              </View>

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
                onPress={() => setLocationModalVisible(true)}
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

      {/* Location Modal */}
      <AppModal
        animationType="slide"
        transparent={true}
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            <TouchableOpacity
              style={styles.closeIcon}
              onPress={() => setLocationModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#373934" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Default Location</Text>
            <ScrollView style={styles.statesList}>
              {USA_STATES.map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.stateItem}
                  onPress={() => handleUpdateLocation(state)}
                >
                  <Text style={[styles.stateText, defaultLocation === state && styles.selectedStateText]}>{state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
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
  },
  avatarGradient: {
    width: 102,
    height: 102,
    borderRadius: 51,
    justifyContent: 'center',
    alignItems: 'center',
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
  statesList: {
    width: '100%',
  },
  stateItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  stateText: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#414141',
  },
  selectedStateText: {
    color: '#9AD346',
    fontFamily: fonts.family.semiBold,
  },
  closeIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 5,
  },
});

export default AccountScreen;
