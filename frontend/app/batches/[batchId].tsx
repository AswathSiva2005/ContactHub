import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Button, Card, Dialog, IconButton, Portal, Searchbar, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatchContactCard } from '@/components/BatchContactCard';
import { BatchService } from '@/services/BatchService';
import { PhoneContactSyncService } from '@/services/PhoneContactSyncService';
import { ContactSearchService } from '@/services/ContactSearchService';
import { HapticService } from '@/services/HapticService';
import type { BatchRecord, ContactRecord, RollSort } from '@/types/batch';
import { formatDisplayDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { softShadow } from '@/constants/ui';

export default function BatchDetailsScreen() {
  const theme = useTheme();
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const [batch, setBatch] = useState<BatchRecord | null>(null);
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [rollSort, setRollSort] = useState<RollSort>('rollAsc');
  const [searching, setSearching] = useState(false);
  const initialLoad = useRef(true);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [actionVisible, setActionVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDeleteVisible, setSelectedDeleteVisible] = useState(false);
  const [form, setForm] = useState({ studentName: '', parentName: '', studentNumber: '', parentNumber: '', rollNumber: '' });

  const load = useCallback(async (showLoader = true) => {
    if (!batchId) return;
    if (showLoader && initialLoad.current) setLoading(true);
    else setSearching(true);
    setError('');
    try {
      const [batchRecord, batchContacts] = await Promise.all([BatchService.getBatch(batchId), BatchService.getContacts(batchId, search, rollSort)]);
      setBatch(batchRecord);
      setContacts(batchContacts);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
      setSearching(false);
      setRefreshing(false);
      initialLoad.current = false;
    }
  }, [batchId, rollSort, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const showActions = (contact: ContactRecord) => { setSelectedContact(contact); setActionVisible(true); };
  const toggleSelected = (contact: ContactRecord) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(contact.contactUuid)) next.delete(contact.contactUuid);
      else next.add(contact.contactUuid);
      return next;
    });
  };
  const openEdit = () => {
    if (!selectedContact) return;
    setForm({
      studentName: selectedContact.studentName,
      parentName: selectedContact.parentName,
      studentNumber: selectedContact.studentNumber,
      parentNumber: selectedContact.parentNumber,
      rollNumber: selectedContact.rollNumber,
    });
    setActionVisible(false);
    setEditVisible(true);
  };
  const updateField = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const saveContact = async () => {
    if (!selectedContact) return;
    if (Object.values(form).some((value) => !value.trim())) { setMessage('Complete every contact field.'); return; }
    if ([form.studentNumber, form.parentNumber].some((value) => { const count = value.replace(/\D/g, '').length; return count < 7 || count > 15; })) {
      setMessage('Phone numbers must contain 7–15 digits.'); return;
    }
    setMutating(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const updated = await BatchService.updateContact(selectedContact.contactUuid, {
        studentName: form.studentName.trim(), parentName: form.parentName.trim(),
        studentNumber: form.studentNumber.trim(), parentNumber: form.parentNumber.trim(), rollNumber: form.rollNumber.trim(),
      });
      const phoneResult = await PhoneContactSyncService.update(updated, selectedContact);
      setContacts((current) => current.map((contact) => contact.contactUuid === updated.contactUuid ? updated : contact));
      setSelectedContact(updated);
      setEditVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable ? 'Contact updated in Atlas. Android contacts cannot be changed from this device.' : `Contact updated${phoneResult.failed ? `; ${phoneResult.failed} phone entry failed to update` : ' on this phone and Atlas'}.`);
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };
  const deleteContact = async () => {
    if (!selectedContact) return;
    setMutating(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteContact(selectedContact.contactUuid);
      const phoneResult = await PhoneContactSyncService.remove([deleted]);
      await ContactSearchService.remove(selectedContact.contactUuid);
      setContacts((current) => current.filter((contact) => contact.contactUuid !== selectedContact.contactUuid));
      setBatch((current) => current ? { ...current, totalContacts: Math.max(0, current.totalContacts - 1) } : current);
      setDeleteVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable ? 'Student deleted from Atlas. Android contacts cannot be changed from this device.' : `Student deleted. ${phoneResult.changed} phone contacts removed${phoneResult.failed ? `; ${phoneResult.failed} failed` : ''}.`);
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };
  const deleteSelected = async () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setMutating(true);
    try {
      await PhoneContactSyncService.assertNativeAccess();
      const deleted = await BatchService.deleteSelected(ids);
      const phoneResult = await PhoneContactSyncService.remove(deleted.phoneContacts);
      await ContactSearchService.removeMany(ids);
      setContacts((current) => current.filter((contact) => !selectedIds.has(contact.contactUuid)));
      setBatch((current) => current ? { ...current, totalContacts: Math.max(0, current.totalContacts - deleted.deletedContacts) } : current);
      setSelectedIds(new Set());
      setSelectedDeleteVisible(false);
      HapticService.success();
      setMessage(phoneResult.unavailable
        ? `${deleted.deletedContacts} contacts deleted from Atlas and local storage.`
        : `${deleted.deletedContacts} contacts deleted; ${phoneResult.changed} Android contacts removed.`);
    } catch (mutationError) {
      HapticService.error();
      setMessage(getErrorMessage(mutationError));
    } finally { setMutating(false); }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <Stack.Screen options={{ title: batch?.batchName ?? 'Batch Contacts' }} />
      {loading ? (
        <View style={styles.loadingContent}><LoadingSkeleton rows={4} /></View>
      ) : error ? (
        <View style={styles.centerContent}><MaterialCommunityIcons name="cloud-alert-outline" size={50} color={theme.colors.error} /><Text variant="titleMedium">Could not load this batch</Text><Text style={styles.centerText}>{error}</Text><Button mode="contained-tonal" onPress={() => void load()}>Retry</Button></View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.contactUuid}
          renderItem={({ item }) => <BatchContactCard contact={item} onLongPress={selectedIds.size ? toggleSelected : showActions} onPress={selectedIds.size ? toggleSelected : undefined} selectionMode={selectedIds.size > 0} selected={selectedIds.has(item.contactUuid)} />}
          contentContainerStyle={[styles.content, contacts.length === 0 && styles.grow]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(false); }} colors={[theme.colors.primary]} />}
          ListHeaderComponent={batch ? (
            <View>
            <Card mode="contained" style={[styles.summaryCard, softShadow]}>
              <Card.Content style={styles.summaryContent}>
                <Text variant="headlineSmall">{batch.batchName}</Text>
                <View style={styles.summaryRow}><MaterialCommunityIcons name="school-outline" size={19} color={theme.colors.primary} /><Text>Academic Year {batch.academicYear}</Text></View>
                <View style={styles.summaryRow}><MaterialCommunityIcons name="account-multiple-outline" size={19} color={theme.colors.primary} /><Text>{batch.totalContacts} contacts</Text></View>
                <View style={styles.summaryRow}><MaterialCommunityIcons name="calendar-outline" size={19} color={theme.colors.primary} /><Text>Created {formatDisplayDate(batch.createdDate)}</Text></View>
              </Card.Content>
            </Card>
            <View style={styles.searchControls}>
              <Searchbar placeholder="Search students" value={search} onChangeText={setSearch} loading={searching} style={[styles.search, { backgroundColor: theme.colors.surface }]} elevation={1} />
              <View style={styles.rollSortRow}>
                <Text variant="labelLarge">Roll No</Text>
                <View style={styles.rollSortButtons}>
                  <IconButton size={18} icon="arrow-up" mode={rollSort === 'rollAsc' ? 'contained' : undefined} accessibilityLabel="Sort roll number ascending" onPress={() => setRollSort('rollAsc')} />
                  <IconButton size={18} icon="arrow-down" mode={rollSort === 'rollDesc' ? 'contained' : undefined} accessibilityLabel="Sort roll number descending" onPress={() => setRollSort('rollDesc')} />
                </View>
              </View>
              <View style={styles.selectionRow}>
                <Button mode="outlined" icon="checkbox-multiple-marked-outline" onPress={() => setSelectedIds(new Set(contacts.map((contact) => contact.contactUuid)))}>
                  Select All
                </Button>
                {selectedIds.size > 0 ? (
                  <>
                    <Button onPress={() => setSelectedIds(new Set())}>Cancel Selection</Button>
                    <Button mode="contained" buttonColor={theme.colors.error} icon="delete-outline" onPress={() => setSelectedDeleteVisible(true)}>
                      Delete Selected ({selectedIds.size})
                    </Button>
                  </>
                ) : null}
              </View>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>{contacts.length} matching student{contacts.length === 1 ? '' : 's'} • Long press a student to edit or delete</Text>
            </View>
            </View>
          ) : null}
          ListEmptyComponent={<View style={styles.centerContent}><MaterialCommunityIcons name="account-off-outline" size={48} color={theme.colors.primary} /><Text variant="titleMedium">No contacts in this batch</Text></View>}
        />
      )}
      <Portal>
        <Dialog visible={actionVisible} onDismiss={() => setActionVisible(false)}>
          <Dialog.Title>{selectedContact?.studentName}</Dialog.Title>
          <Dialog.Content><Text>Choose an action for this student and parent contact pair.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActionVisible(false)}>Cancel</Button>
            <Button icon="pencil-outline" onPress={openEdit}>Edit</Button>
            <Button textColor={theme.colors.error} icon="delete-outline" onPress={() => { setActionVisible(false); setDeleteVisible(true); }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={editVisible} onDismiss={() => !mutating && setEditVisible(false)} style={styles.editDialog}>
          <Dialog.Title>Edit student contact</Dialog.Title>
          <Dialog.ScrollArea>
            <View style={styles.form}>
              <TextInput mode="outlined" label="Student name" value={form.studentName} onChangeText={(value) => updateField('studentName', value)} />
              <TextInput mode="outlined" label="Roll number" value={form.rollNumber} onChangeText={(value) => updateField('rollNumber', value)} />
              <TextInput mode="outlined" label="Student phone" keyboardType="phone-pad" value={form.studentNumber} onChangeText={(value) => updateField('studentNumber', value)} />
              <TextInput mode="outlined" label="Parent name" value={form.parentName} onChangeText={(value) => updateField('parentName', value)} />
              <TextInput mode="outlined" label="Parent phone" keyboardType="phone-pad" value={form.parentNumber} onChangeText={(value) => updateField('parentNumber', value)} />
            </View>
          </Dialog.ScrollArea>
          <Dialog.Actions><Button disabled={mutating} onPress={() => setEditVisible(false)}>Cancel</Button><Button mode="contained" loading={mutating} disabled={mutating} onPress={() => void saveContact()}>Save</Button></Dialog.Actions>
        </Dialog>
        <Dialog visible={deleteVisible} onDismiss={() => !mutating && setDeleteVisible(false)}>
          <Dialog.Icon icon="account-remove-outline" />
          <Dialog.Title style={styles.centerText}>Delete this student?</Dialog.Title>
          <Dialog.Content><Text>This permanently deletes {selectedContact?.studentName} and the linked parent metadata from Atlas. On the source Android phone, both phone contacts are also removed.</Text></Dialog.Content>
          <Dialog.Actions><Button disabled={mutating} onPress={() => setDeleteVisible(false)}>Cancel</Button><Button mode="contained" buttonColor={theme.colors.error} loading={mutating} disabled={mutating} onPress={() => void deleteContact()}>Delete</Button></Dialog.Actions>
        </Dialog>
        <Dialog visible={selectedDeleteVisible} onDismiss={() => !mutating && setSelectedDeleteVisible(false)}>
          <Dialog.Icon icon="delete-alert-outline" />
          <Dialog.Title style={styles.centerText}>Delete selected contacts?</Dialog.Title>
          <Dialog.Content><Text>This permanently deletes {selectedIds.size} student and parent pairs from Android Contacts, MongoDB Atlas, and local storage.</Text></Dialog.Content>
          <Dialog.Actions><Button disabled={mutating} onPress={() => setSelectedDeleteVisible(false)}>Cancel</Button><Button mode="contained" buttonColor={theme.colors.error} loading={mutating} disabled={mutating} onPress={() => void deleteSelected()}>Delete Selected</Button></Dialog.Actions>
        </Dialog>
        <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={6000}>{message}</Snackbar>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22 },
  grow: { flexGrow: 1 },
  separator: { height: 12 },
  summaryCard: { borderRadius: 26, marginBottom: 20 },
  summaryContent: { gap: 9 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchControls: { gap: 12, marginBottom: 18, alignItems: 'flex-start' },
  search: { width: '100%', borderRadius: 28 },
  rollSortRow: { width: '100%', minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rollSortButtons: { flexDirection: 'row', alignItems: 'center' },
  selectionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  editDialog: { maxHeight: '90%' },
  form: { gap: 12, paddingVertical: 14 },
  centerContent: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 11, padding: 24 },
  loadingContent: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center', padding: 22 },
  centerText: { textAlign: 'center' },
});
