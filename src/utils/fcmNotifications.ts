import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getMessaging, getToken, onMessage, requestPermission, AuthorizationStatus, registerDeviceForRemoteMessages } from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function requestUserPermission() {
    if (isExpoGo) return false;
    try {
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
    } catch (e) {
        console.warn('Firebase Messaging Permission Request failed. Native module missing?', e);
        return false;
    }
}

export async function getFcmToken() {
    if (isExpoGo) return null;
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
    if (isExpoGo) return;
    try {
        if (Platform.OS === 'ios') {
            await registerDeviceForRemoteMessages(getMessaging());
        }
    } catch (e) {
        console.warn('registerAppWithFCM failed', e);
    }
}

export function subscribeToForegroundNotifications() {
    if (isExpoGo) return () => {};
    try {
        const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
            console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
        });
        return unsubscribe;
    } catch (e) {
        console.warn('subscribeToForegroundNotifications failed', e);
        return () => {};
    }
}
