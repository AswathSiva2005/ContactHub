import { api } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/storage/keys';
import type { BatchRecord, BatchSort, ContactRecord, PaginatedResponse, PhoneContactIds, RollSort } from '@/types/batch';

const PAGE_SIZE = 200;

export const BatchService = {
  async getBatches(search: string, sort: BatchSort): Promise<BatchRecord[]> {
    try {
      const records: BatchRecord[] = [];
      let page = 1;
      let pages = 1;
      do {
        const response = await api.get<PaginatedResponse<BatchRecord>>('/batches', { params: { search: search.trim() || undefined, sort, page, limit: PAGE_SIZE } });
        records.push(...response.data.data);
        pages = response.data.pagination.pages;
        page += 1;
      } while (page <= pages);
      if (!search.trim() && sort === 'newest') await AsyncStorage.setItem(STORAGE_KEYS.batchesCache, JSON.stringify(records));
      return records;
    } catch (error) {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.batchesCache);
      if (!cached) throw error;
      const records = JSON.parse(cached) as BatchRecord[];
      const query = search.trim().toLocaleLowerCase();
      const filtered = query ? records.filter((record) => record.batchName.toLocaleLowerCase().includes(query)) : records;
      return [...filtered].sort((a, b) => sort === 'alphabetical'
        ? a.batchName.localeCompare(b.batchName)
        : sort === 'oldest' ? new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime() : new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    }
  },

  async getBatch(batchId: string): Promise<BatchRecord> {
    const response = await api.get<{ success: true; data: BatchRecord }>(`/batches/${encodeURIComponent(batchId)}`);
    return response.data.data;
  },

  async renameBatch(batchId: string, batchName: string): Promise<BatchRecord> {
    const response = await api.patch<{ success: true; data: BatchRecord }>(`/batches/${encodeURIComponent(batchId)}`, { batchName });
    return response.data.data;
  },

  async deleteBatch(batchId: string): Promise<{ deletedContacts: number; phoneContacts: PhoneContactIds[] }> {
    const response = await api.delete<{ success: true; data: { deletedContacts: number; phoneContacts: PhoneContactIds[] } }>(`/batches/${encodeURIComponent(batchId)}`);
    return response.data.data;
  },

  async deleteAll(): Promise<{ deletedBatches: number; deletedContacts: number; phoneContacts: PhoneContactIds[] }> {
    const response = await api.delete<{ success: true; data: { deletedBatches: number; deletedContacts: number; phoneContacts: PhoneContactIds[] } }>('/batches');
    return response.data.data;
  },

  async getContacts(batchId: string, search = '', sort: RollSort = 'rollAsc'): Promise<ContactRecord[]> {
    const records: ContactRecord[] = [];
    let page = 1;
    let pages = 1;
    do {
      const response = await api.get<PaginatedResponse<ContactRecord>>('/contacts', {
        params: { batchId, search: search.trim() || undefined, sort, page, limit: PAGE_SIZE },
      });
      records.push(...response.data.data);
      pages = response.data.pagination.pages;
      page += 1;
    } while (page <= pages);
    return records;
  },

  async searchContacts(search: string): Promise<ContactRecord[]> {
    const records: ContactRecord[] = [];
    let page = 1;
    let pages = 1;
    do {
      const response = await api.get<PaginatedResponse<ContactRecord>>('/contacts', {
        params: { search: search.trim(), page, limit: PAGE_SIZE },
      });
      records.push(...response.data.data);
      pages = response.data.pagination.pages;
      page += 1;
    } while (page <= pages);
    return records;
  },

  async updateContact(contactUuid: string, updates: Pick<ContactRecord, 'studentName' | 'parentName' | 'studentNumber' | 'parentNumber' | 'rollNumber'>): Promise<ContactRecord> {
    const response = await api.patch<{ success: true; data: ContactRecord }>(`/contacts/${encodeURIComponent(contactUuid)}`, updates);
    return response.data.data;
  },

  async deleteContact(contactUuid: string): Promise<PhoneContactIds> {
    const response = await api.delete<{ success: true; data: PhoneContactIds }>(`/contacts/${encodeURIComponent(contactUuid)}`);
    return response.data.data;
  },

  async deleteSelected(contactUuids: string[]): Promise<{ deletedContacts: number; phoneContacts: PhoneContactIds[] }> {
    const response = await api.delete<{ success: true; data: { deletedContacts: number; phoneContacts: PhoneContactIds[] } }>('/contacts/selected', {
      data: { contactUuids },
    });
    return response.data.data;
  },
};
