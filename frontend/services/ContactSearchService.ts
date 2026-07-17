import { BatchService } from '@/services/BatchService';
import { ContactSearchStorage } from '@/storage/ContactSearchStorage';
import type { SearchableContact, SearchSource } from '@/types/search';

export interface ContactSearchResult {
  items: SearchableContact[];
  source: SearchSource;
}

export const ContactSearchService = {
  async search(query: string): Promise<ContactSearchResult> {
    const local = await ContactSearchStorage.search(query);
    if (local.length) return { items: local, source: 'local' };

    const [contacts, batches] = await Promise.all([
      BatchService.searchContacts(query),
      BatchService.getBatches('', 'newest'),
    ]);
    const batchById = new Map(batches.map((batch) => [batch.batchId, batch]));
    const items = contacts.map((contact) => {
      const batch = batchById.get(contact.batchId);
      return {
        ...contact,
        batchName: batch?.batchName ?? contact.batchId,
        academicYear: batch?.academicYear ?? '',
      };
    });
    await ContactSearchStorage.saveMany(items);
    return { items, source: 'atlas' };
  },

  remove: ContactSearchStorage.remove,
  removeMany: ContactSearchStorage.removeMany,
  removeBatch: ContactSearchStorage.removeBatch,
  clear: ContactSearchStorage.clear,
};
