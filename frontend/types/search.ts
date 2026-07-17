import type { ContactRecord } from '@/types/batch';

export interface SearchableContact extends ContactRecord {
  batchName: string;
  academicYear: string;
}

export type SearchSource = 'local' | 'atlas';
