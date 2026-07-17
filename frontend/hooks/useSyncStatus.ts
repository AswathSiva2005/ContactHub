import { useEffect, useState } from 'react';
import { SyncService } from '@/services/SyncService';

export function useSyncStatus() {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => SyncService.subscribe((count, active) => { setPending(count); setSyncing(active); }), []);
  return { pending, syncing };
}
