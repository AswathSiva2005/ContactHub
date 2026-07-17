import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import type { DashboardAction } from '@/types/navigation';
import { softShadow } from '@/constants/ui';

export function DashboardCard({ action }: { action: DashboardAction }) {
  const theme = useTheme();
  return (
    <Card style={[styles.card, softShadow]} mode="contained">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action.title}. ${action.description}`}
        android_ripple={{ color: theme.colors.primaryContainer }}
        onPress={() => router.push(action.route)}
        style={styles.pressable}
      >
        <View style={[styles.icon, { backgroundColor: `${action.accent}18` }]}>
          <MaterialCommunityIcons name={action.icon} size={30} color={action.accent} />
        </View>
        <View style={styles.copy}>
          <Text variant="titleMedium">{action.title}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{action.description}</Text>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', borderRadius: 24, overflow: 'hidden' },
  pressable: { minHeight: 142, padding: 17, alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 4 },
});
