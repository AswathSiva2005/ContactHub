import type { ImportedContactRow } from '@/types/excel';

export interface ContactImportInput {
  batchName: string;
  academicYear: string;
  rows: ImportedContactRow[];
}

export interface ContactImportProgress {
  completed: number;
  total: number;
  label: string;
}

export interface ContactImportResult {
  batchId: string;
  batchName: string;
  academicYear: string;
  importedStudents: number;
  phoneContactsCreated: number;
  duplicatesSkipped: number;
  failedRows: number;
}

export interface PhoneContactMapping {
  contactUuid: string;
  batchId: string;
  studentPhoneContactId: string;
  parentPhoneContactId: string;
  savedAt: string;
}
