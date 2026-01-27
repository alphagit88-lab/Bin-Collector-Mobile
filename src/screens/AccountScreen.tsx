import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useAuth} from '../contexts/AuthContext';
import {fonts} from '../theme/fonts';
import {themeColors} from '../theme/colors';
import BottomNavBar from '../components/BottomNavBar';

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

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({icon, label, onPress}) => (
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
  const {user, logout} = useAuth();
  const userName = user?.name || 'Herper Russo';
  const userId = `BIN_User${user?.id || '1299'}`;

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      'Are you sure you want to delete your profile? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle delete profile logic
            console.log('Delete profile');
          },
        },
      ],
      {cancelable: true},
    );
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
            start={{x: 0.23, y: 0}}
            end={{x: 0.66, y: 1}}
            style={styles.innerCard}>
            {/* Profile Header Section */}
            <View style={styles.profileHeader}>
              {/* Profile Avatar */}
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={['#6EAD16', '#E1FFB7']}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
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
                label="Add Email"
                onPress={() => console.log('Add Email')}
              />
              <SettingsItem
                icon={<Icon11_2 width={35} height={35} />}
                label="Add Default Location"
                onPress={() => console.log('Add Default Location')}
              />
              <SettingsItem
                icon={<Icon11_3 width={30} height={30} />}
                label="Change Password"
                onPress={() => console.log('Change Password')}
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
              start={{x: 0.66, y: 0.24}}
              end={{x: 0.24, y: 0.66}}
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
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.logoutButtonGradient}>
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavBar activeTab="account" />
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
});

export default AccountScreen;
