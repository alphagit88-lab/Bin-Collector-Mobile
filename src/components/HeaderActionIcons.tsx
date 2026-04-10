import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { fonts } from '../theme/fonts';

interface HeaderActionIconsProps {
  useWhiteWrapper?: boolean;
}

const HeaderActionIcons: React.FC<HeaderActionIconsProps> = ({ useWhiteWrapper = false }) => {
  const navigation = useNavigation<any>();
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [messageCount, setMessageCount] = React.useState(0);

  const fetchCounts = React.useCallback(async () => {
    try {
      const [notificationRes, messageRes] = await Promise.all([
        api.get<{ count: number }>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT),
        api.get<{ count: number }>(ENDPOINTS.MESSAGES.UNREAD_COUNT),
      ]);

      if (notificationRes.success && notificationRes.data) {
        setNotificationCount(Number(notificationRes.data.count) || 0);
      }
      if (messageRes.success && messageRes.data) {
        setMessageCount(Number(messageRes.data.count) || 0);
      }
    } catch {
      // Keep UI resilient if count endpoints fail.
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchCounts();
    }, [fetchCounts])
  );

  const content = (
    <View style={styles.row}>
      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
        </View>
        {notificationCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('MessageInbox')}>
        <View style={styles.iconCircle}>
          <Ionicons name="chatbox-outline" size={22} color="#FFFFFF" />
        </View>
        {messageCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{messageCount > 99 ? '99+' : messageCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Account')}>
        <View style={styles.iconCircle}>
          <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (useWhiteWrapper) {
    return <View style={styles.whiteWrapper}>{content}</View>;
  }

  return content;
};

const styles = StyleSheet.create({
  whiteWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    padding: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderRadius: 20,
    overflow: 'visible',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#29B554',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.family.bold,
    lineHeight: 11,
  },
});

export default HeaderActionIcons;
