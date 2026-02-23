import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, useLocalSearchParams, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow, typography } from '@/constants/theme';

const STAGES = ['waiting', 'washing', 'drying', 'ready', 'delivered'] as const;
const STAGE_LABELS: Record<string, string> = {
  waiting: 'Waiting',
  washing: 'Washing',
  drying: 'Drying',
  ready: 'Ready',
  delivered: 'Delivered',
};

export default function WorkerVisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [visit, setVisit] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const v = await api<Record<string, unknown>>(`/cars/visits/${id}`);
      setVisit(v);
    } catch {
      setVisit(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateStatus(next: string) {
    if (!id || !visit) return;
    setUpdating(true);
    try {
      await api(`/cars/visits/${id}`, { method: 'PATCH', body: { status: next } });
      setVisit((prev) => (prev ? { ...prev, status: next } : null));
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setUpdating(false);
    }
  }

  if (loading || !visit) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>{loading ? 'Loading…' : 'Not found'}</Text>
      </View>
    );
  }

  const status = (visit.status as string) ?? 'waiting';
  const idx = STAGES.indexOf(status as typeof STAGES[number]);
  const nextStage = idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Status</Text>
        <View style={styles.stagesRow}>
          {STAGES.map((s, i) => (
            <View key={s} style={styles.stage}>
              <View style={[styles.dot, s === status && styles.dotActive]} />
              <Text style={[styles.stageLabel, s === status && styles.stageLabelActive]}>{STAGE_LABELS[s]}</Text>
              {i < STAGES.length - 1 && <View style={styles.line} />}
            </View>
          ))}
        </View>
        {nextStage && (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
            onPress={() => updateStatus(nextStage)}
            disabled={updating}
          >
            <Text style={styles.primaryBtnText}>
              {updating ? 'Updating…' : `Mark as ${STAGE_LABELS[nextStage]}`}
            </Text>
          </Pressable>
        )}
        {status === 'delivered' && (
          <Text style={styles.doneText}>Completed</Text>
        )}
      </View>
      <View style={styles.tile}>
        <Text style={styles.label}>Car</Text>
        <Text style={styles.value}>{String(visit.car_plate)}</Text>
        <Text style={styles.subtle}>{String(visit.car_model || '—')}</Text>
        <Text style={styles.label}>Service</Text>
        <Text style={styles.value}>{String(visit.service)}</Text>
        {visit.estimated_time && (
          <>
            <Text style={styles.label}>Estimated ready</Text>
            <Text style={styles.subtle}>{String(visit.estimated_time)}</Text>
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
  stagesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: spacing.lg },
  stage: { flexDirection: 'row', alignItems: 'center', marginRight: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  stageLabel: { fontSize: 10, color: colors.textSubtle, marginLeft: 4 },
  stageLabelActive: { color: colors.text, fontWeight: '700' },
  line: { width: 8, height: 1, backgroundColor: colors.border, marginHorizontal: 2 },
  primaryBtn: {
    backgroundColor: colors.accentBlack,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
  },
  btnPressed: { transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  doneText: { fontSize: 16, color: colors.primary, ...typography.heading, textAlign: 'center' },
  label: { fontSize: 12, color: colors.textSubtle, marginTop: spacing.sm },
  value: { fontSize: 16, color: colors.text, fontWeight: '700' },
  subtle: { fontSize: 14, color: colors.textSubtle },
});
