import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { NamingPreference } from '@/types/naming';
import { DEFAULT_NAMING_PREFERENCE, isNamingFormat } from '@/utils/contactNaming';

const MAX_PREFIX_LENGTH = 30;

function sanitize(preference: NamingPreference): NamingPreference {
  return {
    format: preference.format,
    customPrefix: preference.customPrefix.trim().slice(0, MAX_PREFIX_LENGTH),
  };
}

export const NamingPreferenceStorage = {
  async load(): Promise<NamingPreference> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.namingPreference);
    if (!stored) return DEFAULT_NAMING_PREFERENCE;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== 'object' || parsed === null) return DEFAULT_NAMING_PREFERENCE;
      const candidate = parsed as Partial<NamingPreference>;
      if (!isNamingFormat(candidate.format)) return DEFAULT_NAMING_PREFERENCE;
      return sanitize({ format: candidate.format, customPrefix: typeof candidate.customPrefix === 'string' ? candidate.customPrefix : '' });
    } catch {
      return DEFAULT_NAMING_PREFERENCE;
    }
  },

  async save(preference: NamingPreference): Promise<NamingPreference> {
    const clean = sanitize(preference);
    if (clean.format === 'customPrefix' && !clean.customPrefix) {
      throw new Error('Enter a custom prefix before saving.');
    }
    await AsyncStorage.setItem(STORAGE_KEYS.namingPreference, JSON.stringify(clean));
    return clean;
  },
};
