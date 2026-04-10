import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { api } from '../config/api';
import { fonts } from '../theme/fonts';
import { useAuth } from '../contexts/AuthContext';

interface Conversation {
  id: number;
  order_id: number | null;
  type: 'order' | 'support';
  participant1_id: number;
  participant2_id: number;
  last_message_at: string;
  p1_name: string;
  p2_name: string;
  last_message_text: string | null;
  last_message_at_actual: string | null;
  unread_count?: number;
}

const MessageInboxScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const response = await api.get<Conversation[]>('/messages/conversations');
      if (response.success && response.data) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getOtherParticipantName = (item: Conversation) => {
    return item.participant1_id === user?.id ? item.p2_name : item.p1_name;
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.chatItem, (item.unread_count || 0) > 0 && styles.unreadChatItem]}
      onPress={() => navigation.navigate('ChatDetail', { conversationId: item.id })}
    >
      <View style={styles.avatarContainer}>
        {item.type === 'support' ? (
          <View style={[styles.avatar, styles.supportAvatar]}>
            <Feather name="headphones" size={24} color="#FFFFFF" />
          </View>
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getOtherParticipantName(item).charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.chatHeader}>
          <Text style={styles.name} numberOfLines={1}>
            {item.type === 'support' ? 'Customer Support' : getOtherParticipantName(item)}
          </Text>
          <Text style={styles.time}>
            {item.last_message_at_actual
              ? new Date(item.last_message_at_actual).toLocaleDateString()
              : ''}
          </Text>
        </View>

        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.last_message_text || 'No messages yet'}
        </Text>

        {item.order_id && (
          <View style={styles.orderLabel}>
            <Text style={styles.orderLabelText}>Order #{item.order_id}</Text>
          </View>
        )}
      </View>
      {(item.unread_count || 0) > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {(item.unread_count || 0) > 99 ? '99+' : item.unread_count}
          </Text>
        </View>
      )}
      <Feather name="chevron-right" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#373934" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          onPress={() => {
            // Logic to start a new support chat directly
            api.post('/messages/start-support-chat', {}).then((res: any) => {
              if (res.success) navigation.navigate('ChatDetail', { conversationId: res.data.id });
            });
          }}
          style={styles.headerIcon}
        >
          <Feather name="edit" size={20} color="#9CCD17" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#9CCD17" />
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#9CCD17']} />
          }
        />
      ) : (
        <View style={styles.centerContainer}>
          <Feather name="message-square" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <TouchableOpacity
            style={styles.supportButton}
            onPress={() => {
              api.post('/messages/start-support-chat', {}).then((res: any) => {
                if (res.success) navigation.navigate('ChatDetail', { conversationId: res.data.id });
              });
            }}
          >
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.family.bold,
    color: '#373934',
  },
  headerIcon: {
    padding: 5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  unreadChatItem: {
    backgroundColor: '#F3FFF2',
    borderLeftWidth: 3,
    borderLeftColor: '#29B554',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#9CCD17',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportAvatar: {
    backgroundColor: '#373934',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontFamily: fonts.family.bold,
  },
  contentContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: fonts.family.bold,
    color: '#333',
  },
  time: {
    fontSize: 12,
    color: '#999',
    fontFamily: fonts.family.regular,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    fontFamily: fonts.family.regular,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: fonts.family.bold,
  },
  orderLabel: {
    marginTop: 5,
    backgroundColor: '#EAFFCC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  orderLabelText: {
    fontSize: 11,
    color: '#2E8015',
    fontFamily: fonts.family.medium,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#999',
    fontFamily: fonts.family.medium,
  },
  supportButton: {
    marginTop: 30,
    backgroundColor: '#9CCD17',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.family.bold,
  },
});

export default MessageInboxScreen;
