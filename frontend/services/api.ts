import axios from 'axios';
import { SyncService } from '@/services/SyncService';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:4000/api/v1',
  timeout: 15_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

export const stopAutoSync = SyncService.startAutoSync(api.defaults.baseURL ?? '');
