import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { post } from './apiClient';
import * as Device from 'expo-device';

const PUSH_TOKEN_STORAGE_KEY = 'sibol_expo_push_token';
const PUSH_LAST_SYNC_AT_KEY = 'sibol_push_last_sync_at';

// ✅ REMOVED setNotificationHandler from here — it now lives in App.tsx

function getProjectId(): string | null {
  const fromEas = (Constants as any)?.easConfig?.projectId ?? null;
  const fromExtra = (Constants as any)?.expoConfig?.extra?.eas?.projectId ?? null;
  return fromEas || fromExtra || null;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',              // ✅ capitalized for display in Android settings
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 200, 200, 200],
    lightColor: '#88AB8E',
    enableVibrate: true,          // ✅ explicitly enable vibration
  });
}

async function hasAuthToken(): Promise<boolean> {
  const token = await AsyncStorage.getItem('token');
  return !!token;
}

async function requestPushPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  return finalStatus === 'granted';
}

async function getExpoPushToken(): Promise<string | null> {
  const isPhysicalDevice = Device.isDevice === true;

  if (!isPhysicalDevice) {
    console.warn('[push] Physical device is required for push notifications.');
    return null;
  }

  const projectId = getProjectId();
  if (!projectId) {
    console.warn('[push] Missing Expo projectId in app config.');
    return null;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('[push] Expo push token:', tokenResult?.data); // ✅ log token for debugging
    return tokenResult?.data ?? null;
  } catch (e) {
    console.warn('[push] getExpoPushTokenAsync failed', e);
    return null;
  }
}

export async function registerPushForCurrentUser(force = false): Promise<{
  registered: boolean;
  reason?: string;
  token?: string;
}> {
  if (!(await hasAuthToken())) {
    console.log('[push] skipped: not authenticated'); // ✅ added log
    return { registered: false, reason: 'not_authenticated' };
  }

  await ensureAndroidChannel();

  const granted = await requestPushPermission();
  if (!granted) {
    console.warn('[push] skipped: permission denied'); // ✅ added log
    return { registered: false, reason: 'permission_denied' };
  }

  const expoPushToken = await getExpoPushToken();
  if (!expoPushToken) {
    return { registered: false, reason: 'token_unavailable' };
  }

  const previousToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  if (!force && previousToken === expoPushToken) {
    return { registered: true, reason: 'already_synced', token: expoPushToken };
  }

  // ✅ Wrap backend call in try/catch so a network error doesn't crash the whole flow
  try {
    await post('/api/push/register', {
      expoPushToken,
      platform: Platform.OS,
    });
    console.log('[push] token registered with backend'); // ✅ added log
  } catch (e) {
    console.warn('[push] failed to register token with backend', e);
    return { registered: false, reason: 'backend_error' };
  }

  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoPushToken);
  await AsyncStorage.setItem(PUSH_LAST_SYNC_AT_KEY, new Date().toISOString());

  return { registered: true, token: expoPushToken };
}

export async function unregisterPushOnLogout(): Promise<void> {
  const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
  const authed = await hasAuthToken();

  if (authed) {
    try {
      if (cachedToken) {
        await post('/api/push/unregister', { expoPushToken: cachedToken });
      } else {
        await post('/api/push/unregister', {});
      }
    } catch (e) {
      console.warn('[push] unregister failed (continuing logout)', e);
    }
  }

  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  await AsyncStorage.removeItem(PUSH_LAST_SYNC_AT_KEY);
}

// ✅ Call this after successful login, not on app mount
export async function initializePushForCurrentUser(): Promise<void> {
  try {
    const result = await registerPushForCurrentUser(true);
    if (!result.registered) {
      console.log('[push] skipped init:', result.reason);
    } else {
      console.log('[push] init success, token:', result.token);
    }
  } catch (e) {
    console.warn('[push] init failed', e);
  }
}

export function attachPushListeners(): () => void {
  const onReceived = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[push] foreground notification:', notification.request?.content?.title);
  });

  const onTapped = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[push] notification tapped:', response.notification.request?.content?.data);
  });

  return () => {
    onReceived.remove();
    onTapped.remove();
  };
}