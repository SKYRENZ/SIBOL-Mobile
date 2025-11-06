import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants from 'expo-constants';
import { API_BASE } from './apiClient';

// Read from expo config
const extras = (Constants as any).expoConfig?.extra ?? {};
const ANDROID_CLIENT_ID = extras?.GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = extras?.GOOGLE_WEB_CLIENT_ID;

console.log('[GoogleAuth] Configuring Google Sign-In...');
console.log('  Android Client ID:', ANDROID_CLIENT_ID);
console.log('  Web Client ID:', WEB_CLIENT_ID);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  offlineAccess: false,
  forceCodeForRefreshToken: false,
});

export async function startGoogleSignIn() {
  try {
    console.log('[GoogleAuth] Checking Play Services...');
    await GoogleSignin.hasPlayServices();

    console.log('[GoogleAuth] Starting sign-in...');
    const userInfo = await GoogleSignin.signIn();

    // ✅ Check if sign-in was cancelled
    if (!userInfo || !userInfo.data) {
      throw new Error('SIGN_IN_CANCELLED');
    }

    console.log('[GoogleAuth] Sign-in successful, getting tokens...');
    const tokens = await GoogleSignin.getTokens();

    const idToken = tokens.idToken;
    
    // ✅ Validate token exists before sending
    if (!idToken) {
      throw new Error('SIGN_IN_CANCELLED');
    }

    console.log('[GoogleAuth] Got idToken (first 50 chars):', idToken.substring(0, 50) + '...');

    console.log('[GoogleAuth] Sending to backend...');
    const response = await fetch(`${API_BASE}/api/auth/sso-google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[GoogleAuth] Backend error:', response.status, errorText);
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GoogleAuth] Backend response:', data);
    return data;
  } catch (error: any) {
    console.error('[GoogleAuth] Error:', error);
    
    // ✅ Handle cancellation errors gracefully
    if (error.code === 'SIGN_IN_CANCELLED' || error.message === 'SIGN_IN_CANCELLED') {
      const cancelError = new Error('Sign-in cancelled');
      (cancelError as any).code = 'SIGN_IN_CANCELLED';
      throw cancelError;
    } else if (error.code === 'IN_PROGRESS') {
      throw new Error('Sign-in already in progress');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Play Services not available');
    }
    
    throw error;
  }
}

export function useGoogleAuth() {
  return { request: null, response: null, promptAsync: startGoogleSignIn };
}

export function getGoogleRedirectUri() {
  return '';
}