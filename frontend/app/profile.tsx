import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Dialog, Divider, List, Portal, Text, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/hooks/useAuth';
import { softShadow } from '@/constants/ui';
import { getErrorMessage } from '@/utils/errors';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const runLogout = async () => {
    setWorking(true);
    setError('');
    try { await logout(); }
    catch (logoutError) { setError(getErrorMessage(logoutError)); setWorking(false); setConfirming(false); }
  };
  return <>
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <Avatar.Text size={86} label={user?.name.trim().charAt(0).toUpperCase() || '?'} style={{ backgroundColor: theme.colors.primary }} />
        <Text variant="headlineSmall" style={styles.name}>{user?.name}</Text>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>{user?.phoneNumber}</Text>
      </View>
      <Card mode="contained" style={[styles.card, softShadow]}>
        <List.Item title="Name" description={user?.name} left={(props) => <List.Icon {...props} icon="account-outline" />} />
        <Divider />
        <List.Item title="Phone number" description={user?.phoneNumber} left={(props) => <List.Icon {...props} icon="phone-outline" />} />
        {user?.createdAt ? <View><Divider /><List.Item title="Member since" description={new Date(user.createdAt).toLocaleDateString()} left={(props) => <List.Icon {...props} icon="calendar-outline" />} /></View> : null}
      </Card>
      {error ? <Text style={{ color: theme.colors.error, textAlign: 'center' }}>{error}</Text> : null}
      <Button mode="contained" buttonColor={theme.colors.error} icon="logout" contentStyle={styles.logout} onPress={() => setConfirming(true)}>Log out</Button>
    </Screen>
    <Portal><Dialog visible={confirming} onDismiss={() => !working && setConfirming(false)}>
      <Dialog.Icon icon="logout" />
      <Dialog.Title style={styles.center}>Log out?</Dialog.Title>
      <Dialog.Content><Text>Your on-device account session and cached cloud data will be removed. Your contacts and database records remain saved to your account.</Text></Dialog.Content>
      <Dialog.Actions><Button disabled={working} onPress={() => setConfirming(false)}>Cancel</Button><Button mode="contained" loading={working} disabled={working} onPress={() => void runLogout()}>Log out</Button></Dialog.Actions>
    </Dialog></Portal>
  </>;
}

const styles = StyleSheet.create({
  screen: { gap: 22 },
  hero: { alignItems: 'center', paddingVertical: 18, gap: 7 },
  name: { fontWeight: '800', marginTop: 6 },
  card: { borderRadius: 26, overflow: 'hidden' },
  logout: { minHeight: 50 },
  center: { textAlign: 'center' },
});
