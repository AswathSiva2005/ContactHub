import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { UI, softShadow } from '@/constants/ui';
import { getErrorMessage } from '@/utils/errors';

interface Props {
  mode: 'login' | 'register';
  submit: (name: string, phoneNumber: string) => Promise<void>;
}

export function AuthForm({ mode, submit }: Props) {
  const theme = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const isRegister = mode === 'register';
  const run = async () => {
    if (name.trim().length < 2 || phone.replace(/\D/g, '').length < 7) {
      setError('Enter your full name and a valid phone number.');
      return;
    }
    setWorking(true);
    setError('');
    try { await submit(name.trim(), phone.trim()); }
    catch (submitError) { setError(getErrorMessage(submitError)); }
    finally { setWorking(false); }
  };
  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Screen contentStyle={styles.screen}>
      <LinearGradient colors={[UI.blue, '#268AFB', UI.cyan]} style={styles.brand}>
        <View style={styles.logo}><MaterialCommunityIcons name="account-group-outline" size={38} color="#FFFFFF" /></View>
        <Text variant="headlineMedium" style={styles.brandTitle}>ContactSync</Text>
        <Text style={styles.brandCopy}>Your class contacts, private and organized.</Text>
      </LinearGradient>
      <View style={[styles.form, { backgroundColor: theme.colors.surface }, softShadow]}>
        <View style={styles.heading}>
          <Text variant="headlineSmall" style={styles.title}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{isRegister ? 'Register to keep your imports separated and secure.' : 'Log in to continue to your contacts.'}</Text>
        </View>
        <TextInput mode="outlined" label="Full name" value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" left={<TextInput.Icon icon="account-outline" />} />
        <TextInput mode="outlined" label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" left={<TextInput.Icon icon="phone-outline" />} onSubmitEditing={() => void run()} />
        {error ? <Text style={{ color: theme.colors.error }}>{error}</Text> : null}
        <Button mode="contained" contentStyle={styles.button} loading={working} disabled={working} onPress={() => void run()}>{isRegister ? 'Create account' : 'Log in'}</Button>
        <View style={styles.switchRow}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>{isRegister ? 'Already registered?' : 'New to ContactSync?'}</Text>
          <Link href={isRegister ? '/login' : '/register'} asChild><Button compact>{isRegister ? 'Log in' : 'Register'}</Button></Link>
        </View>
      </View>
    </Screen>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { justifyContent: 'center', gap: 20, paddingVertical: 30 },
  brand: { minHeight: 220, borderRadius: 30, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: { width: 76, height: 76, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  brandTitle: { color: '#FFFFFF', fontWeight: '800', letterSpacing: -0.6 },
  brandCopy: { color: '#EAF7FF', textAlign: 'center' },
  form: { borderRadius: 28, padding: 22, gap: 15 },
  heading: { gap: 5, marginBottom: 4 },
  title: { fontWeight: '800', letterSpacing: -0.4 },
  button: { minHeight: 52 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
});
