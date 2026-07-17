import { router } from 'expo-router';
import { IconButton, useTheme } from 'react-native-paper';

export function ProfileButton() {
  const theme = useTheme();
  return <IconButton icon="account-circle-outline" iconColor={theme.colors.primary} size={25} accessibilityLabel="Open profile" onPress={() => router.push('/profile')} />;
}
