import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, useLocalSearchParams } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting',
  washing: 'Washing',
  drying: 'Drying',
  ready: 'Ready',
  delivered: 'Delivered',
};

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [visit, setVisit] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const v = await api<Record<string, unknown>>(`/cars/visits/${id}`);
        setVisit(v);
      } catch {
        setVisit(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !visit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>{loading ? 'Loading…' : 'Not found'}</Text>
      </View>
    );
  }

  const status = (visit.status as string) ?? 'waiting';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Status</Text>
        <View style={styles.statusRow}>
          {['waiting', 'washing', 'drying', 'ready', 'delivered'].map((s, i) => (
            <View key={s} style={styles.step}>
              <View style={[styles.dot, s === status && styles.dotActive]} />
              <Text style={[styles.stepLabel, s === status && styles.stepLabelActive]}>{STATUS_LABELS[s]}</Text>
              {i < 4 && <View style={styles.line} />}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.tile}>
        <Text style={styles.label}>Car</Text>
        <Text style={styles.value}>{visit.car_plate}</Text>
        <Text style={styles.subtle}>{visit.car_model || '—'}</Text>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{String(visit.service)}</Text>
        {visit.estimated_time && (
          <>
            <Text style={styles.label}>Estimated ready</Text>
            <Text style={styles.value}>{String(visit.estimated_time)}</Text>
          </>
        )}
        {visit.notes && (
          <>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.subtle}>{String(visit.notes)}</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.container, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.lg,
    ...shadow.tile,
  },
  tileLarge: { marginBottom: spacing.lg },
  tileTitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  step: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  stepLabel: { fontSize: 10, color: colors.textSubtle, marginLeft: 4 },
  stepLabelActive: { color: colors.text, fontWeight: '700' },
  line: { width: 12, height: 1, backgroundColor: colors.border, marginHorizontal: 2 },
  label: { fontSize: 12, color: colors.textSubtle, marginTop: spacing.sm },
  value: { fontSize: 16, color: colors.text, fontWeight: '700' },
  subtle: { fontSize: 14, color: colors.textSubtle },
});
