import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppThemeProvider } from '@/hooks/useAppTheme';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { SyncBanner } from '@/components/SyncBanner';
import { AuthProvider } from '@/hooks/useAuth';
import { AuthGate } from '@/components/AuthGate';
import { ProfileButton } from '@/components/ProfileButton';
import { AppUpdateDialog } from '@/components/AppUpdateDialog';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => { void SplashScreen.hideAsync(); }, []);
  return (
    <AppErrorBoundary><SafeAreaProvider>
      <AppThemeProvider>
        {(theme) => (
          <PaperProvider theme={theme}>
            <AuthProvider><AuthGate>
            <StatusBar style={theme.dark ? 'light' : 'dark'} />
            <SyncBanner />
            <AppUpdateDialog />
            <Stack screenOptions={{ headerStyle: { backgroundColor: theme.colors.background }, headerTintColor: theme.colors.onSurface, headerTitleAlign: 'center', headerTitleStyle: { fontWeight: '700' }, headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false, headerRight: () => <ProfileButton />, contentStyle: { backgroundColor: theme.colors.background }, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="register" options={{ headerShown: false }} />
              <Stack.Screen name="profile" options={{ title: 'Profile', headerRight: () => null }} />
              <Stack.Screen name="import" options={{ title: 'Import Excel' }} />
              <Stack.Screen name="batches/index" options={{ title: 'Saved Batches' }} />
              <Stack.Screen name="batches/[batchId]" options={{ title: 'Batch Contacts' }} />
              <Stack.Screen name="search" options={{ title: 'Search Contacts' }} />
              <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            </Stack>
            </AuthGate></AuthProvider>
          </PaperProvider>
        )}
      </AppThemeProvider>
    </SafeAreaProvider></AppErrorBoundary>
  );
}
