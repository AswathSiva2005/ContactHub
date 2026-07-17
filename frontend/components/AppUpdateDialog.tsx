import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, ProgressBar, Text } from 'react-native-paper';
import { VersionService, type UpdateState } from '@/services/VersionService';
import { getErrorMessage } from '@/utils/errors';

export function AppUpdateDialog() {
  const [update, setUpdate] = useState<UpdateState | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    VersionService.check().then(setUpdate).catch(() => undefined);
  }, []);

  const install = async () => {
    if (!update) return;
    setDownloading(true);
    setError('');
    try {
      await VersionService.downloadAndInstall(update, setProgress);
    } catch (reason) {
      setError(getErrorMessage(reason));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={Boolean(update)} dismissable={!update?.required && !downloading} onDismiss={() => setUpdate(null)}>
        <Dialog.Icon icon="update" />
        <Dialog.Title style={styles.center}>{update?.required ? 'Update required' : 'New version available'}</Dialog.Title>
        <Dialog.Content>
          <View style={styles.versions}>
            <Text>Current version</Text><Text variant="labelLarge">{update?.currentVersion}</Text>
            <Text>Latest version</Text><Text variant="labelLarge">{update?.latestVersion}</Text>
          </View>
          <Text variant="titleSmall" style={styles.notesTitle}>What&apos;s new</Text>
          <ScrollView style={styles.notes}><Text>{update?.releaseNotes}</Text></ScrollView>
          {downloading ? <View style={styles.progress}><ProgressBar progress={progress} /><Text variant="bodySmall">Downloading… {Math.round(progress * 100)}%</Text></View> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {update?.required ? <Text variant="bodySmall" style={styles.required}>This version is no longer supported. Install the update to continue securely.</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          {!update?.required && !downloading ? <Button onPress={() => setUpdate(null)}>Later</Button> : null}
          <Button mode="contained" icon="download" loading={downloading} disabled={downloading} onPress={() => void install()}>Update now</Button>
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
  progress: { gap: 7, marginTop: 16 },
  error: { color: '#B3261E', marginTop: 12 },
  required: { marginTop: 12 },
});
