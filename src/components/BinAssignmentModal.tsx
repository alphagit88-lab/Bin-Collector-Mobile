import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AppModal from './AppModal';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/fonts';
import { themeColors } from '../theme/colors';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import toast from '../utils/toast';

interface OrderItem {
    id: number;
    bin_type_name: string;
    bin_size: string;
    bin_type_id?: number;
    bin_size_id?: number;
}

interface BinAssignmentModalProps {
    visible: boolean;
    orderItems: OrderItem[];
    onClose: () => void;
    onSubmit: (startStatus: string, assignments: string[]) => void;
    isLoading?: boolean;
}

const BinAssignmentModal: React.FC<BinAssignmentModalProps> = ({
    visible,
    orderItems,
    onClose,
    onSubmit,
    isLoading = false,
}) => {
    const [assignments, setAssignments] = useState<{ [key: number]: string }>({});
    const [availableBins, setAvailableBins] = useState<any[]>([]);
    const [loadingBins, setLoadingBins] = useState(false);
    const [showBinPicker, setShowBinPicker] = useState<number | null>(null); // orderItemId or null

    useEffect(() => {
        if (visible) {
            fetchAvailableBins();
            setAssignments({});
        }
    }, [visible]);

    const fetchAvailableBins = async () => {
        setLoadingBins(true);
        try {
            // Fetch available physical bins
            const response: any = await api.get<any[]>(`${ENDPOINTS.BINS.PHYSICAL}?status=available`);
            if (response.success) {
                setAvailableBins(response.bins || response.data || []);
            }
        } catch (error) {
            console.error('Error fetching bins:', error);
            toast.error('Error', 'Failed to load available bins.');
        } finally {
            setLoadingBins(false);
        }
    };

    const handleAssignBin = (orderItemId: number, binCode: string) => {
        setAssignments((prev) => ({
            ...prev,
            [orderItemId]: binCode,
        }));
        setShowBinPicker(null);
    };

    const handleSubmit = () => {
        // Check if all items have assignments
        const assignedCount = Object.keys(assignments).length;
        if (assignedCount < orderItems.length) {
            toast.info('Incomplete', 'Please assign a bin to every item before starting delivery.');
            return;
        }

        // Sort assignments by the order of items to match the array requirement if strictly positional, 
        // but the backend says "bin_codes array required". Using the order of items in `orderItems` is safest.
        const binCodes = orderItems.map(item => assignments[item.id]);

        onSubmit('on_delivery', binCodes);
    };

    const getCompatibleBins = (item: OrderItem) => {
        // Filter bins matching type and size
        // Note: The backend PhysicalBin model has `bin_type_name` and `bin_size` joined.
        // We should match on IDs if available, or names. JobDetailScreen mock data uses names.
        // Let's assume broad matching for now or strict if IDs available.
        return availableBins.filter(
            (bin) =>
                bin.status === 'available' &&
                (bin.bin_type_name === item.bin_type_name || bin.bin_type_id === item.bin_type_id) &&
                (bin.bin_size === item.bin_size || bin.bin_size_id === item.bin_size_id)
        );
    };

    const renderBinPicker = () => {
        if (showBinPicker === null) return null;

        const currentItem = orderItems.find((i) => i.id === showBinPicker);
        if (!currentItem) return null;

        const compatibleBins = getCompatibleBins(currentItem);

        // Filter out bins already assigned to OTHER items
        const unselectedCompatibleBins = compatibleBins.filter(bin =>
            !Object.values(assignments).includes(bin.bin_code) || assignments[currentItem.id] === bin.bin_code
        );

        return (
            <AppModal
                visible={true}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowBinPicker(null)}
            >
                <View style={styles.pickerOverlay}>
                    <View style={styles.pickerContent}>
                        <Text style={styles.pickerTitle}>Select Bin</Text>
                        <Text style={styles.pickerSubtitle}>
                            For {currentItem.bin_type_name} ({currentItem.bin_size})
                        </Text>

                        <ScrollView style={styles.pickerScroll}>
                            {unselectedCompatibleBins.length === 0 ? (
                                <Text style={styles.noBinsText}>No available bins found for this type/size.</Text>
                            ) : (
                                unselectedCompatibleBins.map((bin: any) => (
                                    <TouchableOpacity
                                        key={bin.id}
                                        style={styles.binOption}
                                        onPress={() => handleAssignBin(currentItem.id, bin.bin_code)}
                                    >
                                        <Text style={styles.binOptionText}>{bin.bin_code}</Text>
                                        {assignments[currentItem.id] === bin.bin_code && (
                                            <Text style={styles.checkedIcon}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.closePickerButton}
                            onPress={() => setShowBinPicker(null)}
                        >
                            <Text style={styles.closePickerText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </AppModal>
        );
    };

    return (
        <AppModal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Assign Bins</Text>
                    <Text style={styles.modalDescription}>
                        Please assign a physical bin to each order item to start delivery.
                    </Text>

                    {loadingBins ? (
                        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <ScrollView style={styles.itemsList}>
                            {orderItems.map((item, index) => (
                                <View key={item.id || index} style={styles.itemRow}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemType}>{item.bin_type_name}</Text>
                                        <Text style={styles.itemSize}>{item.bin_size}</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.selectButton,
                                            assignments[item.id] ? styles.selectButtonActive : null
                                        ]}
                                        onPress={() => setShowBinPicker(item.id)}
                                    >
                                        <Text style={[
                                            styles.selectButtonText,
                                            assignments[item.id] ? styles.selectButtonTextActive : null
                                        ]}>
                                            {assignments[item.id] || 'Select Bin'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isLoading || loadingBins}
                        >
                            <LinearGradient
                                colors={['#29B554', '#6EAD16']}
                                style={styles.submitGradient}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Start Delivery</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            {renderBinPicker()}
        </AppModal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontFamily: fonts.family.bold,
        fontSize: 20,
        color: '#333',
        marginBottom: 8,
    },
    modalDescription: {
        fontFamily: fonts.family.regular,
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    itemsList: {
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    itemInfo: {
        flex: 1,
    },
    itemType: {
        fontFamily: fonts.family.medium,
        fontSize: 16,
        color: '#333',
    },
    itemSize: {
        fontFamily: fonts.family.regular,
        fontSize: 14,
        color: '#888',
    },
    selectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        backgroundColor: '#F9F9F9',
    },
    selectButtonActive: {
        borderColor: themeColors.primarySemiDark,
        backgroundColor: 'rgba(41, 181, 84, 0.1)',
    },
    selectButtonText: {
        fontFamily: fonts.family.medium,
        fontSize: 14,
        color: '#666',
    },
    selectButtonTextActive: {
        color: themeColors.black,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontFamily: fonts.family.bold,
        fontSize: 16,
        color: '#666',
    },
    submitButton: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonText: {
        fontFamily: fonts.family.bold,
        fontSize: 16,
        color: '#FFF',
    },
    // Picker Styles
    pickerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        padding: 24,
    },
    pickerContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        maxHeight: '60%',
    },
    pickerTitle: {
        fontFamily: fonts.family.bold,
        fontSize: 18,
        color: '#333',
        marginBottom: 4,
    },
    pickerSubtitle: {
        fontFamily: fonts.family.regular,
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    pickerScroll: {
        marginBottom: 16,
    },
    binOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    binOptionText: {
        fontFamily: fonts.family.medium,
        fontSize: 16,
        color: '#333',
    },
    checkedIcon: {
        color: themeColors.primary,
        fontWeight: 'bold',
    },
    noBinsText: {
        fontFamily: fonts.family.regular,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginVertical: 20,
    },
    closePickerButton: {
        alignItems: 'center',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    closePickerText: {
        fontFamily: fonts.family.medium,
        fontSize: 16,
        color: '#666',
    },
});

export default BinAssignmentModal;
