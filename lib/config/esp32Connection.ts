import WifiManager from 'react-native-wifi-reborn';

const ESP32_AP_SSID = 'ESP32-Setup'; // ESP32 AP name (matches Arduino sketch)
const ESP32_AP_PASSWORD = '12345678'; // ESP32 AP password (matches Arduino sketch)
const ESP32_IP = '192.168.4.1'; // Default ESP32 AP IP
const CREDENTIALS_ENDPOINT = `http://${ESP32_IP}/wifi`;

/**
 * Connect to ESP32's AP
 */
async function connectToESP32AP(): Promise<void> {
  await connectToNetwork(ESP32_AP_SSID, ESP32_AP_PASSWORD);
}

/**
 * Send WiFi credentials to ESP32
 */
async function sendCredentialsToESP32(
  targetSSID: string,
  targetPassword: string
): Promise<void> {
  try {
    const response = await fetch(CREDENTIALS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ssid: targetSSID,
        password: targetPassword,
      }),
      timeout: 10000,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send credentials: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    console.log('ESP32 credentials sent successfully:', result);
  } catch (error) {
    throw new Error(
      `Failed to send WiFi credentials to ESP32: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Generic network connection helper
 */
async function connectToNetwork(
  ssid: string,
  password?: string
): Promise<void> {
  if (!ssid) throw new Error('SSID is required');

  const mgr: any = (WifiManager as any)?.default ?? WifiManager;
  const pwd = password ?? '';

  // 1) direct open SSID API
  if (typeof mgr.connectToSSID === 'function') {
    // open network API doesn't accept password — call when no password
    if (pwd) {
      // some implementations provide connectToProtectedSSID only when password is needed
      // fallthrough to protected path
    } else {
      await mgr.connectToSSID(ssid);
      return;
    }
  }

  // 2) protected SSID variants (try several signatures / callback styles)
  if (typeof mgr.connectToProtectedSSID === 'function') {
    const fn = mgr.connectToProtectedSSID.bind(mgr);

    // Try common Promise forms first (3-arg then 4-arg)
    try {
      const res = fn(ssid, pwd, false); // (ssid, password, isWEP)
      if (res && typeof res.then === 'function') {
        await res;
        return;
      }
    } catch (_) {}

    try {
      const res4 = fn(ssid, pwd, false, false); // (ssid, password, isWEP, isHidden/flags)
      if (res4 && typeof res4.then === 'function') {
        await res4;
        return;
      }
    } catch (_) {}

    // Try callback-style with 4 args: (ssid, password, isWEP, callback)
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          fn(ssid, pwd, false, (result: any) => {
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
      return;
    } catch (_) {}

    // Try callback-style with 5 args: (ssid, password, isWEP, successCb, failureCb)
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          fn(
            ssid,
            pwd,
            false,
            () => resolve(),
            (err: any) => reject(err ?? new Error('Connection failed'))
          );
        } catch (err) {
          reject(err);
        }
      });
      return;
    } catch (_) {}

    throw new Error('connectToProtectedSSID failed for all attempted signatures');
  }

  throw new Error('No supported WifiManager connect method found');
}

/**
 * Main function: Connect to ESP32 AP, send WiFi credentials, then connect to target network
 */
export async function connectToESP32WithCredentials(
  targetSSID: string,
  targetPassword?: string
): Promise<void> {
  try {
    // Step 1: Connect to ESP32's AP
    console.log('Step 1: Connecting to ESP32 AP...');
    await connectToESP32AP();
    console.log('Successfully connected to ESP32 AP');

    // Step 2: Send WiFi credentials to ESP32
    console.log('Step 2: Sending WiFi credentials to ESP32...');
    await sendCredentialsToESP32(targetSSID, targetPassword ?? '');
    console.log('Successfully sent WiFi credentials to ESP32');

    // Step 3: Wait for ESP32 to connect and disconnect from AP
    console.log(
      'Step 3: Waiting for ESP32 to connect to target network...'
    );
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

    // Step 4: Disconnect from ESP32 AP
    console.log('Step 4: Disconnecting from ESP32 AP...');
    await disconnectFromESP32(ESP32_AP_SSID);
    console.log('Successfully disconnected from ESP32 AP');

    // Step 5: Connect to target network
    console.log('Step 5: Connecting to target network...');
    await connectToNetwork(targetSSID, targetPassword);
    console.log('Successfully connected to target network');
  } catch (error) {
    throw new Error(
      `ESP32 connection flow failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export async function disconnectFromESP32(ssid?: string): Promise<void> {
  const mgr: any = (WifiManager as any)?.default ?? WifiManager;
  if (typeof mgr.disconnect === 'function') {
    await mgr.disconnect();
    return;
  }
  if (typeof mgr.disconnectFromSSID === 'function') {
    await mgr.disconnectFromSSID(ssid ?? '');
    return;
  }
  throw new Error('No disconnect method available on WifiManager');
}