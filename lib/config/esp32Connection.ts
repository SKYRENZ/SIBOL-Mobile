import WifiManager from 'react-native-wifi-reborn';

export async function connectToESP32(ssid: string, password?: string): Promise<void> {
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