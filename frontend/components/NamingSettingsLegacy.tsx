import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Button, Card, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { NamingOptionCard } from '@/components/NamingOptionCard';
import { ContactPermissionCard } from '@/components/ContactPermissionCard';
import { Screen } from '@/components/Screen';
import { NamingPreferenceStorage } from '@/storage/NamingPreferenceStorage';
import type { NamingFormat, NamingFormatOption, NamingPreference } from '@/types/naming';
import { DEFAULT_NAMING_PREFERENCE, formatContactName } from '@/utils/contactNaming';
import { getErrorMessage } from '@/utils/errors';

const SAMPLE_CONTACT = { studentName: 'Aarav Sharma', rollNumber: '10A-01' };
const OPTIONS: NamingFormatOption[] = [
  { value: 'studentName', label: 'Student Name', description: 'Aarav Sharma' },
  { value: 'rollNumberName', label: 'Roll Number + Name', description: '10A-01 Aarav Sharma' },
  { value: 'nameStudent', label: 'Name (Student)', description: 'Aarav Sharma (Student)' },
  { value: 'rollNumberDashName', label: 'Roll Number - Name', description: '10A-01 - Aarav Sharma' },
  { value: 'customPrefix', label: 'Custom Prefix', description: 'Add your own text before the student name' },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const [preference, setPreference] = useState<NamingPreference>(DEFAULT_NAMING_PREFERENCE);
  const [savedPreference, setSavedPreference] = useState<NamingPreference>(DEFAULT_NAMING_PREFERENCE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const preview = useMemo(() => formatContactName(SAMPLE_CONTACT, preference), [preference]);
  const hasChanges = preference.format !== savedPreference.format || preference.customPrefix !== savedPreference.customPrefix;

  useEffect(() => {
    NamingPreferenceStorage.load()
      .then((stored) => { setPreference(stored); setSavedPreference(stored); })
      .catch((error: unknown) => setMessage(getErrorMessage(error)))
      .finally(() => setLoading(false));
  }, []);

  const selectFormat = (format: NamingFormat) => setPreference((current) => ({ ...current, format }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await NamingPreferenceStorage.save(preference);
      setPreference(saved);
      setSavedPreference(saved);
      setMessage('Naming preference saved.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Screen contentStyle={styles.loading}><ActivityIndicator size="large" /><Text>Loading preferences…</Text></Screen>;
  }

  return (
    <>
      <Screen>
        <ContactPermissionCard onMessage={setMessage} />
        <View style={styles.heading}>
          <View style={[styles.headingIcon, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={30} color={theme.colors.primary} />
          </View>
          <View style={styles.headingCopy}>
            <Text variant="headlineSmall">Contact naming</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Choose how imported students will appear in your phone contacts.</Text>
          </View>
        </View>

        <Card mode="elevated" style={[styles.previewCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content style={styles.previewContent}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>LIVE PREVIEW</Text>
            <View style={styles.previewRow}>
              <MaterialCommunityIcons name="account-circle" size={44} color={theme.colors.primary} />
              <Text variant="titleLarge" style={[styles.previewText, { color: theme.colors.onPrimaryContainer }]}>{preview || 'Enter a prefix'}</Text>
            </View>
          </Card.Content>
        </Card>

        <View accessibilityRole="radiogroup" style={styles.options}>
          {OPTIONS.map((option) => <NamingOptionCard key={option.value} option={option} selected={preference.format === option.value} onSelect={selectFormat} />)}
        </View>

        {preference.format === 'customPrefix' && (
          <TextInput
            mode="outlined"
            label="Custom prefix"
            placeholder="Example: Class 10A"
            value={preference.customPrefix}
            onChangeText={(customPrefix) => setPreference((current) => ({ ...current, customPrefix }))}
            maxLength={30}
            autoCapitalize="words"
            right={<TextInput.Affix text={`${preference.customPrefix.length}/30`} />}
          />
        )}

        <Button mode="contained" icon="content-save-outline" onPress={() => void save()} loading={saving} disabled={saving || !hasChanges} contentStyle={styles.saveButton}>Save preference</Button>
      </Screen>
      <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={4000}>{message}</Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  loading: { justifyContent: 'center', alignItems: 'center', gap: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  headingIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1, gap: 3 },
  previewCard: { borderRadius: 22, marginBottom: 22 },
  previewContent: { gap: 12 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewText: { flex: 1, fontWeight: '600' },
  options: { gap: 10, marginBottom: 16 },
  saveButton: { minHeight: 50 },
});
