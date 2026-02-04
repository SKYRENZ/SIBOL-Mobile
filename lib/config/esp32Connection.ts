import WifiManager from 'react-native-wifi-reborn';

export async function connectToESP32(ssid: string): Promise<void> {
  if (!ssid) throw new Error('SSID is required');

  const mgr: any = (WifiManager as any)?.default ?? WifiManager;
  // hard-coded ESP32 password per request
  const password = ssid === 'ESP32_AP' ? '12345678' : '';

  // 1) direct open SSID API
  if (typeof mgr.connectToSSID === 'function') {
    await mgr.connectToSSID(ssid);
    return;
  }

  // 2) protected SSID variants (try several signatures / callback styles)
  if (typeof mgr.connectToProtectedSSID === 'function') {
    const fn = mgr.connectToProtectedSSID.bind(mgr);

    // Try common Promise forms first (3-arg then 4-arg)
    try {
      const res = fn(ssid, password, false); // (ssid, password, isWEP)
      if (res && typeof res.then === 'function') {
        await res;
        return;
      }
    } catch (_) {}

    try {
      const res4 = fn(ssid, password, false, false); // (ssid, password, isWEP, isHidden/flags)
      if (res4 && typeof res4.then === 'function') {
        await res4;
        return;
      }
    } catch (_) {}

    // Try callback-style with 4 args: (ssid, password, isWEP, callback)
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          fn(ssid, password, false, (result: any) => {
            // consider any callback invocation as success
            resolve();
          });
        } catch (err) {
          reject(err);
        }
      });
      return;
    } catch (_) {}

    // Try callback-style with 5 args: (ssid, password, isWEP, successCb, failureCb)
    // This is last-resort because some natives expect 4 args only (calling with 5 may throw)
    try {
      await new Promise<void>((resolve, reject) => {
        try {
          fn(
            ssid,
            password,
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