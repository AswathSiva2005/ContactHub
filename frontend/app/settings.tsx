import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { ActivityIndicator, Button, Card, Dialog, Divider, List, Portal, RadioButton, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { useThemePreference, type ThemeMode } from '@/hooks/useAppTheme';
import { BatchService } from '@/services/BatchService';
import { ContactPermissionService } from '@/services/ContactPermissionService';
import { PhoneContactSyncService } from '@/services/PhoneContactSyncService';
import { SettingsService } from '@/services/SettingsService';
import { ContactSearchStorage } from '@/storage/ContactSearchStorage';
import { PhoneContactStorage } from '@/storage/PhoneContactStorage';
import type { ContactPermissionStatus } from '@/types/permissions';
import { getErrorMessage } from '@/utils/errors';
import { softShadow } from '@/constants/ui';
import { STORAGE_KEYS } from '@/storage/keys';
import { useAuth } from '@/hooks/useAuth';

const EMPTY = { backendOnline: false, mongoConnected: false, totalContacts: 0, totalBatches: 0, storageBytes: 0 };
type Status = typeof EMPTY;
const bytesLabel = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

function StatusRow({ icon, label, value, good }: { icon: string; label: string; value: string; good?: boolean }) {
  const theme = useTheme();
  return <View style={styles.statusRow}><MaterialCommunityIcons name={icon as never} size={23} color={good === undefined ? theme.colors.primary : good ? '#2E7D32' : theme.colors.error} /><Text style={styles.flex}>{label}</Text><Text variant="labelLarge">{value}</Text></View>;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const focused = useIsFocused();
  const { mode, setMode } = useThemePreference();
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>(EMPTY);
  const [permission, setPermission] = useState<ContactPermissionStatus>('undetermined');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<'restore' | 'delete' | 'privacy' | 'about' | ''>('');
  const [deletePhone, setDeletePhone] = useState('');
  const [deletePhoneError, setDeletePhoneError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [state, permissionState] = await Promise.all([SettingsService.getStatus(), ContactPermissionService.check()]);
      setStatus(state);
      setPermission(permissionState.status);
    } catch (error) { setMessage(getErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (focused) void refresh(); }, [focused, refresh]);

  const run = async (key: string, action: () => Promise<string>) => {
    setWorking(key);
    try { setMessage(await action()); await refresh(); }
    catch (error) { setMessage(getErrorMessage(error)); }
    finally { setWorking(''); }
  };
  const deleteEverything = () => {
    const entered = deletePhone.replace(/\D/g, '');
    const registered = user?.phoneNumber.replace(/\D/g, '') ?? '';
    if (!entered || entered !== registered) {
      setDeletePhoneError('Phone number does not match the logged-in account.');
      return;
    }
    setDialog('');
    setDeletePhone('');
    setDeletePhoneError('');
    void run('delete', async () => {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteAll();
      const phone = await PhoneContactSyncService.remove(deleted.phoneContacts);
      await Promise.all([ContactSearchStorage.clear(), PhoneContactStorage.clear()]);
      const accountKeys: string[] = [STORAGE_KEYS.authToken, STORAGE_KEYS.authUser];
      const appKeys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith('@contactsync/') && !accountKeys.includes(key));
      if (appKeys.length) await AsyncStorage.multiRemove(appKeys);
      setMode(mode);
      return `${deleted.deletedContacts} contacts and ${deleted.deletedBatches} batches deleted${phone.unavailable ? '.' : `; ${phone.changed} device contacts removed.`}`;
    });
  };

  return <>
    <Screen>
      <View style={styles.title}><View style={[styles.titleIcon, { backgroundColor: theme.colors.primaryContainer }]}><MaterialCommunityIcons name="cog-outline" size={28} color={theme.colors.primary} /></View><View><Text variant="headlineMedium" style={styles.pageTitle}>Settings</Text><Text style={{ color: theme.colors.onSurfaceVariant }}>Manage ContactSync and your data</Text></View></View>
      <Text variant="titleMedium" style={styles.heading}>Display</Text>
      <Card style={styles.card}><RadioButton.Group value={mode} onValueChange={(value) => setMode(value as ThemeMode)}><View style={styles.display}>{(['system', 'light', 'dark'] as ThemeMode[]).map((value) => <RadioButton.Item key={value} label={value.charAt(0).toUpperCase() + value.slice(1)} value={value} position="leading" style={styles.radio} />)}</View></RadioButton.Group></Card>

      <Text variant="titleMedium" style={styles.heading}>Status</Text>
      <Card style={styles.card}><Card.Content>
        {loading ? <View style={styles.loading}><ActivityIndicator /><Text>Checking services…</Text></View> : <>
          <StatusRow icon="server-network" label="Backend Status" value={status.backendOnline ? 'Online' : 'Offline'} good={status.backendOnline} /><Divider />
          <StatusRow icon="database" label="MongoDB Connection" value={status.mongoConnected ? 'Connected' : 'Disconnected'} good={status.mongoConnected} /><Divider />
          <StatusRow icon="shield-account-outline" label="Permission Status" value={permission.charAt(0).toUpperCase() + permission.slice(1)} good={permission === 'granted'} /><Divider />
          <StatusRow icon="account-multiple-outline" label="Total Imported Contacts" value={String(status.totalContacts)} /><Divider />
          <StatusRow icon="folder-multiple-outline" label="Total Batches" value={String(status.totalBatches)} /><Divider />
          <StatusRow icon="database-outline" label="Storage Used" value={bytesLabel(status.storageBytes)} />
        </>}
      </Card.Content></Card>

      <Text variant="titleMedium" style={styles.heading}>Tools</Text>
      <Card style={styles.card}>
        <List.Item title="Open Device Settings" description="Manage contact permissions" left={(p) => <List.Icon {...p} icon="open-in-new" />} onPress={() => void ContactPermissionService.openSettings()} /><Divider />
        <List.Item title="Sync Database" description="Refresh the offline contact index" left={(p) => <List.Icon {...p} icon="database-sync-outline" />} onPress={() => void run('sync', async () => `Database synchronized. ${await SettingsService.syncDatabase()} contacts are available locally.`)} disabled={Boolean(working)} right={() => working === 'sync' ? <ActivityIndicator /> : null} /><Divider />
        <List.Item title="Backup" description="Create an on-device snapshot" left={(p) => <List.Icon {...p} icon="cloud-upload-outline" />} onPress={() => void run('backup', async () => { await SettingsService.backup(); return 'On-device backup created.'; })} disabled={Boolean(working)} /><Divider />
        <List.Item title="Restore" description="Restore the latest backup" left={(p) => <List.Icon {...p} icon="backup-restore" />} onPress={() => setDialog('restore')} disabled={Boolean(working)} /><Divider />
        <List.Item title="Clear Cache" description="Remove the offline search index" left={(p) => <List.Icon {...p} icon="broom" />} onPress={() => void run('cache', async () => { await SettingsService.clearCache(); return 'Search cache cleared.'; })} disabled={Boolean(working)} />
      </Card>
      <Button mode="contained" buttonColor={theme.colors.error} icon="delete-forever-outline" loading={working === 'delete'} disabled={Boolean(working)} onPress={() => { setDeletePhone(''); setDeletePhoneError(''); setDialog('delete'); }} style={styles.delete}>Delete Everything</Button>

      <Text variant="titleMedium" style={styles.heading}>About</Text>
      <Card style={styles.card}>
        <List.Item title="Privacy" left={(p) => <List.Icon {...p} icon="shield-lock-outline" />} onPress={() => setDialog('privacy')} /><Divider />
        <List.Item title="Rate App" left={(p) => <List.Icon {...p} icon="star-outline" />} onPress={() => void Linking.openURL('market://details?id=com.contactsync.app').catch(() => setMessage('The app store is not available on this device.'))} /><Divider />
        <List.Item title="About ContactSync" description="Version 1.0.0" left={(p) => <List.Icon {...p} icon="information-outline" />} onPress={() => setDialog('about')} />
      </Card>
    </Screen>
    <Portal>
      <Dialog visible={dialog === 'restore'} onDismiss={() => setDialog('')}><Dialog.Title>Restore backup?</Dialog.Title><Dialog.Content><Text>This replaces local preferences and cached data. MongoDB and phone contacts are not changed.</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setDialog('')}>Cancel</Button><Button onPress={() => { setDialog(''); void run('restore', async () => { await SettingsService.restore(); return 'Backup restored.'; }); }}>Restore</Button></Dialog.Actions></Dialog>
      <Dialog visible={dialog === 'delete'} onDismiss={() => { setDialog(''); setDeletePhoneError(''); }}>
        <Dialog.Title>Delete everything?</Dialog.Title>
        <Dialog.Content style={styles.dialogContent}>
          <Text>This permanently removes imported phone contacts, MongoDB records, batches, preferences, cache, and backups. This cannot be undone.</Text>
          <Text variant="labelLarge">Enter your logged-in phone number to confirm.</Text>
          <TextInput
            mode="outlined"
            label="Phone number"
            value={deletePhone}
            onChangeText={(value) => { setDeletePhone(value); if (deletePhoneError) setDeletePhoneError(''); }}
            keyboardType="phone-pad"
            autoComplete="tel"
            error={Boolean(deletePhoneError)}
          />
          {deletePhoneError ? <Text variant="bodySmall" style={{ color: theme.colors.error }}>{deletePhoneError}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions><Button onPress={() => setDialog('')}>Cancel</Button><Button textColor={theme.colors.error} disabled={!deletePhone.trim()} onPress={deleteEverything}>Delete Everything</Button></Dialog.Actions>
      </Dialog>
      <Dialog visible={dialog === 'privacy'} onDismiss={() => setDialog('')}><Dialog.Title>Privacy</Dialog.Title><Dialog.Content><Text>Contact permission is used only to create and manage contacts you import. Spreadsheet data is sent to your configured MongoDB backend and cached locally for search. ContactSync does not sell personal data.</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setDialog('')}>Close</Button></Dialog.Actions></Dialog>
      <Dialog visible={dialog === 'about'} onDismiss={() => setDialog('')}><Dialog.Title>ContactSync</Dialog.Title><Dialog.Content><Text>Version 1.0.0{'\n\n'}Import, organize, search, and synchronize class contacts from Excel.</Text></Dialog.Content><Dialog.Actions><Button onPress={() => setDialog('')}>Close</Button></Dialog.Actions></Dialog>
      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={5000}>{message}</Snackbar>
    </Portal>
  </>;
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  titleIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontWeight: '800', letterSpacing: -0.6 },
  heading: { marginTop: 24, marginBottom: 10, fontWeight: '700' },
  card: { borderRadius: 26, overflow: 'hidden', ...softShadow },
  display: { flexDirection: 'row' },
  radio: { flex: 1, paddingHorizontal: 0 },
  statusRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  loading: { minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 10 },
  delete: { marginTop: 20, borderRadius: 16 },
  dialogContent: { gap: 14 },
});
