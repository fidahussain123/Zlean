import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

interface VisitRow {
  id: string;
  car_plate: string;
  car_model?: string;
  service: string;
  status: string;
  customer_name?: string;
  worker_name?: string;
  created_at: string;
}

interface DashboardStats {
  totalToday: number;
  inProgress: number;
  ready: number;
  revenueToday: number;
  visits: VisitRow[];
}

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Waiting',
  washing: 'Washing',
  drying: 'Drying',
  ready: 'Ready',
  delivered: 'Delivered',
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return `${h}h ago`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      if (!user?.shopId) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('visits')
        .select(`
          id, car_plate, car_model, service, status, created_at,
          customer:customer_id(name),
          worker:worker_id(name)
        `)
        .eq('shop_id', user.shopId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const visits = data || [];
      const inProgress = visits.filter(v => v.status === 'washing' || v.status === 'drying').length;
      const ready = visits.filter(v => v.status === 'ready').length;

      const formattedVisits = visits.map(v => ({
        id: v.id,
        car_plate: v.car_plate,
        car_model: v.car_model,
        service: v.service,
        status: v.status,
        customer_name: (v.customer as any)?.name,
        worker_name: (v.worker as any)?.name,
        created_at: v.created_at,
      }));

      setStats({
        totalToday: visits.length,
        inProgress,
        ready,
        revenueToday: 0, // Mock for now or implement invoice sum later
        visits: formattedVisits,
      });
    } catch {
      setStats({ totalToday: 0, inProgress: 0, ready: 0, revenueToday: 0, visits: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.shopId]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading && !stats) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading…</Text>
      </View>
    );
  }

  const s = stats ?? { totalToday: 0, inProgress: 0, ready: 0, revenueToday: 0, visits: [] };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textSubtle} />}
    >
      {/* Live Status — top bento */}
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Live status</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{s.totalToday}</Text>
            <Text style={styles.statLabel}>Checked in</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{s.inProgress}</Text>
            <Text style={styles.statLabel}>In progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{s.ready}</Text>
            <Text style={styles.statLabel}>Ready</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{s.revenueToday}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/cars-new')}
        >
          <Text style={styles.primaryBtnText}>+ Add Car</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/appointments')}
        >
          <Text style={styles.secondaryBtnText}>Appointments</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/reports')}
        >
          <Text style={styles.secondaryBtnText}>Reports</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/workers')}
        >
          <Text style={styles.secondaryBtnText}>Workers</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push('/services')}
        >
          <Text style={styles.secondaryBtnText}>Services</Text>
        </Pressable>
      </View>

      {/* Today's cars */}
      <Text style={styles.sectionTitle}>Today&apos;s cars</Text>
      {s.visits.length === 0 ? (
        <View style={styles.emptyTile}>
          <Text style={styles.subtle}>No cars checked in today</Text>
        </View>
      ) : (
        s.visits.map((v) => (
          <Pressable
            key={v.id}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => router.push({ pathname: '/car-detail', params: { id: v.id } })}
          >
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>{(v as VisitRow).customer_name || 'Walk-in'}</Text>
              <View style={[styles.badge, v.status === 'ready' && styles.badgeReady]}>
                <Text style={styles.badgeText}>{STATUS_LABELS[v.status] || v.status}</Text>
              </View>
            </View>
            <Text style={styles.cardPlate}>{v.car_plate}</Text>
            <Text style={styles.subtle}>{v.car_model || v.service} · {(v as VisitRow).worker_name || 'Unassigned'}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(v.created_at)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.container, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.container },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
  },
  tileLarge: { marginBottom: spacing.lg },
  tileTitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: { flex: 1, minWidth: 70 },
  statValue: { fontSize: 20, color: colors.text, ...typography.heading },
  statLabel: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  primaryBtn: {
    backgroundColor: colors.accentBlack,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  secondaryBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, color: colors.text, ...typography.heading, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.md,
    ...shadow.tile,
  },
  cardPressed: { transform: [{ translateY: -2 }] },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, color: colors.text, fontWeight: '700' },
  badge: { backgroundColor: colors.border, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeReady: { backgroundColor: colors.primary },
  badgeText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  cardPlate: { fontSize: 14, color: colors.text, marginBottom: 2 },
  timeAgo: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  emptyTile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  subtle: { fontSize: 14, color: colors.textSubtle },
});
