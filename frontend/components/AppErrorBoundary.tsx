import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface State { error: Error | null }

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };
  static getDerivedStateFromError(error: Error): State { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { if (__DEV__) console.error('Uncaught render error', error, info.componentStack); }
  render() {
    if (!this.state.error) return this.props.children;
    return <View style={styles.container}><Text variant="headlineSmall">Something went wrong</Text><Text style={styles.copy}>ContactSync could not display this screen. Your saved data has not been removed.</Text><Button mode="contained" onPress={() => this.setState({ error: null })}>Try again</Button></View>;
  }
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 28 }, copy: { textAlign: 'center' } });
