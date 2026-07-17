import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { BatchService } from '@/services/BatchService';
import { ContactSearchStorage } from '@/storage/ContactSearchStorage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { SearchableContact } from '@/types/search';

interface HealthData {
  service: string;
  status: string;
  database: string;
  timestamp: string;
}

interface SettingsStatus {
  backendOnline: boolean;
  mongoConnected: boolean;
  totalContacts: number;
  totalBatches: number;
  storageBytes: number;
}

async function storageBytes(): Promise<number> {
  const keys = await AsyncStorage.getAllKeys();
  const entries = await AsyncStorage.multiGet(keys);
  return entries.reduce((total, [key, value]) => total + key.length + (value?.length ?? 0), 0);
}

export const SettingsService = {
  async getStatus(): Promise<SettingsStatus> {
    const [healthResult, batchesResult, bytes] = await Promise.all([
      api.get<{ success: true; data: HealthData }>('/health').then((response) => response.data.data).catch(() => null),
      BatchService.getBatches('', 'newest').catch(() => null),
      storageBytes(),
    ]);
    return {
      backendOnline: healthResult?.status === 'ok',
      mongoConnected: healthResult?.database === 'connected',
      totalContacts: batchesResult?.reduce((sum, batch) => sum + batch.totalContacts, 0) ?? 0,
      totalBatches: batchesResult?.length ?? 0,
      storageBytes: bytes,
    };
  },

  async syncDatabase(): Promise<number> {
    const batches = await BatchService.getBatches('', 'newest');
    const contacts = await Promise.all(batches.map(async (batch) => {
      const records = await BatchService.getContacts(batch.batchId);
      return records.map<SearchableContact>((contact) => ({
        ...contact,
        batchName: batch.batchName,
        academicYear: batch.academicYear,
      }));
    }));
    await ContactSearchStorage.clear();
    await ContactSearchStorage.saveMany(contacts.flat());
    return contacts.reduce((sum, batchContacts) => sum + batchContacts.length, 0);
  },

  async backup(): Promise<void> {
    const protectedKeys: string[] = [STORAGE_KEYS.settingsBackup, STORAGE_KEYS.authToken, STORAGE_KEYS.authUser, STORAGE_KEYS.syncQueue, STORAGE_KEYS.batchesCache, STORAGE_KEYS.searchableContacts, STORAGE_KEYS.phoneContactMappings];
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => !protectedKeys.includes(key));
    const entries = await AsyncStorage.multiGet(keys);
    await AsyncStorage.setItem(STORAGE_KEYS.settingsBackup, JSON.stringify({
      version: 1,
      createdAt: new Date().toISOString(),
      entries,
    }));
  },

  async restore(): Promise<void> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.settingsBackup);
    if (!stored) throw new Error('No on-device backup is available.');
    const parsed = JSON.parse(stored) as { entries?: unknown };
    if (!Array.isArray(parsed.entries)) throw new Error('The on-device backup is invalid.');
    const protectedKeys: string[] = [STORAGE_KEYS.authToken, STORAGE_KEYS.authUser, STORAGE_KEYS.syncQueue, STORAGE_KEYS.batchesCache, STORAGE_KEYS.searchableContacts, STORAGE_KEYS.phoneContactMappings];
    const entries = parsed.entries.filter((entry): entry is [string, string] =>
      Array.isArray(entry) && typeof entry[0] === 'string' && typeof entry[1] === 'string' && !protectedKeys.includes(entry[0]));
    await AsyncStorage.multiSet(entries);
  },

  async clearCache(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.searchableContacts);
  },
};
