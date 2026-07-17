import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { ImportStatCard } from '@/components/ImportStatCard';
import { Screen } from '@/components/Screen';
import type { ContactImportResult } from '@/types/contactImport';

interface Props { result: ContactImportResult; onImportAnother: () => void }

export function ImportSuccess({ result, onImportAnother }: Props) {
  const theme = useTheme();
  const hasImports = result.importedStudents > 0;
  return (
    <Screen contentStyle={styles.screen}>
      <View style={[styles.heroIcon, { backgroundColor: hasImports ? '#E3F4E5' : theme.colors.errorContainer }]}>
        <MaterialCommunityIcons name={hasImports ? 'check-bold' : 'alert-outline'} size={48} color={hasImports ? '#2E7D32' : theme.colors.error} />
      </View>
      <Text variant="headlineMedium" style={styles.center}>{hasImports ? 'Import successful' : 'No contacts imported'}</Text>
      <Text variant="bodyLarge" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>
        {hasImports ? `${result.batchName} is now saved on this phone and in ContactSync.` : 'Every valid row was already present or could not be imported.'}
      </Text>
      <Card mode="outlined" style={styles.batchCard}>
        <Card.Content style={styles.batchContent}>
          <Text variant="titleMedium">{result.batchName}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Academic Year {result.academicYear}</Text>
          {hasImports && <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Batch ID: {result.batchId}</Text>}
        </Card.Content>
      </Card>
      <View style={styles.stats}>
        <ImportStatCard label="Students imported" value={result.importedStudents} icon="account-school-outline" color="#2E7D32" />
        <ImportStatCard label="Phone contacts" value={result.phoneContactsCreated} icon="contacts-outline" color={theme.colors.primary} />
        <ImportStatCard label="Duplicates skipped" value={result.duplicatesSkipped} icon="content-duplicate" color="#ED6C02" />
        <ImportStatCard label="Failed rows" value={result.failedRows} icon="alert-circle-outline" color={theme.colors.error} />
      </View>
      <View style={styles.actions}>
        <Button mode="contained" icon="view-dashboard-outline" onPress={() => router.replace('/')}>Back to dashboard</Button>
        <Button mode="outlined" icon="file-import-outline" onPress={onImportAnother}>Import another file</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', paddingTop: 38 },
  heroIcon: { width: 96, height: 96, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  center: { textAlign: 'center', maxWidth: 520 },
  batchCard: { width: '100%', maxWidth: 600, borderRadius: 20, marginTop: 22 },
  batchContent: { gap: 4 },
  stats: { width: '100%', maxWidth: 600, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 18 },
  actions: { width: '100%', maxWidth: 600, gap: 10, marginTop: 24 },
});
