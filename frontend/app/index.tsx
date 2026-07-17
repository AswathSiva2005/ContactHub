import { StyleSheet, View } from 'react-native';
import { Avatar, IconButton, Text, useTheme } from 'react-native-paper';
import { DashboardCard } from '@/components/DashboardCard';
import { Screen } from '@/components/Screen';
import { FadeInView } from '@/components/FadeInView';
import type { DashboardAction } from '@/types/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { softShadow, UI } from '@/constants/ui';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

const actions: DashboardAction[] = [
  { title: 'Import Excel', description: 'Create phone contacts from a spreadsheet', icon: 'file-excel-outline', route: '/import', accent: '#1565C0' },
  { title: 'Saved Batches', description: 'View and manage previous imports', icon: 'folder-multiple-outline', route: '/batches', accent: '#00897B' },
  { title: 'Search Contacts', description: 'Quickly find imported contacts', icon: 'account-search-outline', route: '/search', accent: '#7E57C2' },
  { title: 'Settings', description: 'Permissions, appearance and preferences', icon: 'cog-outline', route: '/settings', accent: '#F57C00' },
];

export default function DashboardScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  return (
    <Screen>
      <View style={styles.header}>
        <Avatar.Icon size={56} icon="account-group" style={{ backgroundColor: theme.colors.primary }} />
        <View style={styles.headerCopy}>
          <Text variant="headlineMedium" style={styles.brand}>Hello, {user?.name.split(' ')[0]}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Class contacts, organized beautifully.</Text>
        </View>
        <IconButton icon="account-circle-outline" size={30} accessibilityLabel="Open profile" onPress={() => router.push('/profile')} />
      </View>
      <FadeInView delay={60} style={styles.heroShell}>
        <LinearGradient colors={[UI.blue, '#278BFB', UI.cyan]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroIcon}><MaterialCommunityIcons name="account-school-outline" size={30} color="#FFFFFF" /></View>
          <Text variant="headlineSmall" style={styles.heroTitle}>Your classes, always organized</Text>
          <Text variant="bodyLarge" style={styles.heroBody}>Import, search and manage student and parent contacts in one secure place.</Text>
        </LinearGradient>
      </FadeInView>
      <Text variant="titleMedium" style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.grid}>{actions.map((action, index) => <FadeInView key={action.route} delay={100 + index * 55} style={styles.gridItem}><DashboardCard action={action} /></FadeInView>)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  headerCopy: { flex: 1 },
  brand: { fontWeight: '800', letterSpacing: -0.7 },
  heroShell: { borderRadius: 28, overflow: 'hidden', ...softShadow },
  hero: { minHeight: 204, padding: 24, borderRadius: 28, justifyContent: 'flex-end', gap: 8 },
  heroIcon: { position: 'absolute', top: 22, right: 22, width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.3 },
  heroBody: { color: '#EAF7FF', lineHeight: 23, maxWidth: 460 },
  sectionTitle: { marginTop: 28, marginBottom: 14, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%', flexGrow: 1, minWidth: 145 },
});
