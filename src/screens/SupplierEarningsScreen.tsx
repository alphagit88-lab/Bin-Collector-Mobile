import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AppModal from '../components/AppModal';
import { LinearGradient } from 'expo-linear-gradient';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import OperationsBottomNavBar from '../components/OperationsBottomNavBar';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

interface Wallet {
  balance: string;
  pending_balance: string;
  total_earned: string;
}

interface Payout {
  id: number;
  payout_id: string;
  amount: string;
  status: string;
  created_at: string;
}

const SupplierEarningsScreen: React.FC = () => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalVisible, setPayoutModalVisible] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const walletRes = await api.get<{ wallet: Wallet }>(ENDPOINTS.WALLET.GET);
      if (walletRes.success && walletRes.data) {
        setWallet(walletRes.data.wallet);
      }

      const payoutsRes = await api.get<{ payouts: Payout[] }>(ENDPOINTS.WALLET.MY_PAYOUTS);
      if (payoutsRes.success && payoutsRes.data) {
        setPayouts(payoutsRes.data.payouts);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Error', 'Please enter a valid amount');
      return;
    }

    if (wallet && amount > parseFloat(wallet.balance)) {
      toast.error('Error', 'Insufficient balance');
      return;
    }

    setRequesting(true);
    try {
      const response = await api.post(ENDPOINTS.WALLET.REQUEST_PAYOUT, {
        amount,
        paymentMethod: 'bank_transfer', // Default for now
      });

      if (response.success) {
        toast.success('Success', 'Payout request submitted successfully. An invoice has been generated for this request.');
        setPayoutModalVisible(false);
        setPayoutAmount('');
        fetchWalletData();
      } else {
        toast.error('Error', response.message || 'Failed to request payout');
      }
    } catch (error) {
      toast.error('Error', 'An error occurred while requesting payout');
    } finally {
      setRequesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && !wallet) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payouts & Earnings</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={['#2D2D2D', '#1A1A1A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>${wallet ? parseFloat(wallet.balance).toFixed(2) : '0.00'}</Text>

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>Pending</Text>
                <Text style={styles.statsValue}>${wallet ? parseFloat(wallet.pending_balance).toFixed(2) : '0.00'}</Text>
              </View>
              <View>
                <Text style={styles.statsLabel}>Total Earned</Text>
                <Text style={styles.statsValue}>${wallet ? parseFloat(wallet.total_earned).toFixed(2) : '0.00'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.payoutButton}
              onPress={() => setPayoutModalVisible(true)}>
              <Text style={styles.payoutButtonText}>Request Payout</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Recent Payouts</Text>
          {payouts.length === 0 ? (
            <Text style={styles.emptyText}>No payout history found</Text>
          ) : (
            payouts.map((payout) => (
              <View key={payout.id} style={styles.payoutItem}>
                <View>
                  <Text style={styles.payoutId}>{payout.payout_id}</Text>
                  <Text style={styles.payoutDate}>{formatDate(payout.created_at)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.payoutAmount}>${parseFloat(payout.amount).toFixed(2)}</Text>
                  <Text style={[
                    styles.payoutStatus,
                    { color: payout.status === 'completed' ? '#10B981' : payout.status === 'pending' ? '#F59E0B' : '#EF4444' }
                  ]}>
                    {payout.status.replace(/_/g, ' ').charAt(0).toUpperCase() + payout.status.replace(/_/g, ' ').slice(1)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Payout Request Modal */}
      <AppModal
        visible={payoutModalVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Payout</Text>
            <Text style={styles.modalLabel}>Amount to Withdraw</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={payoutAmount}
              onChangeText={setPayoutAmount}
            />
            <Text style={styles.helperText}>A payout invoice will be generated automatically upon submission.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPayoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleRequestPayout}
                disabled={requesting}>
                {requesting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Submit Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </AppModal>

      <OperationsBottomNavBar activeTab="payouts" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 19,
    paddingTop: 60,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: fonts.family.bold,
    fontSize: 24,
    color: '#373934',
  },
  balanceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  balanceGradient: {
    padding: 20,
  },
  balanceLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  balanceAmount: {
    fontFamily: fonts.family.bold,
    fontSize: 36,
    lineHeight: 43,
    color: '#FFFFFF',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statsLabel: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.6,
  },
  statsValue: {
    fontFamily: fonts.family.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
  },
  payoutButton: {
    backgroundColor: '#82D100',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  payoutButtonText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 18,
    color: '#373934',
    marginBottom: 15,
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  payoutId: {
    fontFamily: fonts.family.semiBold,
    fontSize: 14,
    color: '#242424',
  },
  payoutDate: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  payoutAmount: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#242424',
  },
  payoutStatus: {
    fontFamily: fonts.family.medium,
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    fontFamily: fonts.family.medium,
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 30,
  },
  bottomSpacing: {
    height: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    minHeight: 350,
  },
  modalTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 22,
    color: '#373934',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    fontFamily: fonts.family.bold,
    color: '#242424',
    marginBottom: 10,
  },
  helperText: {
    fontFamily: fonts.family.regular,
    fontSize: 12,
    color: '#888888',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalBtn: {
    flex: 1,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F5F5',
  },
  cancelBtnText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#666666',
  },
  confirmBtn: {
    backgroundColor: '#82D100',
  },
  confirmBtnText: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default SupplierEarningsScreen;
