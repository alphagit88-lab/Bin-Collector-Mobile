import { Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import toast from './toast';

export async function requestCameraAccess(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (permission.granted) return true;

  if (!permission.canAskAgain) {
    Alert.alert(
      'Camera Permission Required',
      'Enable camera access in Settings to take a photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  } else {
    toast.error('Permission Denied', 'Camera permission is required to take a photo.');
  }

  return false;
}
