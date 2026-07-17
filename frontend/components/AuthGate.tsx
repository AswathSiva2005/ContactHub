import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useSegments } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import type { ReactNode } from 'react';

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const authScreen = segments[0] === 'login' || segments[0] === 'register';
  useEffect(() => {
    if (!ready) return;
    if (!user && !authScreen) router.replace('/login');
    if (user && authScreen) router.replace('/');
  }, [authScreen, ready, user]);
  if (!ready || (!user && !authScreen) || (user && authScreen)) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" /></View>;
  }
  return children;
}
