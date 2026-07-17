import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { STORAGE_KEYS } from '@/storage/keys';

export const DeviceStorage = {
  async getOrCreateId(): Promise<string> {
    const existing = await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
    if (existing) return existing;
    const deviceId = String(uuid.v4());
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, deviceId);
    return deviceId;
  },
};
