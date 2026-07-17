import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
import type { ImportedContactRow, RejectedContactRow } from '@/types/excel';
import { softShadow } from '@/constants/ui';

interface Props { row: ImportedContactRow | RejectedContactRow; status: 'valid' | 'duplicate' | 'invalid' }

export function ContactPreviewCard({ row, status }: Props) {
  const theme = useTheme();
  const reasons = 'reasons' in row ? row.reasons : [];
  const statusColor = status === 'valid' ? '#2E7D32' : status === 'duplicate' ? '#ED6C02' : theme.colors.error;
  return (
    <Card mode="contained" style={[styles.card, softShadow]}>
      <Card.Content style={styles.content}>
        <View style={styles.heading}>
          <View style={styles.nameBlock}>
            <Text variant="titleMedium" numberOfLines={1}>{row.studentName || 'Unnamed student'}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Row {row.rowNumber} • Roll {row.rollNumber || '—'}</Text>
          </View>
          <Chip compact textStyle={{ color: statusColor }} style={{ backgroundColor: `${statusColor}16` }}>{status}</Chip>
        </View>
        <View style={styles.details}>
          <Text variant="bodyMedium">Student: {row.studentNumber || '—'}</Text>
          <Text variant="bodyMedium">Parent: {row.parentName || '—'} • {row.parentNumber || '—'}</Text>
        </View>
        {reasons.map((reason) => <Text key={reason} variant="bodySmall" style={{ color: statusColor }}>• {reason}</Text>)}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22 },
  content: { gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  nameBlock: { flex: 1, gap: 2 },
  details: { gap: 3 },
});
