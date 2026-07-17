import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Checkbox, Text, useTheme } from 'react-native-paper';
import type { ContactRecord } from '@/types/batch';
import { HapticService } from '@/services/HapticService';
import { softShadow } from '@/constants/ui';

interface Props {
  contact: ContactRecord;
  onLongPress: (contact: ContactRecord) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onPress?: (contact: ContactRecord) => void;
}

export function BatchContactCard({ contact, onLongPress, selectionMode = false, selected = false, onPress }: Props) {
  const theme = useTheme();
  const longPressed = useRef(false);
  return (
    <Card mode="contained" style={[styles.card, softShadow]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${contact.studentName}. Long press to edit or delete.`}
        onLongPress={() => { longPressed.current = true; HapticService.longPress(); onLongPress(contact); }}
        onPress={() => { if (!longPressed.current) onPress?.(contact); longPressed.current = false; }}
        delayLongPress={450}
      >
      <Card.Content style={styles.content}>
        <View style={styles.heading}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons name="account-school-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text variant="titleMedium">{contact.studentName}</Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Roll Number: {contact.rollNumber}</Text>
          </View>
          {selectionMode ? <Checkbox status={selected ? 'checked' : 'unchecked'} /> : null}
        </View>
        <View style={styles.detail}><MaterialCommunityIcons name="phone-outline" size={18} color={theme.colors.primary} /><Text variant="bodyMedium">{contact.studentNumber}</Text></View>
        <View style={styles.detail}><MaterialCommunityIcons name="account-heart-outline" size={18} color={theme.colors.primary} /><Text variant="bodyMedium">{contact.parentName}</Text></View>
        <View style={styles.detail}><MaterialCommunityIcons name="phone-outline" size={18} color={theme.colors.primary} /><Text variant="bodyMedium">{contact.parentNumber}</Text></View>
      </Card.Content>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22 },
  content: { gap: 9 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 2 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 4 },
});
