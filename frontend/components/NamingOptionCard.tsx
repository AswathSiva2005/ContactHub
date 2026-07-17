import { Pressable, StyleSheet, View } from 'react-native';
import { RadioButton, Text, useTheme } from 'react-native-paper';
import type { NamingFormatOption, NamingFormat } from '@/types/naming';

interface Props {
  option: NamingFormatOption;
  selected: boolean;
  onSelect: (format: NamingFormat) => void;
}

export function NamingOptionCard({ option, selected, onSelect }: Props) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(option.value)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surface, borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant },
        pressed && styles.pressed,
      ]}
    >
      <RadioButton.Android value={option.value} status={selected ? 'checked' : 'unchecked'} onPress={() => onSelect(option.value)} />
      <View style={styles.copy}>
        <Text variant="titleMedium">{option.label}</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{option.description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 78, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  copy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.8 },
});
