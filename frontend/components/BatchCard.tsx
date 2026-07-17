import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card, Text, useTheme } from 'react-native-paper';
import type { BatchRecord } from '@/types/batch';
import { formatDisplayDate } from '@/utils/date';
import { HapticService } from '@/services/HapticService';
import { softShadow } from '@/constants/ui';

interface Props { batch: BatchRecord; onLongPress: (batch: BatchRecord) => void }

export function BatchCard({ batch, onLongPress }: Props) {
  const theme = useTheme();
  const longPressed = useRef(false);
  return (
    <Card mode="contained" style={[styles.card, softShadow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${batch.batchName}, ${batch.totalContacts} contacts`}
        android_ripple={{ color: theme.colors.primaryContainer }}
        onLongPress={() => { longPressed.current = true; HapticService.longPress(); onLongPress(batch); }}
        onPress={() => {
          if (longPressed.current) { longPressed.current = false; return; }
          router.push(`/batches/${batch.batchId}`);
        }}
        delayLongPress={450}
        style={styles.pressable}
      >
        <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name="folder-account-outline" size={30} color={theme.colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text variant="titleMedium" numberOfLines={1}>{batch.batchName}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Academic Year {batch.academicYear}</Text>
          <View style={styles.metadata}>
            <View style={styles.metaItem}><MaterialCommunityIcons name="account-multiple-outline" size={16} color={theme.colors.onSurfaceVariant} /><Text variant="bodySmall">{batch.totalContacts} contacts</Text></View>
            <View style={styles.metaItem}><MaterialCommunityIcons name="calendar-outline" size={16} color={theme.colors.onSurfaceVariant} /><Text variant="bodySmall">{formatDisplayDate(batch.createdDate)}</Text></View>
          </View>
        </View>
        <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 24, overflow: 'hidden' },
  pressable: { minHeight: 94, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
  icon: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
