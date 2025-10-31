import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { API_BASE } from './apiClient';
import { Platform } from 'react-native';

const useProxy = true; // force proxy during Expo Go testing (or keep your detection)
const makeRedirect = (opts?: any) => (AuthSession as any).makeRedirectUri({ scheme: 'sibol', useProxy: useProxy, ...(opts || {}) });

// read extras robustly (expoConfig, manifest, fallback to process.env)
const extras =
  (Constants as any).expoConfig?.extra ??
  (Constants as any).manifest?.extra ??
  process.env;

const ANDROID_CLIENT_ID = extras?.GOOGLE_ANDROID_CLIENT_ID;
const WEB_CLIENT_ID = extras?.GOOGLE_WEB_CLIENT_ID;
const clientId = useProxy ? WEB_CLIENT_ID : (ANDROID_CLIENT_ID ?? WEB_CLIENT_ID);
const redirectUri = makeRedirect();

console.log('Google auth debug -> useProxy:', useProxy, 'clientIdPresent:', !!clientId, 'clientId:', clientId);
console.log('Google auth debug -> redirectUri:', redirectUri);

function chooseClientId() {
  // Expo Go (useProxy true) requires the web client id (or useAuthRequest with proxy)
  if (useProxy) return WEB_CLIENT_ID;
  // dev-client / standalone: use Android native client id
  return ANDROID_CLIENT_ID ?? WEB_CLIENT_ID;
}

// helpful debug if missing
if (!clientId) {
  console.error('Google client id not found. Inspect available extras:', {
    useProxy,
    expoConfig: (Constants as any).expoConfig,
    manifest: (Constants as any).manifest,
    envKeys: { ANDROID_CLIENT_ID: ANDROID_CLIENT_ID ? 'present' : 'missing', WEB_CLIENT_ID: WEB_CLIENT_ID ? 'present' : 'missing' },
  });
  throw new Error('Google client id is not configured (check app.json extra / build env).');
}

// helper: open popup and poll safely until popup navigates back to redirectUri (same-origin)
async function webPopupAuth(authUrl: string, redirectUri: string) {
  return new Promise<any>(async (resolve, reject) => {
    try {
      const width = 600;
      const height = 700;
      const left = typeof window !== 'undefined' ? (window.screen.width - width) / 2 : 0;
      const top = typeof window !== 'undefined' ? (window.screen.height - height) / 2 : 0;
      const popup = (window as any).open(
        authUrl,
        '_blank',
        `toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`
      );
      if (!popup) return reject(new Error('Popup blocked by browser'));

      const checkInterval = 400;
      const timer = setInterval(async () => {
        try {
          // If popup closed by user or after redirect window.close
          if (popup.closed) {
            clearInterval(timer);

            // Attempt recovery: ask backend for a session-token (uses server-side session cookie)
            try {
              const resp = await fetch(`${API_BASE}/api/auth/session-token`, {
                method: 'POST',
                credentials: 'include', // send cookies so passport session is used
                headers: { 'Content-Type': 'application/json' },
              });
              if (resp.ok) {
                const data = await resp.json();
                // Return the token in same shape as AuthSession result
                return resolve({ type: 'success', params: { id_token: data?.token }, url: window.location.href, user: data?.user });
              }
            } catch (e) {
              // ignore and fall through to reject
            }

            return reject(new Error('Authentication cancelled'));
          }

          // Accessing popup.location.href will throw while at cross-origin (Google).
          // After Google redirects back to your redirectUri (same origin), this will succeed.
          const href = popup.location.href;
          if (href && typeof href === 'string' && href.startsWith(redirectUri)) {
            // parse fragment or query for id_token / access_token
            const frag = href.split('#')[1] ?? href.split('?')[1] ?? '';
            const params = new URLSearchParams(frag);
            const id_token = params.get('id_token') ?? params.get('access_token') ?? null;
            clearInterval(timer);
            try { popup.close(); } catch {}
            return resolve({ type: 'success', params: { id_token }, url: href });
          }
        } catch (e) {
          // Cross-origin while Google page is open — ignore and retry
        }
      }, checkInterval);
    } catch (err) {
      return reject(err);
    }
  });
}

export async function startGoogleSignIn() {
  const redirectUri = makeRedirect();
  console.warn('[google auth] debug', { redirectUri, clientId, ANDROID_CLIENT_ID, WEB_CLIENT_ID });
  const authEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'id_token',
    scope: 'openid profile email',
    nonce: Math.random().toString(36).slice(2),
    prompt: 'select_account',
  });
  const authUrl = `${authEndpoint}?${params.toString()}`;
  console.log('[google auth] opening authUrl with redirect:', redirectUri);

  let result: any;
  try {
    if (Platform.OS === 'web') {
      const authSess = AuthSession as any;
      // Prefer startAsync (uses postMessage + avoids COOP/COEP), but not all versions expose it at runtime.
      if (typeof authSess.startAsync === 'function') {
        result = await authSess.startAsync({ authUrl, returnUrl: redirectUri } as any);
      } else if (typeof authSess.openAuthSessionAsync === 'function') {
        // some builds expose openAuthSessionAsync on expo-auth-session
        console.warn('AuthSession.startAsync not available; using AuthSession.openAuthSessionAsync fallback');
        result = await authSess.openAuthSessionAsync(authUrl, redirectUri);
      } else {
        // final fallback: custom popup polling (avoids expo-web-browser COOP/COEP window.closed warning)
        console.warn('Using webPopupAuth fallback (manual popup + polling)');
        result = await webPopupAuth(authUrl, redirectUri);
      }
    } else {
      // mobile / native
      result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
    }
  } catch (err) {
    console.error('Auth open error', err);
    throw new Error('Failed to open auth session');
  }

  if (result?.type !== 'success') {
    throw new Error('Google sign-in cancelled or failed');
  }

  // extract id_token for both web (AuthSession) and native (openAuthSessionAsync returning url)
  let idToken: string | null = null;

  if (Platform.OS === 'web') {
    // AuthSession.startAsync returns params on web
    idToken = result?.params?.id_token ?? result?.params?.access_token ?? null;
    // fallback: parse returned url if present
    if (!idToken && result?.url) {
      const frag = result.url.split('#')[1] ?? result.url.split('?')[1] ?? '';
      const parsed = new URLSearchParams(frag);
      idToken = parsed.get('id_token') ?? parsed.get('access_token') ?? null;
    }
  } else {
    // native: openAuthSessionAsync returns .url with fragment
    const returned = result.url as string;
    const match = returned?.match(/[?&#]id_token=([^&]+)/) ?? null;
    idToken = match ? decodeURIComponent(match[1]) : null;
  }

  if (!idToken) {
    throw new Error('No id_token returned from Google');
  }

  // Debug: print small part of token + backend target so you can confirm network payload
  console.warn('[google auth] sending idToken ->', API_BASE, idToken?.slice(0, 40) + '...');

  const resp = await fetch(`${API_BASE}/api/auth/sso-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Backend error: ${resp.status} ${body}`);
  }
  return resp.json();
}

// also export a small helper so you can call it from UI for debug:
export function getGoogleRedirectUri() {
  return makeRedirect();
}