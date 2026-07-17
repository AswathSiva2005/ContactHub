import { isAxiosError } from 'axios';
import * as Contacts from 'expo-contacts';
import uuid from 'react-native-uuid';
import { ContactApiService } from '@/services/ContactApiService';
import { ContactPermissionService } from '@/services/ContactPermissionService';
import { DeviceStorage } from '@/storage/DeviceStorage';
import { NamingPreferenceStorage } from '@/storage/NamingPreferenceStorage';
import { PhoneContactStorage } from '@/storage/PhoneContactStorage';
import { ContactSearchStorage } from '@/storage/ContactSearchStorage';
import type { ContactImportInput, ContactImportProgress, ContactImportResult, PhoneContactMapping } from '@/types/contactImport';
import type { ImportedContactRow } from '@/types/excel';
import { formatContactName } from '@/utils/contactNaming';

type ProgressCallback = (progress: ContactImportProgress) => void;

function phoneKey(value: string): string {
  return value.replace(/\D/g, '');
}

function buildNote(batchId: string, academicYear: string, contactUuid: string): string {
  return ['ContactSync', `Batch ID: ${batchId}`, `Academic Year: ${academicYear}`, `UUID: ${contactUuid}`].join('\n');
}

async function getExistingPhoneNumbers(): Promise<Set<string>> {
  const response = await Contacts.getContactsAsync({ fields: [Contacts.Fields.PhoneNumbers], pageSize: 0 });
  const numbers = new Set<string>();
  for (const contact of response.data) {
    for (const phone of contact.phoneNumbers ?? []) {
      const key = phoneKey(phone.number ?? '');
      if (key) numbers.add(key);
    }
  }
  return numbers;
}

async function safelyRemovePhoneContact(contactId: string | undefined): Promise<void> {
  if (!contactId) return;
  try { await Contacts.removeContactAsync(contactId); } catch { /* The OS may already have removed it. */ }
}

async function createPhonePair(
  row: ImportedContactRow,
  studentDisplayName: string,
  note: string,
): Promise<{ studentPhoneContactId: string; parentPhoneContactId: string }> {
  let studentPhoneContactId: string | undefined;
  try {
    studentPhoneContactId = await Contacts.addContactAsync({
      contactType: Contacts.ContactTypes.Person,
      name: studentDisplayName,
      firstName: studentDisplayName,
      middleName: '',
      lastName: '',
      namePrefix: '',
      nameSuffix: '',
      phoneNumbers: [{ label: 'mobile', number: row.studentNumber }],
      note,
    });
    const parentDisplayName = `${row.parentName} (${studentDisplayName})`;
    const parentPhoneContactId = await Contacts.addContactAsync({
      contactType: Contacts.ContactTypes.Person,
      name: parentDisplayName,
      firstName: parentDisplayName,
      middleName: '',
      lastName: '',
      namePrefix: '',
      nameSuffix: '',
      phoneNumbers: [{ label: 'mobile', number: row.parentNumber }],
      note,
    });
    return { studentPhoneContactId, parentPhoneContactId };
  } catch (error) {
    await safelyRemovePhoneContact(studentPhoneContactId);
    throw error;
  }
}

export const ContactImportService = {
  async import(input: ContactImportInput, onProgress: ProgressCallback): Promise<ContactImportResult> {
    const permission = await ContactPermissionService.check();
    if (permission.status !== 'granted') throw new Error('Contacts permission is required. Enable it in Settings and try again.');

    onProgress({ completed: 0, total: input.rows.length, label: 'Checking existing phone contacts…' });
    const [existingNumbers, namingPreference, userDeviceId] = await Promise.all([
      getExistingPhoneNumbers(),
      NamingPreferenceStorage.load(),
      DeviceStorage.getOrCreateId(),
    ]);
    const batchId = String(uuid.v4());
    await ContactApiService.createBatch({ batchId, batchName: input.batchName.trim(), academicYear: input.academicYear.trim(), userDeviceId });

    let importedStudents = 0;
    let duplicatesSkipped = 0;
    let failedRows = 0;

    for (const [index, row] of input.rows.entries()) {
      onProgress({ completed: index, total: input.rows.length, label: `Importing ${row.studentName}` });
      const studentKey = phoneKey(row.studentNumber);
      const parentKey = phoneKey(row.parentNumber);
      if (existingNumbers.has(studentKey) || existingNumbers.has(parentKey)) {
        duplicatesSkipped += 1;
        continue;
      }

      const contactUuid = String(uuid.v4());
      const note = buildNote(batchId, input.academicYear.trim(), contactUuid);
      const studentDisplayName = formatContactName(row, namingPreference);
      let phoneIds: { studentPhoneContactId: string; parentPhoneContactId: string } | undefined;
      let localSaved = false;
      let remoteAttempted = false;
      try {
        phoneIds = await createPhonePair(row, studentDisplayName, note);
        remoteAttempted = true;
        const createdContact = await ContactApiService.createContact({
          contactUuid,
          studentName: row.studentName,
          parentName: row.parentName,
          studentNumber: row.studentNumber,
          parentNumber: row.parentNumber,
          rollNumber: row.rollNumber,
          batchId,
          phoneContactId: phoneIds.studentPhoneContactId,
          ...phoneIds,
        });
        const mapping: PhoneContactMapping = { contactUuid, batchId, ...phoneIds, savedAt: new Date().toISOString() };
        await PhoneContactStorage.save(mapping);
        await ContactSearchStorage.save({
          ...createdContact,
          batchName: input.batchName.trim(),
          academicYear: input.academicYear.trim(),
        });
        localSaved = true;
        existingNumbers.add(studentKey);
        existingNumbers.add(parentKey);
        importedStudents += 1;
      } catch (error) {
        if (localSaved) {
          await PhoneContactStorage.remove(contactUuid);
          await ContactSearchStorage.remove(contactUuid);
        }
        if (remoteAttempted) {
          try { await ContactApiService.deleteContact(contactUuid); } catch { /* The metadata may not have been created. */ }
        }
        await safelyRemovePhoneContact(phoneIds?.studentPhoneContactId);
        await safelyRemovePhoneContact(phoneIds?.parentPhoneContactId);
        if (isAxiosError(error) && error.response?.status === 409) duplicatesSkipped += 1;
        else failedRows += 1;
      }
    }

    if (importedStudents === 0) await ContactApiService.deleteBatch(batchId);
    onProgress({ completed: input.rows.length, total: input.rows.length, label: 'Import complete' });
    return {
      batchId,
      batchName: input.batchName.trim(),
      academicYear: input.academicYear.trim(),
      importedStudents,
      phoneContactsCreated: importedStudents * 2,
      duplicatesSkipped,
      failedRows,
    };
  },
};
