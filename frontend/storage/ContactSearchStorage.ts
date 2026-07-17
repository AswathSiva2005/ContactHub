import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { SearchableContact } from '@/types/search';

type ContactStore = Record<string, SearchableContact>;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function matches(contact: SearchableContact, query: string): boolean {
  const term = normalized(query);
  if (!term) return false;
  const textMatch = [
    contact.studentName,
    contact.parentName,
    contact.rollNumber,
    contact.studentNumber,
    contact.parentNumber,
  ].some((value) => normalized(value).includes(term));
  const phoneTerm = query.replace(/\D/g, '');
  const phoneMatch = phoneTerm.length > 0 && [contact.studentNumber, contact.parentNumber]
    .some((value) => value.replace(/\D/g, '').includes(phoneTerm));
  return textMatch || phoneMatch;
}

async function read(): Promise<ContactStore> {
  const stored = await AsyncStorage.getItem(STORAGE_KEYS.searchableContacts);
  if (!stored) return {};
  try {
    const parsed: unknown = JSON.parse(stored);
    return typeof parsed === 'object' && parsed !== null ? parsed as ContactStore : {};
  } catch {
    return {};
  }
}

export const ContactSearchStorage = {
  async search(query: string): Promise<SearchableContact[]> {
    const contacts = Object.values(await read());
    return contacts.filter((contact) => matches(contact, query));
  },

  async save(contact: SearchableContact): Promise<void> {
    const contacts = await read();
    contacts[contact.contactUuid] = contact;
    await AsyncStorage.setItem(STORAGE_KEYS.searchableContacts, JSON.stringify(contacts));
  },

  async saveMany(items: SearchableContact[]): Promise<void> {
    if (!items.length) return;
    const contacts = await read();
    for (const contact of items) contacts[contact.contactUuid] = contact;
    await AsyncStorage.setItem(STORAGE_KEYS.searchableContacts, JSON.stringify(contacts));
  },

  async remove(contactUuid: string): Promise<void> {
    const contacts = await read();
    delete contacts[contactUuid];
    await AsyncStorage.setItem(STORAGE_KEYS.searchableContacts, JSON.stringify(contacts));
  },

  async removeMany(contactUuids: string[]): Promise<void> {
    const contacts = await read();
    for (const contactUuid of contactUuids) delete contacts[contactUuid];
    await AsyncStorage.setItem(STORAGE_KEYS.searchableContacts, JSON.stringify(contacts));
  },

  async removeBatch(batchId: string): Promise<void> {
    const contacts = await read();
    for (const [contactUuid, contact] of Object.entries(contacts)) {
      if (contact.batchId === batchId) delete contacts[contactUuid];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.searchableContacts, JSON.stringify(contacts));
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.searchableContacts);
  },
};
