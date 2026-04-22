import React, { useEffect, useRef } from 'react';
import { Modal, ModalProps, View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { setActiveFlashMessage } from '../utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../theme/fonts';

interface AppModalProps extends ModalProps {
    onClose?: () => void;
    title?: string;
}

/**
 * A wrapper around React Native's native Modal that includes a FlashMessage component.
 * This ensures that toast notifications triggered while the modal is visible 
 * appear on top of the modal content.
 */
const AppModal: React.FC<AppModalProps> = (props) => {
    const { onClose, title, children, ...modalProps } = props;
    const flashRef = useRef<FlashMessage>(null);

    useEffect(() => {
        if (props.visible && flashRef.current) {
            setActiveFlashMessage(flashRef.current);
        }

        // Cleanup: unset when hiding or unmounting
        return () => {
            if (props.visible) {
                setActiveFlashMessage(null);
            }
        };
    }, [props.visible]);

    const renderContent = () => {
        if (!onClose && !title) {
            return children;
        }

        return (
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.content} onPress={() => {}}>
                    {(title || onClose) && (
                        <View style={styles.header}>
                            {title ? <Text style={styles.title}>{title}</Text> : <View />}
                            {onClose && (
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color="#373934" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                    {children}
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <Modal 
            transparent={true} 
            animationType="fade" 
            {...modalProps}
            onRequestClose={onClose || modalProps.onRequestClose}
        >
            <View style={styles.container}>
                {renderContent()}
                {/* 
                  Only mount FlashMessage when the modal is visible. 
                  This ensures it becomes the 'latest' mounted instance and 
                  takes precedence over the global one in App.tsx.
                */}
                {props.visible && (
                    <FlashMessage
                        ref={flashRef}
                        position="top"
                        floating={true}
                        style={styles.flashMessage}
                    />
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 400,
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
        marginBottom: 20,
    },
    title: {
        fontFamily: fonts.family.bold,
        fontSize: 20,
        color: '#373934',
    },
    closeButton: {
        padding: 4,
    },
    flashMessage: {
        zIndex: 9999,
        elevation: 9999,
    }
});

export default AppModal;
