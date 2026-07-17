import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { Linking } from 'react-native';
import { STORAGE_KEYS } from '@/storage/keys';
import type { ContactPermissionStatus, StoredContactPermission } from '@/types/permissions';

const DEFAULT_PERMISSION: StoredContactPermission = {
  status: 'undetermined',
  canAskAgain: true,
  checkedAt: '',
};

function isPermissionStatus(value: unknown): value is ContactPermissionStatus {
  return value === 'granted' || value === 'denied' || value === 'undetermined';
}

async function persist(status: ContactPermissionStatus, canAskAgain: boolean): Promise<StoredContactPermission> {
  const state = { status, canAskAgain, checkedAt: new Date().toISOString() };
  await AsyncStorage.setItem(STORAGE_KEYS.contactPermission, JSON.stringify(state));
  return state;
}

export const ContactPermissionService = {
  async loadStored(): Promise<StoredContactPermission> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.contactPermission);
    if (!value) return DEFAULT_PERMISSION;
    try {
      const parsed = JSON.parse(value) as Partial<StoredContactPermission>;
      if (!isPermissionStatus(parsed.status) || typeof parsed.canAskAgain !== 'boolean') return DEFAULT_PERMISSION;
      return { status: parsed.status, canAskAgain: parsed.canAskAgain, checkedAt: typeof parsed.checkedAt === 'string' ? parsed.checkedAt : '' };
    } catch {
      return DEFAULT_PERMISSION;
    }
  },

  async check(): Promise<StoredContactPermission> {
    const permission = await Contacts.getPermissionsAsync();
    const status: ContactPermissionStatus = permission.granted ? 'granted' : permission.status === 'denied' ? 'denied' : 'undetermined';
    return persist(status, permission.canAskAgain);
  },

  async request(): Promise<StoredContactPermission> {
    const permission = await Contacts.requestPermissionsAsync();
    const status: ContactPermissionStatus = permission.granted ? 'granted' : permission.status === 'denied' ? 'denied' : 'undetermined';
    return persist(status, permission.canAskAgain);
  },

  async openSettings(): Promise<void> {
    await Linking.openSettings();
  },
};
