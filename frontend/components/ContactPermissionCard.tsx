import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Button, Card, Chip, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import { ContactPermissionService } from '@/services/ContactPermissionService';
import type { StoredContactPermission } from '@/types/permissions';
import { getErrorMessage } from '@/utils/errors';

interface Props { onMessage: (message: string) => void }

const INITIAL_STATE: StoredContactPermission = { status: 'undetermined', canAskAgain: true, checkedAt: '' };

export function ContactPermissionCard({ onMessage }: Props) {
  const theme = useTheme();
  const [permission, setPermission] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [dialogVisible, setDialogVisible] = useState(false);
  const hasOpenedSettings = useRef(false);

  const refresh = useCallback(async () => {
    try {
      setPermission(await ContactPermissionService.check());
    } catch (error) {
      onMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [onMessage]);

  useEffect(() => {
    ContactPermissionService.loadStored()
      .then(setPermission)
      .catch((error: unknown) => onMessage(getErrorMessage(error)))
      .finally(() => void refresh());
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && hasOpenedSettings.current) {
        hasOpenedSettings.current = false;
        void refresh();
      }
    });
    return () => subscription.remove();
  }, [onMessage, refresh]);

  const requestPermission = async () => {
    setLoading(true);
    try {
      const next = await ContactPermissionService.request();
      setPermission(next);
      if (next.status === 'granted') onMessage('Contacts permission granted.');
      else setDialogVisible(true);
    } catch (error) {
      onMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const openSettings = async () => {
    try {
      hasOpenedSettings.current = true;
      setDialogVisible(false);
      await ContactPermissionService.openSettings();
    } catch (error) {
      hasOpenedSettings.current = false;
      onMessage(getErrorMessage(error));
    }
  };

  const granted = permission.status === 'granted';
  const denied = permission.status === 'denied';
  const color = granted ? '#2E7D32' : denied ? theme.colors.error : '#ED6C02';
  const label = granted ? 'Granted' : denied ? 'Denied' : 'Not requested';

  return (
    <>
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.icon, { backgroundColor: `${color}18` }]}>
              <MaterialCommunityIcons name={granted ? 'contacts' : 'contacts-outline'} size={28} color={color} />
            </View>
            <View style={styles.copy}>
              <Text variant="titleLarge">Contact access</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Required to create and manage imported phone contacts.</Text>
            </View>
            <Chip compact icon={granted ? 'check-circle' : denied ? 'close-circle' : 'help-circle'} textStyle={{ color }}>{label}</Chip>
          </View>

          {loading ? (
            <View style={styles.loading}><ActivityIndicator /><Text variant="bodyMedium">Checking permission…</Text></View>
          ) : granted ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>ContactSync can access contacts on this device.</Text>
          ) : (
            <View style={styles.actions}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {denied ? 'Permission is currently denied. ContactSync cannot import contacts until access is enabled.' : 'Allow access before importing contacts to your phone.'}
              </Text>
              <Button mode="contained-tonal" icon="shield-key-outline" onPress={() => denied ? setDialogVisible(true) : void requestPermission()}>
                {denied ? 'Review permission' : 'Allow contact access'}
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon icon="contacts-outline" />
          <Dialog.Title style={styles.center}>Contact permission needed</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">ContactSync needs contact access to save imported student and parent details and later remove contacts you choose to delete. It does not upload your existing phone contacts.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Not now</Button>
            <Button icon="open-in-new" onPress={() => void openSettings()}>Open Settings</Button>
            {permission.canAskAgain && <Button mode="contained" onPress={() => { setDialogVisible(false); void requestPermission(); }}>Retry</Button>}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, marginBottom: 24 },
  content: { gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: { gap: 12 },
  center: { textAlign: 'center' },
});
