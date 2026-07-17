import axios from 'axios';
import { SyncService } from '@/services/SyncService';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
if (!configuredUrl && !__DEV__) throw new Error('EXPO_PUBLIC_API_URL is required for production builds');
if (!__DEV__ && configuredUrl && !configuredUrl.startsWith('https://')) throw new Error('Production API URL must use HTTPS');

export const api = axios.create({
  baseURL: configuredUrl ?? 'http://10.0.2.2:4000/api/v1',
  timeout: 15_000,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

export const stopAutoSync = SyncService.startAutoSync(api.defaults.baseURL ?? '');
