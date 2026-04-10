import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import BottomNavBar from '../components/BottomNavBar';
import toast from '../utils/toast';

const { width } = Dimensions.get('window');

interface Invoice {
  id: number;
  invoice_number: string;
  amount: string;
  status: 'paid' | 'pending' | 'void';
  created_at: string;
  service_request_number: string;
}

const BillingScreen: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const response = await api.get<{ invoices: Invoice[] }>(ENDPOINTS.BILLING.INVOICES);
      if (response.success && response.data) {
        setInvoices(response.data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error', 'Failed to load invoices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.canViewBilling) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View>
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          <Text style={styles.invoiceDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'paid' ? styles.statusPaid : styles.statusPending]}>
          <Text style={[styles.statusText, { color: item.status === 'paid' ? '#065F46' : '#92400E' }]}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.invoiceDivider} />
      <View style={styles.invoiceFooter}>
        <View>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderValue}>#{item.service_request_number}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>${parseFloat(item.amount).toFixed(2)}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.downloadButton} activeOpacity={0.7}>
        <Ionicons name="download-outline" size={20} color="#FFFFFF" />
        <Text style={styles.downloadText}>Download PDF</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user?.canViewBilling) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#29B554', '#6EAD16']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.restrictedHeader}
        >
          <Text style={styles.headerTitle}>Billing & Invoices</Text>
        </LinearGradient>
        <View style={styles.restrictedContent}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={60} color="#6EAD16" />
          </View>
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedMessage}>
            Your billing section is currently disabled. Please contact the administrator to enable invoice viewing for your account.
          </Text>
        </View>
        <BottomNavBar activeTab="account" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#29B554', '#6EAD16']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Billing Center</Text>
            <Text style={styles.headerSubtitle}>View and manage your invoices</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{invoices.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ${invoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? parseFloat(inv.amount) : 0), 0).toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>Paid</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#29B554" />
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#29B554']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={80} color="#E5E7EB" />
              <Text style={styles.emptyText}>No invoices found</Text>
            </View>
          }
        />
      )}
      <BottomNavBar activeTab="account" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 26,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statValue: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#111827',
  },
  invoiceDate: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPaid: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontFamily: fonts.family.bold,
    fontSize: 10,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  invoiceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  orderValue: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#374151',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    color: '#6B7280',
  },
  amountValue: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#29B554',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#373934',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  downloadText: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 10,
  },
  restrictedHeader: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  restrictedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lockCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3FEEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  restrictedTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#373934',
    marginBottom: 12,
    textAlign: 'center',
  },
  restrictedMessage: {
    fontFamily: fonts.family.regular,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default BillingScreen;
