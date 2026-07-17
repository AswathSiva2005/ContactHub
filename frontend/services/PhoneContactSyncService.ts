import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import { ContactPermissionService } from '@/services/ContactPermissionService';
import { NamingPreferenceStorage } from '@/storage/NamingPreferenceStorage';
import { PhoneContactStorage } from '@/storage/PhoneContactStorage';
import type { ContactRecord, PhoneContactIds } from '@/types/batch';
import { formatContactName } from '@/utils/contactNaming';

export interface PhoneSyncResult { changed: number; unavailable: boolean; failed: number }

function phoneKey(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

async function canModifyPhone(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const permission = await ContactPermissionService.check();
  return permission.status === 'granted';
}

async function readContactSyncContacts(): Promise<Contacts.ExistingContact[]> {
  const response = await Contacts.getContactsAsync({
    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Note],
    pageSize: 0,
  });
  return response.data.filter((contact) => contact.note?.includes('ContactSync'));
}

function fallbackIds(record: PhoneContactIds, contacts: Contacts.ExistingContact[], target: 'student' | 'parent'): string[] {
  const expectedPhone = phoneKey(target === 'student' ? record.studentNumber : record.parentNumber);
  return contacts
    .filter((contact) => {
      const hasUuid = contact.note?.includes(`UUID: ${record.contactUuid}`) ?? false;
      const hasPhone = expectedPhone && (contact.phoneNumbers ?? []).some((phone) => phoneKey(phone.number) === expectedPhone);
      return hasUuid && (!expectedPhone || hasPhone);
    })
    .map((contact) => contact.id);
}

async function removeFirstAvailable(ids: (string | null | undefined)[]): Promise<boolean> {
  for (const id of [...new Set(ids.filter((value): value is string => Boolean(value)))]) {
    try {
      if (!await Contacts.getContactByIdAsync(id)) continue;
      await Contacts.removeContactAsync(id);
      if (!await Contacts.getContactByIdAsync(id)) return true;
    } catch { /* Try the metadata fallback ID. */ }
  }
  return false;
}

async function updateFirstAvailable(ids: (string | null | undefined)[], changes: Partial<Contacts.ExistingContact>): Promise<boolean> {
  for (const id of [...new Set(ids.filter((value): value is string => Boolean(value)))]) {
    try {
      if (!await Contacts.getContactByIdAsync(id)) continue;
      await Contacts.updateContactAsync({ id, ...changes });
      return true;
    } catch { /* Try the metadata fallback ID. */ }
  }
  return false;
}

function hasPhone(contact: Contacts.ExistingContact, phone: string): boolean {
  const expected = phoneKey(phone);
  return Boolean(expected) && (contact.phoneNumbers ?? []).some((item) => phoneKey(item.number) === expected);
}

function chooseContactId(contacts: Contacts.ExistingContact[], preferredId: string | null | undefined): string | undefined {
  return contacts.find((contact) => contact.id === preferredId)?.id ?? contacts[0]?.id;
}

async function reconcileUpdatedPair(contact: ContactRecord): Promise<number> {
  const matching = (await readContactSyncContacts())
    .filter((phoneContact) => phoneContact.note?.includes(`UUID: ${contact.contactUuid}`));
  const studentMatches = matching.filter((phoneContact) => hasPhone(phoneContact, contact.studentNumber));
  const parentMatches = matching.filter((phoneContact) => hasPhone(phoneContact, contact.parentNumber));
  const keepStudentId = chooseContactId(studentMatches, contact.studentPhoneContactId ?? contact.phoneContactId);
  const keepParentId = chooseContactId(parentMatches, contact.parentPhoneContactId);
  if (!keepStudentId || !keepParentId) return 0;

  let failures = 0;
  const keepIds = new Set([keepStudentId, keepParentId]);
  for (const stale of matching.filter((phoneContact) => !keepIds.has(phoneContact.id))) {
    try { await Contacts.removeContactAsync(stale.id); } catch { failures += 1; }
  }
  return failures;
}

export const PhoneContactSyncService = {
  async assertNativeAccess(): Promise<void> {
    if (Platform.OS === 'web') return;
    if (!await canModifyPhone()) {
      throw new Error('Contacts permission is required to keep Android phone contacts synchronized. Enable it in Settings and try again.');
    }
  },

  async remove(records: PhoneContactIds[]): Promise<PhoneSyncResult> {
    if (!await canModifyPhone()) {
      await PhoneContactStorage.removeMany(records.map((record) => record.contactUuid));
      return { changed: 0, unavailable: true, failed: 0 };
    }
    let changed = 0;
    let failed = 0;
    let contactSyncContacts: Contacts.ExistingContact[] | null = null;
    for (const record of records) {
      const studentPrimaryId = record.studentPhoneContactId ?? record.phoneContactId;
      let studentRemoved = await removeFirstAvailable([studentPrimaryId]);
      if (!studentRemoved) {
        contactSyncContacts ??= await readContactSyncContacts();
        studentRemoved = await removeFirstAvailable(fallbackIds(record, contactSyncContacts, 'student'));
      }
      let parentRemoved = await removeFirstAvailable([record.parentPhoneContactId]);
      if (!parentRemoved) {
        contactSyncContacts ??= await readContactSyncContacts();
        parentRemoved = await removeFirstAvailable(fallbackIds(record, contactSyncContacts, 'parent'));
      }
      changed += Number(studentRemoved) + Number(parentRemoved);
      failed += Number(!studentRemoved) + Number(!parentRemoved);
      await PhoneContactStorage.remove(record.contactUuid);
    }
    return { changed, unavailable: false, failed };
  },

  async update(contact: ContactRecord, previous: ContactRecord = contact): Promise<PhoneSyncResult> {
    if (!await canModifyPhone()) return { changed: 0, unavailable: true, failed: 0 };
    const [preference, contactSyncContacts] = await Promise.all([NamingPreferenceStorage.load(), readContactSyncContacts()]);
    const studentDisplayName = formatContactName(contact, preference);
    const parentDisplayName = `${contact.parentName} (${studentDisplayName})`;
    const studentUpdated = await updateFirstAvailable(
      [contact.studentPhoneContactId ?? contact.phoneContactId, ...fallbackIds(previous, contactSyncContacts, 'student')],
      {
        name: studentDisplayName,
        firstName: studentDisplayName,
        middleName: '',
        lastName: '',
        namePrefix: '',
        nameSuffix: '',
        phoneNumbers: [{ label: 'mobile', number: contact.studentNumber }],
      },
    );
    const parentUpdated = await updateFirstAvailable(
      [contact.parentPhoneContactId, ...fallbackIds(previous, contactSyncContacts, 'parent')],
      {
        name: parentDisplayName,
        firstName: parentDisplayName,
        middleName: '',
        lastName: '',
        namePrefix: '',
        nameSuffix: '',
        phoneNumbers: [{ label: 'mobile', number: contact.parentNumber }],
      },
    );
    const reconciliationFailures = studentUpdated && parentUpdated ? await reconcileUpdatedPair(contact) : 0;
    return {
      changed: Number(studentUpdated) + Number(parentUpdated),
      unavailable: false,
      failed: Number(!studentUpdated) + Number(!parentUpdated) + reconciliationFailures,
    };
  },
};
