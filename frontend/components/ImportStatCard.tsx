import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import type { IconName } from '@/types/navigation';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { softShadow } from '@/constants/ui';

interface Props { label: string; value: number; icon: IconName; color: string }

export function ImportStatCard({ label, value, icon, color }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: `${color}12` }, softShadow]}>
      <View style={[styles.icon, { backgroundColor: `${color}1A` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text variant="headlineSmall" style={styles.value}>{value}</Text>
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', minWidth: 140, borderRadius: 22, padding: 16, gap: 5 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  value: { fontWeight: '700' },
  label: { minHeight: 20 },
});
