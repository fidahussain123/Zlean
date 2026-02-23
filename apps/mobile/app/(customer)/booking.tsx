import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadow } from '@/constants/theme';

export default function CustomerBookingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <Text style={styles.title}>Appointment booking</Text>
        <Text style={styles.subtle}>Book a wash slot</Text>
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
