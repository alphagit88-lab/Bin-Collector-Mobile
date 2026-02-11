import { showMessage, MessageOptions } from "react-native-flash-message";

// Local reference tracker to handle multiple FlashMessage instances (e.g., in Modals)
let activeFlashMessage: any = null;

/**
 * Sets the active FlashMessage instance to be used by the toast utility.
 * Use this in Modals to redirect toast messages to the modal's internal FlashMessage.
 */
export const setActiveFlashMessage = (ref: any) => {
    activeFlashMessage = ref;
};

/**
 * Centralized Toast utility using react-native-flash-message.
 * Style this in one place as requested.
 */
const toast = {
    success: (message: string, description?: string, onPress?: () => void) => {
        toast.show({
            message,
            description,
            onPress,
            type: "success",
            backgroundColor: "#29B554",
            color: "#FFFFFF",
            icon: "success",
            duration: 3000,
        });
    },
    error: (message: string, description?: string, onPress?: () => void) => {
        toast.show({
            message,
            description,
            onPress,
            type: "danger",
            backgroundColor: "#FF4D4D",
            color: "#FFFFFF",
            icon: "danger",
            duration: 4000,
        });
    },
    info: (message: string, description?: string, onPress?: () => void) => {
        toast.show({
            message,
            description,
            onPress,
            type: "info",
            backgroundColor: "#3498DB",
            color: "#FFFFFF",
            icon: "info",
            duration: 3000,
        });
    },
    warning: (message: string, description?: string, onPress?: () => void) => {
        toast.show({
            message,
            description,
            onPress,
            type: "warning",
            backgroundColor: "#F39C12",
            color: "#FFFFFF",
            icon: "warning",
            duration: 3000,
        });
    },
    // Internal show method that respects the active reference
    show: (options: MessageOptions) => {
        const mergedOptions: MessageOptions = {
            floating: true,
            titleStyle: {
                fontFamily: 'LeagueSpartan_600SemiBold',
                fontSize: 16,
            },
            textStyle: {
                fontFamily: 'LeagueSpartan_400Regular',
                fontSize: 14,
            },
            ...options,
        };

        if (activeFlashMessage && typeof activeFlashMessage.showMessage === 'function') {
            activeFlashMessage.showMessage(mergedOptions);
        } else {
            showMessage(mergedOptions);
        }
    }
};

export default toast;
