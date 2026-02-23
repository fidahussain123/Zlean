import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, radius, shadow, typography } from '@/constants/theme';

interface Visit {
  id: string;
  car_plate: string;
  car_model?: string;
  service: string;
  status: string;
  customer_name?: string;
  created_at: string;
}

interface WorkerDashboard {
  assignedToday: number;
  completed: number;
  inProgress: number;
  visits: Visit[];
}

const STATUS_COLORS: Record<string, string> = {
  waiting: colors.textSubtle,
  washing: colors.primary,
  drying: colors.primary,
  ready: colors.primary,
  delivered: colors.textSubtle,
};

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function WorkerQueueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<WorkerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      if (!user?.id || !user?.shopId) return;

      // We'll show all active cars for the shop so workers can pick them up, or just assigned to them.
      // Usually a queue shows all 'waiting' for the shop + their own assigned ones.
      // For MVP: let's show all for the shop today so any worker can see the live queue.
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: visitsData, error } = await supabase
        .from('visits')
        .select(`
          id, car_plate, car_model, service, status, created_at,
          customer:customer_id(name)
        `)
        .eq('shop_id', user.shopId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const visits = visitsData || [];
      setData({
        assignedToday: visits.length,
        inProgress: visits.filter(v => v.status === 'washing' || v.status === 'drying').length,
        completed: visits.filter(v => v.status === 'ready' || v.status === 'delivered').length,
        visits: visits.map(v => ({
          ...v,
          customer_name: (v.customer as any)?.name
        })),
      });
    } catch {
      setData({ assignedToday: 0, completed: 0, inProgress: 0, visits: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    if (!user?.shopId) return;

    // Real-time subscription for table updates
    const channel = supabase
      .channel('public:visits')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visits', filter: `shop_id=eq.${user.shopId}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.shopId]);

  if (loading && !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading queue…</Text>
      </View>
    );
  }

  const visits = data?.visits ?? [];
  const greeting = 'Good morning';
  const today = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const userName = user?.name ?? '';

  return (
    <View style={styles.container}>
      <View style={[styles.tile, styles.headerTile]}>
        <Text style={styles.greeting}>{greeting}, {userName}</Text>
        <Text style={styles.date}>{today}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data?.assignedToday ?? 0}</Text>
            <Text style={styles.statLabel}>Assigned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data?.inProgress ?? 0}</Text>
            <Text style={styles.statLabel}>In progress</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{data?.completed ?? 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.textSubtle} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
            onPress={() => router.push(`/visit/${item.id}`)}
          >
            <View style={styles.cardRow}>
              <Text style={styles.name}>{item.car_plate}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] || colors.border }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.subtle}>{(item as Visit).customer_name || '—'} · {item.service}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(item.created_at)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.subtle}>No cars in your queue today.</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.container },
  list: { padding: spacing.container, paddingTop: 0 },
  headerTile: { marginBottom: spacing.lg },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.md,
    ...shadow.tile,
  },
  tilePressed: { transform: [{ translateY: -2 }] },
  greeting: { fontSize: 20, color: colors.text, ...typography.heading },
  date: { fontSize: 14, color: colors.textSubtle, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.md },
  statBox: { flex: 1 },
  statValue: { fontSize: 18, color: colors.text, fontWeight: '700' },
  statLabel: { fontSize: 12, color: colors.textSubtle },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, color: colors.text, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: 4 },
  timeAgo: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  empty: { padding: spacing.xl, alignItems: 'center' },
});
