import { MD3DarkTheme, MD3LightTheme, configureFonts, type MD3Theme } from 'react-native-paper';
import { UI } from '@/constants/ui';

const fonts = configureFonts({ config: { fontFamily: 'System', letterSpacing: 0.15 } });

export const lightTheme = {
  ...MD3LightTheme,
  roundness: 5,
  fonts,
  colors: {
    ...MD3LightTheme.colors,
    primary: UI.blue,
    primaryContainer: '#E2EEFF',
    secondary: UI.cyan,
    secondaryContainer: '#DDF8FC',
    background: '#F5F8FD',
    surface: '#FFFFFF',
    surfaceVariant: '#EDF3FA',
    outline: '#D3DFEE',
    onBackground: UI.ink,
    onSurface: UI.ink,
    onSurfaceVariant: '#667A96',
    error: UI.red,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#FFFFFF',
      level2: '#FFFFFF',
      level3: '#FFFFFF',
      level4: '#FFFFFF',
      level5: '#FFFFFF',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  roundness: 6,
  fonts,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#82A9FF',
    primaryContainer: '#16386E',
    secondary: '#50D5E8',
    secondaryContainer: '#153E46',
    background: '#09111F',
    surface: '#121D2D',
    surfaceVariant: '#1B2A3E',
    outline: '#33465F',
    onBackground: '#F4F7FC',
    onSurface: '#F4F7FC',
    onSurfaceVariant: '#A9B8CD',
    error: '#FF8D94',
  },
};

export type AppTheme = MD3Theme;
