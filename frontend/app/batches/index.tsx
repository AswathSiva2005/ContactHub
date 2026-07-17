import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { Button, Dialog, Menu, Portal, Searchbar, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatchCard } from '@/components/BatchCard';
import { BatchService } from '@/services/BatchService';
import { PhoneContactSyncService } from '@/services/PhoneContactSyncService';
import { HapticService } from '@/services/HapticService';
import { ContactSearchService } from '@/services/ContactSearchService';
import { PhoneContactStorage } from '@/storage/PhoneContactStorage';
import type { BatchRecord, BatchSort } from '@/types/batch';
import { getErrorMessage } from '@/utils/errors';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

const SORT_LABELS: Record<BatchSort, string> = { newest: 'Newest', oldest: 'Oldest', alphabetical: 'Alphabetical' };

export default function BatchesScreen() {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<BatchSort>('newest');
  const [sortVisible, setSortVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [mutating, setMutating] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteAllVisible, setDeleteAllVisible] = useState(false);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      setBatches(await BatchService.getBatches(search, sort));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, sort]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [isFocused, load]);

  const refresh = () => { setRefreshing(true); void load(false); };
  const chooseSort = (value: BatchSort) => { setSortVisible(false); setSort(value); };
  const showActions = (batch: BatchRecord) => { setSelectedBatch(batch); setActionVisible(true); };
  const openRename = () => {
    if (!selectedBatch) return;
    setRenameValue(selectedBatch.batchName);
    setActionVisible(false);
    setRenameVisible(true);
  };
  const renameBatch = async () => {
    if (!selectedBatch || !renameValue.trim()) { setMessage('Enter a batch name.'); return; }
    setMutating(true);
    try {
      const updated = await BatchService.renameBatch(selectedBatch.batchId, renameValue.trim());
      setBatches((current) => current.map((batch) => batch.batchId === updated.batchId ? updated : batch));
      setRenameVisible(false);
      HapticService.success();
      setMessage('Batch renamed successfully.');
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };
  const deleteBatch = async () => {
    if (!selectedBatch) return;
    setMutating(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteBatch(selectedBatch.batchId);
      const phoneResult = await PhoneContactSyncService.remove(deleted.phoneContacts);
      await Promise.all([
        ContactSearchService.removeBatch(selectedBatch.batchId),
        PhoneContactStorage.removeBatch(selectedBatch.batchId),
      ]);
      setBatches((current) => current.filter((batch) => batch.batchId !== selectedBatch.batchId));
      setDeleteVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable
        ? `Batch deleted from Atlas. Android contacts cannot be changed from this device.`
        : `Batch deleted. ${phoneResult.changed} phone contacts removed${phoneResult.failed ? `; ${phoneResult.failed} could not be removed` : ''}.`);
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };
  const deleteAll = async () => {
    setMutating(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteAll();
      const phoneResult = await PhoneContactSyncService.remove(deleted.phoneContacts);
      await Promise.all([ContactSearchService.clear(), PhoneContactStorage.clear()]);
      setBatches([]);
      setDeleteAllVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable
        ? `${deleted.deletedContacts} imported contacts deleted from Atlas and local storage.`
        : `${deleted.deletedContacts} imported contacts deleted; ${phoneResult.changed} Android contacts removed.`);
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <FlatList
        data={batches}
        keyExtractor={(item) => item.batchId}
        renderItem={({ item }) => <BatchCard batch={item} onLongPress={showActions} />}
        contentContainerStyle={[styles.content, batches.length === 0 && styles.grow]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text variant="headlineMedium" style={styles.pageTitle}>Saved Batches</Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>All classes stored in ContactSync</Text>
            </View>
            <Searchbar placeholder="Search batches" value={search} onChangeText={setSearch} elevation={1} style={[styles.search, { backgroundColor: theme.colors.surface }]} />
            <View style={styles.sortRow}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{batches.length} batch{batches.length === 1 ? '' : 'es'}</Text>
              <Menu
                visible={sortVisible}
                onDismiss={() => setSortVisible(false)}
                anchor={<Button mode="outlined" compact icon="sort" onPress={() => setSortVisible(true)}>{SORT_LABELS[sort]}</Button>}
              >
                <Menu.Item title="Newest" leadingIcon="sort-calendar-descending" onPress={() => chooseSort('newest')} />
                <Menu.Item title="Oldest" leadingIcon="sort-calendar-ascending" onPress={() => chooseSort('oldest')} />
                <Menu.Item title="Alphabetical" leadingIcon="sort-alphabetical-ascending" onPress={() => chooseSort('alphabetical')} />
              </Menu>
            </View>
            {batches.length > 0 ? <Button mode="outlined" textColor={theme.colors.error} icon="delete-sweep-outline" onPress={() => setDeleteAllVisible(true)}>Delete All Imported Contacts</Button> : null}
          </View>
        }
        ListEmptyComponent={loading ? (
          <LoadingSkeleton rows={4} />
        ) : error ? (
          <View style={styles.empty}><MaterialCommunityIcons name="cloud-alert-outline" size={48} color={theme.colors.error} /><Text variant="titleMedium">Could not load batches</Text><Text style={styles.center}>{error}</Text><Button mode="contained-tonal" onPress={() => void load()}>Retry</Button></View>
        ) : (
          <View style={styles.empty}><MaterialCommunityIcons name="folder-open-outline" size={52} color={theme.colors.primary} /><Text variant="titleMedium">{search ? 'No matching batches' : 'No saved batches yet'}</Text><Text style={styles.center}>{search ? 'Try another batch name.' : 'Your completed imports will appear here.'}</Text></View>
        )}
      />
      <Portal>
        <Dialog visible={actionVisible} onDismiss={() => setActionVisible(false)}>
          <Dialog.Title>{selectedBatch?.batchName}</Dialog.Title>
          <Dialog.Content><Text variant="bodyMedium">Choose an action for this batch.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionVisible(false)}>Cancel</Button>
            <Button icon="pencil-outline" onPress={openRename}>Rename</Button>
            <Button textColor={theme.colors.error} icon="delete-outline" onPress={() => { setActionVisible(false); setDeleteVisible(true); }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={renameVisible} onDismiss={() => !mutating && setRenameVisible(false)}>
          <Dialog.Title>Rename batch</Dialog.Title>
          <Dialog.Content><TextInput mode="outlined" label="Batch name" value={renameValue} onChangeText={setRenameValue} maxLength={150} autoFocus /></Dialog.Content>
          <Dialog.Actions>
            <Button disabled={mutating} onPress={() => setRenameVisible(false)}>Cancel</Button>
            <Button mode="contained" loading={mutating} disabled={mutating || !renameValue.trim()} onPress={() => void renameBatch()}>Save</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={deleteVisible} onDismiss={() => !mutating && setDeleteVisible(false)}>
          <Dialog.Icon icon="delete-alert-outline" />
          <Dialog.Title style={styles.center}>Delete entire batch?</Dialog.Title>
          <Dialog.Content><Text variant="bodyMedium">This permanently deletes {selectedBatch?.totalContacts ?? 0} student records from Atlas. When performed on the source Android phone, their linked phone contacts are also removed.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button disabled={mutating} onPress={() => setDeleteVisible(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={theme.colors.error} loading={mutating} disabled={mutating} onPress={() => void deleteBatch()}>Delete batch</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={deleteAllVisible} onDismiss={() => !mutating && setDeleteAllVisible(false)}>
          <Dialog.Icon icon="delete-forever-outline" />
          <Dialog.Title style={styles.center}>Delete all imported contacts?</Dialog.Title>
          <Dialog.Content><Text>This permanently deletes every imported Android contact, MongoDB batch and contact record, and local AsyncStorage entry. This cannot be undone.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button disabled={mutating} onPress={() => setDeleteAllVisible(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={theme.colors.error} loading={mutating} disabled={mutating} onPress={() => void deleteAll()}>Delete All</Button>
          </Dialog.Actions>
        </Dialog>
        <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={6000}>{message}</Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: 22, paddingVertical: 22 },
  grow: { flexGrow: 1 },
  separator: { height: 13 },
  header: { gap: 16, marginBottom: 20 },
  pageTitle: { fontWeight: '800', letterSpacing: -0.6 },
  search: { borderRadius: 28 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  empty: { flex: 1, minHeight: 320, alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 20 },
  center: { textAlign: 'center' },
});
