import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

async function run(action: () => Promise<void>): Promise<void> {
  if (Platform.OS === 'web') return;
  try { await action(); } catch { /* Haptics may be disabled by Android system settings. */ }
}

export const HapticService = {
  longPress(): void {
    void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  success(): void {
    void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  error(): void {
    void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  },
};
