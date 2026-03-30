import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { themeColors } from '../theme/colors';
import { fonts } from '../theme/fonts';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

interface BinType {
  id: number;
  name: string;
}

interface BinSize {
  id: number;
  size: string;
  bin_type_name: string;
  bin_type_id: number;
}

interface ServiceAreaBin {
  id?: number;
  bin_size_id: number | null;
  bin_type_id: number | null;
  bin_size_name: string | null;
  bin_type_name: string;
  supplier_price: string;
  admin_final_price: string | null;
  is_active: boolean;
}

const SupplierBinPricingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { serviceAreaId, city } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [binTypes, setBinTypes] = useState<BinType[]>([]);
  const [binSizes, setBinSizes] = useState<BinSize[]>([]);
  const [configuredBins, setConfiguredBins] = useState<ServiceAreaBin[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({}); // key will be 'type_ID' or 'size_ID'

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all available bin types and sizes
      const typesRes = await api.get<{ binTypes: any[] }>(ENDPOINTS.BINS.TYPES);
      const sizesRes = await api.get<{ binSizes: any[] }>(ENDPOINTS.SUPPLIER.BIN_SIZES);

      // Fetch currently configured bins for this service area
      const configRes = await api.get<{ bins: any[] }>(`${ENDPOINTS.SUPPLIER.SERVICE_AREAS}/${serviceAreaId}/bins`);

      if (typesRes.success && sizesRes.success && configRes.success && 
          typesRes.data && sizesRes.data && configRes.data) {
        
        setBinTypes(typesRes.data.binTypes);
        setBinSizes(sizesRes.data.binSizes);
        setConfiguredBins(configRes.data.bins);

        // Initialize prices state
        const initialPrices: Record<string, string> = {};
        configRes.data.bins.forEach((bin: any) => {
          const key = bin.bin_size_id ? `size_${bin.bin_size_id}` : `type_${bin.bin_type_id}`;
          initialPrices[key] = bin.supplier_price.toString();
        });
        setPrices(initialPrices);
      }
    } catch (error) {
      console.error('Error fetching pricing data:', error);
      toast.error('Error', 'Failed to load pricing information.');
    } finally {
      setLoading(false);
    }
  }, [serviceAreaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePriceChange = (key: string, value: string) => {
    setPrices(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrice = async (typeId: number | null, sizeId: number | null) => {
    const key = sizeId ? `size_${sizeId}` : `type_${typeId}`;
    const price = prices[key];
    if (!price || isNaN(parseFloat(price))) {
      toast.error('Validation Error', 'Please enter a valid price.');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(ENDPOINTS.SUPPLIER.UPDATE_BIN_PRICE, {
        serviceAreaId,
        binSizeId: sizeId,
        binTypeId: typeId,
        supplierPrice: parseFloat(price)
      });

      if (response.success) {
        toast.success('Success', 'Price suggestion submitted for admin approval.');
        fetchData(); // Refresh to show status
      } else {
        toast.error('Error', response.message || 'Failed to update price.');
      }
    } catch (error) {
      console.error('Error saving price:', error);
      toast.error('Error', 'An error occurred while saving price.');
    } finally {
      setSaving(false);
    }
  };

  const renderBinItem = (type: BinType, size?: BinSize) => {
    const isSizeBased = !!size;
    const itemId = isSizeBased ? size.id : type.id;
    const key = isSizeBased ? `size_${size.id}` : `type_${type.id}`;
    
    const config = configuredBins.find(b => 
      isSizeBased ? b.bin_size_id === size.id : (b.bin_type_id === type.id && !b.bin_size_id)
    );
    const currentPrice = prices[key] || '';
    const isLocked = !!config?.admin_final_price;

    return (
      <View key={key} style={styles.binCard}>
        <View style={styles.binInfo}>
          <Text style={styles.binTypeName}>{type.name}</Text>
          {isSizeBased && <Text style={styles.binSizeName}>{size.size}</Text>}

          {config && (
            <View style={styles.statusBadgeContainer}>
              <View style={[styles.statusBadge, config.is_active ? styles.activeBadge : styles.pendingBadge]}>
                <Text style={[styles.statusBadgeText, config.is_active ? styles.activeBadgeText : styles.pendingBadgeText]}>
                  {config.is_active ? 'Active' : 'Pending Approval'}
                </Text>
              </View>
              {config.admin_final_price && (
                <View style={styles.finalPriceContainer}>
                  <Text style={styles.finalPriceLabel}>Customer Price:</Text>
                  <Text style={styles.finalPriceValue}>${config.admin_final_price}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.priceAction}>
          <View style={[styles.inputWrapper, isLocked && styles.disabledInput]}>
            <Text style={[styles.currencySymbol, isLocked && styles.disabledText]}>$</Text>
            <TextInput
              style={[styles.priceInput, isLocked && styles.disabledText]}
              placeholder="0.00"
              value={currentPrice}
              onChangeText={(val) => handlePriceChange(key, val)}
              keyboardType="numeric"
              editable={!isLocked}
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, isLocked && styles.disabledButton]}
            onPress={() => handleSavePrice(type.id, isSizeBased ? size.id : null)}
            disabled={saving || isLocked}
          >
            <LinearGradient
              colors={isLocked ? ['#9CA3AF', '#D1D5DB'] : ['#29B554', '#6EAD16']}
              style={styles.saveGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name={isLocked ? "lock-closed" : "checkmark"} size={18} color="#FFF" />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    return binTypes.map(type => {
      const sizesForType = binSizes.filter(s => s.bin_type_name === type.name || s.bin_type_id === type.id);
      
      if (sizesForType.length > 0) {
        return sizesForType.map(size => renderBinItem(type, size));
      } else {
        // No sizes defined for this type (e.g., Garbage Bin)
        return renderBinItem(type);
      }
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#37B112', '#77C40A']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bin Pricing</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.headerSubtitle}>{city}</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={styles.loadingText}>Loading bin sizes...</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.instructionCard}>
              <Ionicons name="information-circle-outline" size={24} color={themeColors.primary} />
              <Text style={styles.instructionText}>
                Set your suggested price for each bin type. Admin will review and set the final active price.
              </Text>
            </View>

            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontFamily: fonts.family.bold,
    fontSize: 20,
    color: '#FFF',
  },
  headerSubtitle: {
    fontFamily: fonts.family.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 5,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: fonts.family.medium,
    color: '#666',
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#EFFFFA',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D0F0E0',
  },
  instructionText: {
    flex: 1,
    marginLeft: 10,
    fontFamily: fonts.family.regular,
    fontSize: 13,
    color: '#2D6A4F',
    lineHeight: 18,
  },
  binCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  binInfo: {
    flex: 1,
  },
  binTypeName: {
    fontFamily: fonts.family.bold,
    fontSize: 16,
    color: '#242424',
  },
  binSizeName: {
    fontFamily: fonts.family.medium,
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadgeContainer: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  activeBadgeText: {
    color: '#2E7D32',
  },
  pendingBadgeText: {
    color: '#EF6C00',
  },
  statusBadgeText: {
    fontFamily: fonts.family.bold,
    fontSize: 10,
  },
  finalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  finalPriceLabel: {
    fontFamily: fonts.family.medium,
    fontSize: 10,
    color: '#0369A1',
    marginRight: 4,
  },
  finalPriceValue: {
    fontFamily: fonts.family.bold,
    fontSize: 11,
    color: '#0284C7',
  },
  priceAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    width: 90,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  disabledInput: {
    backgroundColor: '#E9ECEF',
    borderColor: '#DEE2E6',
  },
  disabledText: {
    color: '#ADB5BD',
  },
  currencySymbol: {
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#495057',
  },
  priceInput: {
    flex: 1,
    height: '100%',
    marginLeft: 2,
    fontFamily: fonts.family.bold,
    fontSize: 14,
    color: '#242424',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  saveGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SupplierBinPricingScreen;
