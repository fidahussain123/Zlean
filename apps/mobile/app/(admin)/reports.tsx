import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '@/constants/theme';

export default function AdminReportsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtle}>Analytics and exports</Text>
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
  title: { fontSize: 18, color: colors.text, fontWeight: '700' },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: spacing.sm },
});
