import React, { useEffect, useRef } from 'react';
import { Modal, ModalProps, View, StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { setActiveFlashMessage } from '../utils/toast';

/**
 * A wrapper around React Native's native Modal that includes a FlashMessage component.
 * This ensures that toast notifications triggered while the modal is visible 
 * appear on top of the modal content.
 */
const AppModal: React.FC<ModalProps> = (props) => {
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

    return (
        <Modal {...props}>
            <View style={styles.container}>
                {props.children}
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
    flashMessage: {
        zIndex: 9999,
        elevation: 9999,
    }
});

export default AppModal;
