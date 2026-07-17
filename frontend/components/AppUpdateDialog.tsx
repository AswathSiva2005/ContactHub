import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { VersionService, type UpdateState } from '@/services/VersionService';
import { getErrorMessage } from '@/utils/errors';

export function AppUpdateDialog() {
  const [update, setUpdate] = useState<UpdateState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    VersionService.check().then(setUpdate).catch(() => undefined);
  }, []);

  const install = async () => {
    if (!update) return;
    setError('');
    try {
      await VersionService.openDownload(update);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
    }
  };

  return (
    <Portal>
      <Dialog visible={Boolean(update)} dismissable={!update?.required} onDismiss={() => setUpdate(null)}>
        <Dialog.Icon icon="update" />
        <Dialog.Title style={styles.center}>{update?.required ? 'Update required' : 'New version available'}</Dialog.Title>
        <Dialog.Content>
          <View style={styles.versions}>
            <Text>Current version</Text><Text variant="labelLarge">{update?.currentVersion}</Text>
            <Text>Latest version</Text><Text variant="labelLarge">{update?.latestVersion}</Text>
          </View>
          <Text variant="titleSmall" style={styles.notesTitle}>What&apos;s new</Text>
          <ScrollView style={styles.notes}><Text>{update?.releaseNotes}</Text></ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {update?.required ? <Text variant="bodySmall" style={styles.required}>This version is no longer supported. Install the update to continue securely.</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          {!update?.required ? <Button onPress={() => setUpdate(null)}>Later</Button> : null}
          <Button mode="contained" icon="download" onPress={() => void install()}>Update</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  versions: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 6, justifyContent: 'space-between' },
  notesTitle: { marginTop: 18, marginBottom: 6 },
  notes: { maxHeight: 120 },
  error: { color: '#B3261E', marginTop: 12 },
  required: { marginTop: 12 },
});
