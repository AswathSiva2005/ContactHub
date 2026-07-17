import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { PhoneContactMapping } from '@/types/contactImport';

type MappingStore = Record<string, PhoneContactMapping>;

async function readMappings(): Promise<MappingStore> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.phoneContactMappings);
  if (!stored) return {};
  try {
    const parsed: unknown = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed as MappingStore : {};
  } catch {
    return {};
  }
}

export const PhoneContactStorage = {
  async save(mapping: PhoneContactMapping): Promise<void> {
    const mappings = await readMappings();
    mappings[mapping.contactUuid] = mapping;
    await AsyncStorage.setItem(STORAGE_KEYS.phoneContactMappings, JSON.stringify(mappings));
  },

  async remove(contactUuid: string): Promise<void> {
    const mappings = await readMappings();
    delete mappings[contactUuid];
    await AsyncStorage.setItem(STORAGE_KEYS.phoneContactMappings, JSON.stringify(mappings));
  },

  async removeMany(contactUuids: string[]): Promise<void> {
    const mappings = await readMappings();
    for (const contactUuid of contactUuids) delete mappings[contactUuid];
    await AsyncStorage.setItem(STORAGE_KEYS.phoneContactMappings, JSON.stringify(mappings));
  },

  async removeBatch(batchId: string): Promise<void> {
    const mappings = await readMappings();
    for (const [contactUuid, mapping] of Object.entries(mappings)) {
      if (mapping.batchId === batchId) delete mappings[contactUuid];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.phoneContactMappings, JSON.stringify(mappings));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.phoneContactMappings);
  },
};
