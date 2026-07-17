import { useState } from 'react';
import { FlatList, Linking, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Dialog, IconButton, Portal, Searchbar, Snackbar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatchService } from '@/services/BatchService';
import { ContactSearchService } from '@/services/ContactSearchService';
import { HapticService } from '@/services/HapticService';
import { PhoneContactSyncService } from '@/services/PhoneContactSyncService';
import type { SearchableContact, SearchSource } from '@/types/search';
import { getErrorMessage } from '@/utils/errors';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { softShadow } from '@/constants/ui';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchableContact[]>([]);
  const [source, setSource] = useState<SearchSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<SearchableContact | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const search = async () => {
    if (!query.trim()) { setMessage('Enter a name, roll number, phone number, or parent name.'); return; }
    setLoading(true);
    try {
      const result = await ContactSearchService.search(query);
      setItems(result.items);
      setSource(result.source);
      setSearched(true);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const call = async (number: string) => {
    try { await Linking.openURL(`tel:${number}`); }
    catch { setMessage('Calling is not available on this device.'); }
  };

  const remove = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteContact(selected.contactUuid);
      const phoneResult = await PhoneContactSyncService.remove([deleted]);
      await ContactSearchService.remove(selected.contactUuid);
      setItems((current) => current.filter((item) => item.contactUuid !== selected.contactUuid));
      setDeleteVisible(false);
      setDetailsVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable ? 'Deleted from Atlas.' : `Deleted from Atlas; ${phoneResult.changed} phone contacts removed.`);
    } catch (error) {
      HapticService.error();
      setMessage(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  const openDetails = (contact: SearchableContact) => {
    setSelected(contact);
    setDetailsVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.contactUuid}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, !items.length && styles.grow]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.pageTitle}>Search</Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>Search by name, roll number, phone number, or parent name.</Text>
            <Searchbar
              placeholder="Search contacts"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => void search()}
              loading={loading}
              style={[styles.search, { backgroundColor: theme.colors.surface }]}
            />
            <Button mode="contained" icon="account-search-outline" loading={loading} disabled={loading} onPress={() => void search()}>Search</Button>
            {source && <Text variant="labelMedium" style={{ color: theme.colors.primary }}>Results from {source === 'local' ? 'local storage' : 'MongoDB Atlas'}</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <Card mode="contained" style={[styles.card, softShadow]} onPress={() => openDetails(item)}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.titleRow}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text variant="titleMedium" style={{ color: theme.colors.primary }}>{item.studentName.trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text variant="titleMedium">{item.studentName}</Text>
                  <Text variant="bodySmall">Roll {item.rollNumber} · {item.batchName}</Text>
                </View>
              </View>
              <Text>Parent: {item.parentName}</Text>
              <View style={styles.actions}>
                <Button compact icon="phone-outline" onPress={() => void call(item.studentNumber)}>Student</Button>
                <Button compact icon="phone-outline" onPress={() => void call(item.parentNumber)}>Parent</Button>
                <IconButton icon="delete-outline" iconColor={theme.colors.error} accessibilityLabel={`Delete ${item.studentName}`} onPress={() => { setSelected(item); setDeleteVisible(true); }} />
                <Button compact onPress={() => openDetails(item)}>View Details</Button>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={loading ? (
          <LoadingSkeleton rows={3} />
        ) : searched ? (
          <View style={styles.empty}><MaterialCommunityIcons name="account-off-outline" size={52} color={theme.colors.primary} /><Text variant="titleMedium">No contacts found</Text></View>
        ) : null}
      />
      <Portal>
        <Dialog visible={detailsVisible} onDismiss={() => setDetailsVisible(false)}>
          <Dialog.Title>{selected?.studentName}</Dialog.Title>
          <Dialog.Content style={styles.details}>
            <Text>Roll Number: {selected?.rollNumber}</Text>
            <Text>Student Phone: {selected?.studentNumber}</Text>
            <Text>Parent: {selected?.parentName}</Text>
            <Text>Parent Phone: {selected?.parentNumber}</Text>
            <Text>Batch: {selected?.batchName}</Text>
            {selected?.academicYear ? <Text>Academic Year: {selected.academicYear}</Text> : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDetailsVisible(false)}>Close</Button>
            <Button icon="phone-outline" onPress={() => selected && void call(selected.studentNumber)}>Call Student</Button>
            <Button icon="phone-outline" onPress={() => selected && void call(selected.parentNumber)}>Call Parent</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={deleteVisible} onDismiss={() => !deleting && setDeleteVisible(false)}>
          <Dialog.Icon icon="account-remove-outline" />
          <Dialog.Title>Delete contact?</Dialog.Title>
          <Dialog.Content><Text>This permanently deletes {selected?.studentName} and the linked parent from Atlas and, when available, this Android phone.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button disabled={deleting} onPress={() => setDeleteVisible(false)}>Cancel</Button>
            <Button mode="contained" buttonColor={theme.colors.error} loading={deleting} disabled={deleting} onPress={() => void remove()}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
        <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={5000}>{message}</Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22 },
  grow: { flexGrow: 1 },
  header: { gap: 12, marginBottom: 24 },
  pageTitle: { fontWeight: '800', letterSpacing: -0.6 },
  search: { borderRadius: 28 },
  separator: { height: 10 },
  card: { borderRadius: 24 },
  cardContent: { gap: 11 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#E8EEF6', paddingTop: 7 },
  empty: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12 },
  details: { gap: 10 },
});
