export type BatchSort = 'newest' | 'oldest' | 'alphabetical';
export type RollSort = 'rollAsc' | 'rollDesc';

export interface BatchRecord {
  _id: string;
  batchId: string;
  batchName: string;
  academicYear: string;
  createdDate: string;
  totalContacts: number;
  userDeviceId: string;
  userId: string;
}

export interface ContactRecord {
  _id: string;
  contactUuid: string;
  studentName: string;
  parentName: string;
  studentNumber: string;
  parentNumber: string;
  rollNumber: string;
  batchId: string;
  createdDate: string;
  phoneContactId: string | null;
  studentPhoneContactId: string | null;
  parentPhoneContactId: string | null;
  userId: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface PhoneContactIds {
  contactUuid: string;
  studentNumber?: string;
  parentNumber?: string;
  phoneContactId?: string | null;
  studentPhoneContactId?: string | null;
  parentPhoneContactId?: string | null;
}
