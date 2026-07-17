import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import type { IconName } from '@/types/navigation';

interface Props { title: string; description: string; icon: IconName }

export function FeaturePlaceholder({ title, description, icon }: Props) {
  const theme = useTheme();
  return (
    <Screen contentStyle={styles.screen}>
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={[styles.icon, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name={icon} size={48} color={theme.colors.primary} />
          </View>
          <Text variant="headlineSmall" style={styles.center}>{title}</Text>
          <Text variant="bodyLarge" style={[styles.center, { color: theme.colors.onSurfaceVariant }]}>{description}</Text>
          <Button mode="contained-tonal" onPress={() => router.back()}>Back to dashboard</Button>
        </Card.Content>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  card: { borderRadius: 24 },
  content: { paddingVertical: 32, alignItems: 'center', gap: 16 },
  icon: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
