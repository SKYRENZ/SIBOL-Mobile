import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'sibol.boundary.';
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // ignore
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
        return;
      }
    } catch {
      // ignore
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
  },
};

function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

function cacheKey(query: string): string {
  return `${CACHE_PREFIX}${hashString(query)}`;
}

export async function getCachedBoundary(query: string): Promise<any | null> {
  const key = cacheKey(query);
  const raw = await storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { ts: number; feature: any };
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.feature ?? null;
  } catch {
    return null;
  }
}

export async function setCachedBoundary(query: string, feature: any): Promise<void> {
  const key = cacheKey(query);
  const payload = JSON.stringify({ ts: Date.now(), feature });
  await storage.setItem(key, payload);
}
