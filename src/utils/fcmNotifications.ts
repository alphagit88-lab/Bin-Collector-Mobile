import { getMessaging, getToken, onMessage, requestPermission, AuthorizationStatus, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

export async function requestUserPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            console.log('Permission denied for notifications');
            return false;
        }
    }

    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
        console.log('Authorization status:', authStatus);
    }
    return enabled;
}

export async function getFcmToken() {
    try {
        const token = await getToken(getMessaging());
        if (token) {
            console.log('FCM Token Received');
            return token;
        }
    } catch (error) {
        console.error('Error getting FCM token:', error);
    }
    return null;
}

export async function updatePushToken(token: string) {
    try {
        const response = await api.put(ENDPOINTS.AUTH.UPDATE_PUSH_TOKEN, { pushToken: token });
        return response.success;
    } catch (error) {
        console.error('Error updating push token in DB:', error);
        return false;
    }
}

export async function registerAppWithFCM() {
    if (Platform.OS === 'ios') {
        await registerDeviceForRemoteMessages(getMessaging());
    }
}

export function subscribeToForegroundNotifications() {
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
        console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
}
