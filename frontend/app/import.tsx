import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Button, Card, Dialog, Divider, Portal, ProgressBar, SegmentedButtons, Snackbar, Text, TextInput, useTheme } from 'react-native-paper';
import { ContactPreviewCard } from '@/components/ContactPreviewCard';
import { ImportStatCard } from '@/components/ImportStatCard';
import { ImportSuccess } from '@/components/ImportSuccess';
import { Screen } from '@/components/Screen';
import { ContactImportService } from '@/services/ContactImportService';
import { ExcelService } from '@/services/ExcelService';
import type { ContactImportProgress, ContactImportResult } from '@/types/contactImport';
import type { ExcelImportResult } from '@/types/excel';
import { getErrorMessage } from '@/utils/errors';
import { LinearGradient } from 'expo-linear-gradient';
import { softShadow, UI } from '@/constants/ui';

type PreviewFilter = 'valid' | 'duplicate' | 'invalid';
const PREVIEW_LIMIT = 50;

function currentAcademicYear(): string {
  const now = new Date();
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

export default function ImportScreen() {
  const theme = useTheme();
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PreviewFilter>('valid');
  const [message, setMessage] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ContactImportProgress>({ completed: 0, total: 0, label: '' });
  const [importSummary, setImportSummary] = useState<ContactImportResult | null>(null);

  const previewRows = useMemo(() => {
    if (!result) return [];
    if (filter === 'valid') return result.validRows.slice(0, PREVIEW_LIMIT);
    if (filter === 'duplicate') return result.duplicateRows.slice(0, PREVIEW_LIMIT);
    return result.invalidRows.slice(0, PREVIEW_LIMIT);
  }, [filter, result]);

  const selectFile = async () => {
    setLoading(true);
    try {
      const parsed = await ExcelService.pickAndParse();
      if (parsed) {
        setResult(parsed);
        setBatchName(parsed.fileName.replace(/\.(xlsx|csv)$/i, '').slice(0, 150));
        setFilter('valid');
        setMessage(`${parsed.validRows.length} valid row${parsed.validRows.length === 1 ? '' : 's'} ready to import.`);
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const startImport = async () => {
    if (!result || result.validRows.length === 0) return;
    if (!batchName.trim()) { setMessage('Enter a batch name.'); return; }
    if (!/^\d{4}(?:-\d{2}|-\d{4})$/.test(academicYear.trim())) { setMessage('Use an academic year such as 2026-27.'); return; }
    setImporting(true);
    setProgress({ completed: 0, total: result.validRows.length, label: 'Preparing import…' });
    try {
      const summary = await ContactImportService.import(
        { batchName, academicYear, rows: result.validRows },
        setProgress,
      );
      setImportSummary(summary);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setImportSummary(null);
    setBatchName('');
    setAcademicYear(currentAcademicYear());
    setProgress({ completed: 0, total: 0, label: '' });
  };

  if (importSummary) return <ImportSuccess result={importSummary} onImportAnother={reset} />;

  return (
    <>
      <Screen>
        <View style={[styles.uploadCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }, softShadow]}>
          <LinearGradient colors={[UI.blue, UI.cyan]} style={styles.uploadIcon}>
            <MaterialCommunityIcons name="cloud-upload-outline" size={38} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.step}>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>STEP 1 OF 3</Text>
          </View>
          <Text variant="headlineSmall" style={[styles.center, styles.strong]}>Import class contacts</Text>
          <Text variant="bodyMedium" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>Choose an Excel or CSV file. Rows are validated locally before anything is saved.</Text>
          <Button mode="contained" icon="folder-open-outline" onPress={() => void selectFile()} disabled={loading || importing} contentStyle={styles.button}>
            {result ? 'Choose another file' : 'Choose .xlsx or .csv'}
          </Button>
          <Button mode="text" icon="information-outline" onPress={() => setHelpVisible(true)}>Required columns</Button>
          {loading && <View style={styles.loading}><ActivityIndicator /><Text variant="bodyMedium">Reading and validating file…</Text></View>}
        </View>

        {result && !loading && (
          <View style={styles.results}>
            <View>
              <Text variant="titleLarge" numberOfLines={1}>{result.fileName}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Worksheet: {result.sheetName}</Text>
            </View>
            <View style={styles.stats}>
              <ImportStatCard label="Total rows" value={result.totalRows} icon="format-list-numbered" color={theme.colors.primary} />
              <ImportStatCard label="Valid rows" value={result.validRows.length} icon="check-circle-outline" color="#2E7D32" />
              <ImportStatCard label="Duplicate rows" value={result.duplicateRows.length} icon="content-duplicate" color="#ED6C02" />
              <ImportStatCard label="Invalid rows" value={result.invalidRows.length} icon="alert-circle-outline" color={theme.colors.error} />
            </View>

            <Card mode="elevated" style={styles.importCard}>
              <Card.Content style={styles.importContent}>
                <Text variant="titleLarge">Batch details</Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>These details are included in both phone-contact notes and MongoDB metadata.</Text>
                <TextInput mode="outlined" label="Batch name" value={batchName} onChangeText={setBatchName} maxLength={150} />
                <TextInput mode="outlined" label="Academic year" value={academicYear} onChangeText={setAcademicYear} placeholder="2026-27" maxLength={9} keyboardType="numbers-and-punctuation" />
                <Button mode="contained" icon="account-multiple-plus-outline" onPress={() => void startImport()} disabled={result.validRows.length === 0 || importing} contentStyle={styles.button}>
                  Import {result.validRows.length} student{result.validRows.length === 1 ? '' : 's'}
                </Button>
                <Text variant="bodySmall" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>Two Android contacts are created per valid student row.</Text>
              </Card.Content>
            </Card>

            <Divider />
            <Text variant="titleMedium">Data preview</Text>
            <SegmentedButtons
              value={filter}
              onValueChange={(value) => setFilter(value as PreviewFilter)}
              buttons={[
                { value: 'valid', label: `Valid (${result.validRows.length})` },
                { value: 'duplicate', label: `Duplicate (${result.duplicateRows.length})` },
                { value: 'invalid', label: `Invalid (${result.invalidRows.length})` },
              ]}
              density="small"
            />
            {previewRows.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="check-all" size={36} color={theme.colors.primary} />
                <Text variant="bodyMedium">No {filter} rows found.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {previewRows.map((row) => <ContactPreviewCard key={row.rowNumber} row={row} status={filter} />)}
                {previewRows.length === PREVIEW_LIMIT && <Text variant="bodySmall" style={styles.center}>Showing the first {PREVIEW_LIMIT} rows.</Text>}
              </View>
            )}
          </View>
        )}
      </Screen>

      <Portal>
        <Dialog visible={helpVisible} onDismiss={() => setHelpVisible(false)}>
          <Dialog.Title>Required spreadsheet columns</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Text variant="bodyMedium">Student Name, Parent Name, Student Number, Parent Number, and Roll Number.</Text>
            <Text variant="bodySmall">Common variants such as “Student Phone”, “Guardian Name”, and “Roll No” are recognized automatically.</Text>
          </Dialog.Content>
          <Dialog.Actions><Button onPress={() => setHelpVisible(false)}>Got it</Button></Dialog.Actions>
        </Dialog>
        <Dialog visible={importing} dismissable={false}>
          <Dialog.Title>Importing contacts</Dialog.Title>
          <Dialog.Content style={styles.progressContent}>
            <Text variant="bodyMedium">{progress.label}</Text>
            <ProgressBar progress={progress.total > 0 ? progress.completed / progress.total : 0} />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{progress.completed} of {progress.total} student rows processed</Text>
          </Dialog.Content>
        </Dialog>
        <Snackbar visible={Boolean(message)} onDismiss={() => setMessage('')} duration={5000}>{message}</Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  uploadCard: { padding: 26, borderRadius: 28, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', gap: 14 },
  uploadIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  step: { position: 'absolute', top: 18, right: 20 },
  strong: { fontWeight: '800', letterSpacing: -0.4 },
  center: { textAlign: 'center' },
  button: { minHeight: 48 },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  results: { marginTop: 24, gap: 18 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  importCard: { borderRadius: 26, ...softShadow },
  importContent: { gap: 13 },
  list: { gap: 12 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  dialogContent: { gap: 12 },
  progressContent: { gap: 14 },
});
