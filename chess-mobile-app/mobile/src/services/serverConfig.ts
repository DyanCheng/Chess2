import AsyncStorage from '@react-native-async-storage/async-storage';

const URL_KEY = '@arcane_chess/server_url';
const PLAYER_KEY = '@arcane_chess/player_id';

export const resolveServerUrl = (savedUrl: string | null, envUrl: string): string => {
  const configuredUrl = envUrl.trim().replace(/\/+$/, '');
  return savedUrl === null ? configuredUrl : savedUrl;
};

let cachedUrl: string | null = null;
let cachedPlayerId: string | null = null;

export const serverConfig = {
  async getUrl(): Promise<string> {
    if (cachedUrl !== null) return cachedUrl;
    const savedUrl = await AsyncStorage.getItem(URL_KEY);
    cachedUrl = resolveServerUrl(savedUrl, process.env.EXPO_PUBLIC_API_URL || '');
    return cachedUrl;
  },
  async setUrl(value: string): Promise<void> {
    const url = value.trim().replace(/\/+$/, '');
    if (url && !/^https?:\/\/[^\s/]+(?::\d+)?$/.test(url)) {
      throw new Error('Nhập địa chỉ dạng http://192.168.1.10:8082');
    }
    await AsyncStorage.setItem(URL_KEY, url);
    cachedUrl = url;
  },
  async getPlayerId(): Promise<string> {
    if (cachedPlayerId) return cachedPlayerId;
    cachedPlayerId = await AsyncStorage.getItem(PLAYER_KEY);
    if (!cachedPlayerId) {
      cachedPlayerId = `mobile_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem(PLAYER_KEY, cachedPlayerId);
    }
    return cachedPlayerId;
  },
};
