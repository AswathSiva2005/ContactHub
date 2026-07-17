import { StyleSheet } from 'react-native';
import { Banner, Text } from 'react-native-paper';
import { api } from '@/services/api';
import { SyncService } from '@/services/SyncService';
import { useSyncStatus } from '@/hooks/useSyncStatus';

export function SyncBanner() {
  const { pending, syncing } = useSyncStatus();
  return <Banner visible={pending > 0} icon={syncing ? 'cloud-sync-outline' : 'cloud-off-outline'} actions={[{ label: syncing ? 'Syncing…' : 'Retry', disabled: syncing, onPress: () => void SyncService.flush(api.defaults.baseURL ?? '') }]} style={styles.banner}>
    <Text>{pending} change{pending === 1 ? '' : 's'} waiting to sync. Your data is safe on this device.</Text>
  </Banner>;
}

const styles = StyleSheet.create({ banner: { elevation: 2 } });
