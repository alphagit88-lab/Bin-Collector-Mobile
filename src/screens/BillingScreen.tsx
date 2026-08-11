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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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
      const response = await api.get<any>(ENDPOINTS.BILLING.INVOICES);
      if (response.success) {
        const invoiceList = (response as any).invoices || response.data?.invoices || [];
        setInvoices(invoiceList);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error', 'Failed to load bills');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'supplier' || user?.canViewBilling) {
      fetchInvoices();
    } else {
      setLoading(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  const handleDownloadPDF = async (item: Invoice) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #1F2937; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #E5E7EB; padding-bottom: 24px; margin-bottom: 24px; }
              .company { font-size: 28px; font-weight: bold; color: #111827; }
              .company-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
              .company-info { margin-top: 16px; font-size: 13px; color: #6B7280; line-height: 1.6; }
              .bill-label { font-size: 32px; font-weight: 300; text-transform: uppercase; color: #9CA3AF; letter-spacing: 4px; }
              .bill-number { font-size: 18px; font-weight: bold; color: #111827; margin-top: 6px; }
              .meta { font-size: 13px; color: #4B5563; margin-top: 4px; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-top: 10px; background: ${item.status === 'paid' ? '#D1FAE5' : '#FEF3C7'}; color: ${item.status === 'paid' ? '#065F46' : '#92400E'}; }
              .section-title { font-size: 11px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
              .user-name { font-size: 18px; font-weight: bold; color: #111827; }
              .table { width: 100%; border-collapse: collapse; margin-top: 24px; }
              .table th { text-align: left; padding: 10px 0; border-bottom: 2px solid #111827; font-size: 12px; text-transform: uppercase; }
              .table td { padding: 16px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
              .totals { float: right; width: 45%; margin-top: 24px; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #4B5563; border-bottom: 1px solid #E5E7EB; }
              .totals-final { display: flex; justify-content: space-between; padding: 16px 0; font-size: 20px; font-weight: bold; color: #111827; }
              .footer { border-top: 1px solid #E5E7EB; padding-top: 24px; text-align: center; font-size: 13px; color: #9CA3AF; margin-top: 60px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <div class="company">BinDrop</div>
                <div class="company-sub">Professional Bin Rental Services</div>
                <div class="company-info">123 Bin Rental Ave., Toronto, ON M1M 1M1<br/>contact@bindrop.ai</div>
              </div>
              <div style="text-align:right">
                <div class="bill-label">Bill</div>
                <div class="bill-number">#${item.invoice_number}</div>
                <div class="meta">Date: ${new Date(item.created_at).toLocaleDateString()}</div>
                <div class="meta">Order: #${item.service_request_number || 'N/A'}</div>
                <div><span class="status-badge">${item.status}</span></div>
              </div>
            </div>
            <div style="margin-bottom:32px">
              <div class="section-title">Payable To</div>
              <div class="user-name">${user?.name || 'Valued Customer'}</div>
              <div style="font-size:13px;color:#6B7280;margin-top:4px">${user?.email || ''}</div>
            </div>
            <table class="table">
              <thead><tr><th>Description</th><th>Qty</th><th style="text-align:right">Amount</th></tr></thead>
              <tbody>
                <tr>
                  <td><strong>Bin Rental Service</strong><br/><span style="color:#6B7280;font-size:12px">Order #${item.service_request_number}</span></td>
                  <td>1</td>
                  <td style="text-align:right;font-weight:bold">$${parseFloat(item.amount).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <div class="totals">
              <div class="totals-row"><span>Subtotal</span><span>$${parseFloat(item.amount).toFixed(2)}</span></div>
              <div class="totals-row"><span>Tax (Included)</span><span>$0.00</span></div>
              <div class="totals-final"><span>Total</span><span>$${parseFloat(item.amount).toFixed(2)}</span></div>
            </div>
            <div style="clear:both"></div>
            <div class="footer">
              Thank you for your business!<br/>Questions? Contact us at contact@bindrop.ai
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Bill' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error', 'Failed to generate PDF');
    }
  };

  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          <Text style={styles.invoiceDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDownloadPDF(item)} activeOpacity={0.7} style={styles.downloadIconBtn}>
          <Ionicons name="download-outline" size={22} color={themeColors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.invoiceDivider} />
      <View style={styles.invoiceFooter}>
        <View>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderValue}>#{item.service_request_number}</Text>
          <View style={[styles.statusBadge, item.status === 'paid' ? styles.statusPaid : styles.statusPending, { marginTop: 6, alignSelf: 'flex-start' }]}>
            <Text style={[styles.statusText, { color: item.status === 'paid' ? '#065F46' : '#92400E' }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>${parseFloat(item.amount).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  if (!(user?.role === 'supplier' || user?.canViewBilling)) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[themeColors.primaryLight2, themeColors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.restrictedHeader}
        >
          <Text style={styles.headerTitle}>Billing & Invoices</Text>
        </LinearGradient>
        <View style={styles.restrictedContent}>
          <View style={styles.lockCircle}>
            <Ionicons name="lock-closed" size={60} color={themeColors.primaryLight} />
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
        colors={[themeColors.primaryLight2, themeColors.primaryLight]}
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
          <ActivityIndicator size="large" color={themeColors.primaryLight2} />
        </View>
      ) : (
        <FlatList
          data={invoices}
          renderItem={renderInvoiceItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primaryLight2]} />
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
    color: themeColors.primaryLight2,
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
  downloadIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
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
