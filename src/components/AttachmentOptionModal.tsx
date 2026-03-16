import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/fonts';
import AppModal from './AppModal';
import { Ionicons } from '@expo/vector-icons';

interface AttachmentOptionModalProps {
    visible: boolean;
    onClose: () => void;
    onTakePhoto: () => void;
    onChooseGallery: () => void;
}

const AttachmentOptionModal: React.FC<AttachmentOptionModalProps> = ({
    visible,
    onClose,
    onTakePhoto,
    onChooseGallery,
}) => {
    return (
        <AppModal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Upload Attachment</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#373934" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>Choose an option to add your attachment</Text>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onTakePhoto();
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#F8FFEE', '#EFF2F0']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.optionGradient}
                            >
                                <View style={styles.iconCircle}>
                                    <Ionicons name="camera" size={24} color="#29B554" />
                                </View>
                                <Text style={styles.optionText}>Take Photo</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => {
                                onChooseGallery();
                                onClose();
                            }}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={['#F8FFEE', '#EFF2F0']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.optionGradient}
                            >
                                <View style={styles.iconCircle}>
                                    <Ionicons name="images" size={24} color="#29B554" />
                                </View>
                                <Text style={styles.optionText}>Choose from Gallery</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </AppModal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontFamily: fonts.family.bold,
        fontSize: 20,
        color: '#373934',
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontFamily: fonts.family.regular,
        fontSize: 14,
        color: '#666666',
        marginBottom: 24,
    },
    optionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    optionButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    optionGradient: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionText: {
        fontFamily: fonts.family.semiBold,
        fontSize: 14,
        color: '#373934',
        textAlign: 'center',
    },
    cancelButton: {
        width: '100%',
        height: 52,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    cancelText: {
        fontFamily: fonts.family.semiBold,
        fontSize: 16,
        color: '#666666',
    },
});

export default AttachmentOptionModal;
