import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Image,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/fonts';
import LocationIcon from '../assets/images/Ellipse 11.svg'; // Using as a dot or indicator

const MiddleImage = require('../assets/images/image1_25_2.png');

const { width, height } = Dimensions.get('window');

interface IncomingRequestModalProps {
    visible: boolean;
    requestData: any;
    onAccept: (totalPrice: number) => void;
    onDecline: () => void;
}

const IncomingRequestModal: React.FC<IncomingRequestModalProps> = ({
    visible,
    requestData,
    onAccept,
    onDecline,
}) => {
    if (!requestData) return null;

    const request = requestData.request || {};
    console.log('Request data:', request);
    console.log('Request items:', request.items);
    console.log('Items length:', request.items?.length);

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (e) {
            return dateStr;
        }
    };

    const [totalPrice, setTotalPrice] = React.useState<string>('');

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            statusBarTranslucent
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <LinearGradient
                    colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.95)']}
                    style={styles.container}
                >
                    <View style={styles.contentCard}>
                        <LinearGradient
                            colors={['#29B554', '#6EAD16']}
                            style={styles.headerGradient}
                        >
                            <Text style={styles.headerTitle}>New Service Request!</Text>
                            <Text style={styles.headerSubtitle}>
                                {request.items && request.items.length > 0
                                    ? `${request.items.length} Bin${request.items.length > 1 ? 's' : ''} Requested`
                                    : 'Instant Booking Available'}
                            </Text>
                        </LinearGradient>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.detailsContainer}>
                                {request.items && request.items.length > 0 ? (
                                    // Group items by type and size
                                    Object.values(request.items.reduce((acc: any, item: any) => {
                                        const key = `${item.bin_type_id}-${item.bin_size_id}`;
                                        if (!acc[key]) {
                                            acc[key] = { ...item, count: 1 };
                                        } else {
                                            acc[key].count += 1;
                                        }
                                        return acc;
                                    }, {})).map((item: any, index: number) => (
                                        <View key={index} style={styles.binInfoRow}>
                                            <View style={styles.iconContainer}>
                                                <Image
                                                    source={MiddleImage}
                                                    style={{ width: 70 }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <View style={styles.binTextContainer}>
                                                <Text style={styles.binType}>
                                                    {item.count > 1 ? `${item.count}x ` : ''}
                                                    {item.bin_type_name || 'N/A'}
                                                </Text>
                                                <Text style={styles.binSize}>{item.bin_size || 'N/A'}</Text>
                                            </View>
                                        </View>
                                    ))
                                ) : (
                                    <View style={styles.binInfoRow}>
                                        <View style={styles.iconContainer}>
                                            <Image
                                                source={MiddleImage}
                                                style={{ width: 70 }}
                                                resizeMode="contain"
                                            />
                                        </View>
                                        <View style={styles.binTextContainer}>
                                            <Text style={styles.binType}>{request.bin_type_name || 'N/A'}</Text>
                                            <Text style={styles.binSize}>{request.bin_size || 'N/A'}</Text>
                                        </View>
                                    </View>
                                )}

                                <View style={styles.divider} />

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Location:</Text>
                                    <Text style={styles.infoValue} numberOfLines={2}>
                                        {request.location || 'N/A'}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Duration:</Text>
                                    <Text style={styles.infoValue}>
                                        {formatDate(request.start_date)} to {formatDate(request.end_date)}
                                    </Text>
                                </View>

                                {request.instructions ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Note:</Text>
                                        <Text style={styles.infoValue} numberOfLines={2}>
                                            {request.instructions}
                                        </Text>
                                    </View>
                                ) : null}

                                {/* Price Input Section */}
                                <View style={styles.priceInputContainer}>
                                    <Text style={styles.priceLabel}>Your Quote (Total Price) *</Text>
                                    <TextInput
                                        style={styles.priceInput}
                                        placeholder="Enter total price (e.g., 250.00)"
                                        placeholderTextColor="#999"
                                        keyboardType="decimal-pad"
                                        value={totalPrice}
                                        onChangeText={setTotalPrice}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={styles.declineButton}
                                onPress={onDecline}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.declineButtonText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.acceptButton}
                                onPress={() => {
                                    const price = parseFloat(totalPrice);
                                    if (!totalPrice || isNaN(price) || price <= 0) {
                                        return; // Visual feedback will be added via styling
                                    }
                                    onAccept(price);
                                }}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#C0F96F', '#90B93E']}
                                    style={styles.acceptButtonGradient}
                                >
                                    <Text style={styles.acceptButtonText}>ACCEPT NOW</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    contentCard: {
        width: width * 0.9,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    headerGradient: {
        paddingVertical: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: fonts.family.bold,
        fontSize: 24,
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontFamily: fonts.family.medium,
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    scrollView: {
        maxHeight: height * 0.5,
    },
    scrollContent: {
        flexGrow: 1,
    },
    detailsContainer: {
        padding: 24,
    },
    binInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 100,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffff',
        borderRadius: 10,
    },
    binTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    binType: {
        fontFamily: fonts.family.bold,
        fontSize: 20,
        color: '#373934',
    },
    binSize: {
        fontFamily: fonts.family.medium,
        fontSize: 16,
        color: '#29B554',
    },
    divider: {
        height: 1,
        backgroundColor: '#EEEEEE',
        marginBottom: 20,
    },
    infoRow: {
        marginBottom: 16,
    },
    infoLabel: {
        fontFamily: fonts.family.medium,
        fontSize: 14,
        color: '#979897',
        marginBottom: 4,
    },
    infoValue: {
        fontFamily: fonts.family.regular,
        fontSize: 16,
        color: '#373934',
        lineHeight: 22,
    },
    priceInputContainer: {
        marginTop: 20,
        marginBottom: 8,
    },
    priceLabel: {
        fontFamily: fonts.family.medium,
        fontSize: 14,
        color: '#373934',
        marginBottom: 8,
    },
    priceInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        fontFamily: fonts.family.regular,
        color: '#333',
        borderWidth: 1,
        borderColor: '#DDDDDD',
    },
    actionsContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        backgroundColor: '#F9F9F9',
    },
    declineButton: {
        flex: 1,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DDDDDD',
    },
    declineButtonText: {
        fontFamily: fonts.family.bold,
        fontSize: 16,
        color: '#666666',
    },
    acceptButton: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
    },
    acceptButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    acceptButtonText: {
        fontFamily: fonts.family.bold,
        fontSize: 18,
        color: '#161616',
    },
});

export default IncomingRequestModal;
