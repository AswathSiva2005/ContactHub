import { Platform, type ViewStyle } from 'react-native';

export const UI = {
  pagePadding: 22,
  radiusSmall: 14,
  radiusMedium: 20,
  radiusLarge: 28,
  blue: '#316CFA',
  cyan: '#05B9D7',
  green: '#39C765',
  amber: '#FFAA16',
  red: '#FF5B65',
  ink: '#102038',
} as const;

export const softShadow: ViewStyle = Platform.select({
  ios: { shadowColor: '#34578C', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  android: { elevation: 3 },
  default: { boxShadow: '0 8px 24px rgba(35, 72, 125, 0.10)' },
});
