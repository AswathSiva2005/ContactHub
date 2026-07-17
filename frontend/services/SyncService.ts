import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { isAxiosError, type Method } from 'axios';
import { AppState } from 'react-native';
import { STORAGE_KEYS } from '@/storage/keys';

export interface SyncOperation {
  id: string;
  method: Method;
  url: string;
  data?: unknown;
  createdAt: string;
  attempts: number;
}

type Listener = (pending: number, syncing: boolean) => void;
const listeners = new Set<Listener>();
let syncing = false;

async function readQueue(): Promise<SyncOperation[]> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.syncQueue);
    return value ? JSON.parse(value) as SyncOperation[] : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: SyncOperation[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.syncQueue, JSON.stringify(queue));
  listeners.forEach((listener) => listener(queue.length, syncing));
}

function retryable(error: unknown): boolean {
  return isAxiosError(error) && (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED');
}

export const SyncService = {
  isRetryable: retryable,

  async enqueue(method: Method, url: string, data?: unknown): Promise<void> {
    const queue = await readQueue();
    queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, method, url, data, createdAt: new Date().toISOString(), attempts: 0 });
    await writeQueue(queue);
  },

  async flush(baseURL: string): Promise<number> {
    if (syncing) return (await readQueue()).length;
    syncing = true;
    let queue = await readQueue();
    listeners.forEach((listener) => listener(queue.length, true));
    while (queue.length) {
      const operation = queue[0];
      if (!operation) break;
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.authToken);
        if (!token) break;
        await axios.request({ baseURL, method: operation.method, url: operation.url, data: operation.data, timeout: 15_000, headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
        queue.shift();
        await writeQueue(queue);
      } catch (error) {
        operation.attempts += 1;
        if (!retryable(error) || operation.attempts >= 8) queue.shift();
        await writeQueue(queue);
        if (retryable(error)) break;
      }
    }
    syncing = false;
    listeners.forEach((listener) => listener(queue.length, false));
    return queue.length;
  },

  async pending(): Promise<number> { return (await readQueue()).length; },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    void this.pending().then((pending) => listener(pending, syncing));
    return () => listeners.delete(listener);
  },

  startAutoSync(baseURL: string): () => void {
    const flush = () => void this.flush(baseURL);
    const interval = setInterval(flush, 30_000);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') flush(); });
    flush();
    return () => { clearInterval(interval); subscription.remove(); };
  },
};
