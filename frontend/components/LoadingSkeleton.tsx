import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <View accessibilityLabel="Loading" style={styles.container}>{Array.from({ length: rows }, (_, index) => <Animated.View key={index} style={[styles.row, { opacity, backgroundColor: theme.colors.surfaceVariant }]}><View style={[styles.circle, { backgroundColor: theme.colors.surface }]} /><View style={styles.copy}><View style={[styles.line, { backgroundColor: theme.colors.surface }]} /><View style={[styles.shortLine, { backgroundColor: theme.colors.surface }]} /></View></Animated.View>)}</View>;
}

const styles = StyleSheet.create({
  container: { gap: 12 }, row: { minHeight: 88, padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  circle: { width: 52, height: 52, borderRadius: 16 }, copy: { flex: 1, gap: 10 },
  line: { height: 14, width: '72%', borderRadius: 7 }, shortLine: { height: 11, width: '46%', borderRadius: 6 },
});
