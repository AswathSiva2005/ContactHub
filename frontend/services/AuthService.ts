import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { STORAGE_KEYS } from '@/storage/keys';
import type { AuthSession, AuthUser } from '@/types/auth';

function setAuthorization(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export const AuthService = {
  async restore(): Promise<{ user: AuthUser; token: string } | null> {
    const [token, storedUser] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.authToken),
      AsyncStorage.getItem(STORAGE_KEYS.authUser),
    ]);
    if (!token || !storedUser) return null;
    setAuthorization(token);
    try {
      const response = await api.get<{ success: true; data: AuthUser }>('/auth/me');
      await AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(response.data.data));
      return { user: response.data.data, token };
    } catch {
      await this.clear();
      return null;
    }
  },

  async register(name: string, phoneNumber: string): Promise<AuthSession> {
    const response = await api.post<{ success: true; data: AuthSession }>('/auth/register', { name, phoneNumber });
    await this.save(response.data.data);
    return response.data.data;
  },

  async login(name: string, phoneNumber: string): Promise<AuthSession> {
    const response = await api.post<{ success: true; data: AuthSession }>('/auth/login', { name, phoneNumber });
    await this.save(response.data.data);
    return response.data.data;
  },

  async save(session: AuthSession): Promise<void> {
    const previousUser = await AsyncStorage.getItem(STORAGE_KEYS.authUser);
    const previousId = previousUser ? (JSON.parse(previousUser) as AuthUser).id : '';
    if (previousId !== session.user.id) {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.batchesCache),
        AsyncStorage.removeItem(STORAGE_KEYS.searchableContacts),
        AsyncStorage.removeItem(STORAGE_KEYS.syncQueue),
        AsyncStorage.removeItem(STORAGE_KEYS.phoneContactMappings),
      ]);
    }
    setAuthorization(session.token);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.authToken, session.token),
      AsyncStorage.setItem(STORAGE_KEYS.authUser, JSON.stringify(session.user)),
    ]);
  },

  async logout(): Promise<void> {
    try { await api.post('/auth/logout'); } finally { await this.clear(); }
  },

  async clear(): Promise<void> {
    setAuthorization();
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.authToken),
      AsyncStorage.removeItem(STORAGE_KEYS.authUser),
      AsyncStorage.removeItem(STORAGE_KEYS.batchesCache),
      AsyncStorage.removeItem(STORAGE_KEYS.searchableContacts),
      AsyncStorage.removeItem(STORAGE_KEYS.syncQueue),
      AsyncStorage.removeItem(STORAGE_KEYS.phoneContactMappings),
    ]);
  },
};
