import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

export default function CustomerTrackerScreen() {
  return (
    <View style={styles.container}>
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Live car status</Text>
        <Text style={styles.tileValue}>No active visit</Text>
        <Text style={styles.subtle}>Your car status will appear here when you have a wash in progress.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.container },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
  },
  tileLarge: { marginBottom: spacing.lg },
  tileTitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.xs },
  tileValue: { fontSize: 20, color: colors.text, ...typography.heading },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: spacing.sm },
});
