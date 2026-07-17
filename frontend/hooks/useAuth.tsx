import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AuthService } from '@/services/AuthService';
import type { AuthUser } from '@/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (name: string, phoneNumber: string) => Promise<void>;
  register: (name: string, phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AuthService.restore().then((session) => setUser(session?.user ?? null)).finally(() => setReady(true));
  }, []);
  const login = useCallback(async (name: string, phoneNumber: string) => setUser((await AuthService.login(name, phoneNumber)).user), []);
  const register = useCallback(async (name: string, phoneNumber: string) => setUser((await AuthService.register(name, phoneNumber)).user), []);
  const logout = useCallback(async () => { await AuthService.logout(); setUser(null); }, []);
  const value = useMemo(() => ({ user, ready, login, register, logout }), [user, ready, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
