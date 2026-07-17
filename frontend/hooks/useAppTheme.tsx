import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { darkTheme, lightTheme } from '@/constants/theme';
import { STORAGE_KEYS } from '@/storage/keys';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemePreference {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemePreferenceContext = createContext<ThemePreference>({
  mode: 'system',
  setMode: () => undefined,
});

export function AppThemeProvider({ children }: { children: (theme: MD3Theme) => ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.themeMode).then((stored) => {
      if (stored === 'system' || stored === 'light' || stored === 'dark') setModeState(stored);
    }).catch(() => undefined);
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    void AsyncStorage.setItem(STORAGE_KEYS.themeMode, nextMode);
  };
  const theme = mode === 'dark' || (mode === 'system' && systemScheme === 'dark') ? darkTheme : lightTheme;
  const preference = useMemo(() => ({ mode, setMode }), [mode]);

  return (
    <ThemePreferenceContext.Provider value={preference}>
      {children(theme)}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreference {
  return useContext(ThemePreferenceContext);
}
