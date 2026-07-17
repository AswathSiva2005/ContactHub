import { api } from '@/services/api';
import type { ImportedContactRow } from '@/types/excel';
import type { ContactRecord } from '@/types/batch';
import { SyncService } from '@/services/SyncService';

interface CreateBatchInput {
  batchId: string;
  batchName: string;
  academicYear: string;
  userDeviceId: string;
}

interface CreateContactInput extends Omit<ImportedContactRow, 'rowNumber'> {
  contactUuid: string;
  batchId: string;
  phoneContactId: string;
  studentPhoneContactId: string;
  parentPhoneContactId: string;
}

export const ContactApiService = {
  async createBatch(input: CreateBatchInput): Promise<void> {
    try { await api.post('/batches', input); }
    catch (error) {
      if (!SyncService.isRetryable(error)) throw error;
      await SyncService.enqueue('post', '/batches', input);
    }
  },

  async deleteBatch(batchId: string): Promise<void> {
    await api.delete(`/batches/${encodeURIComponent(batchId)}`);
  },

  async createContact(input: CreateContactInput): Promise<ContactRecord> {
    try {
      const response = await api.post<{ success: true; data: ContactRecord }>('/contacts', input);
      return response.data.data;
    } catch (error) {
      if (!SyncService.isRetryable(error)) throw error;
      await SyncService.enqueue('post', '/contacts', input);
      return { ...input, createdDate: new Date().toISOString() } as ContactRecord;
    }
  },

  async deleteContact(contactUuid: string): Promise<void> {
    await api.delete(`/contacts/${encodeURIComponent(contactUuid)}`);
  },
};
