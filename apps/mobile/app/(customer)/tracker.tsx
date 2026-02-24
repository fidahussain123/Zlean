import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

interface Visit {
  id: string;
  car_plate: string;
  service: string;
  status: string;
  shop?: { name: string };
}

const STAGES = ['waiting', 'washing', 'drying', 'ready', 'delivered'];

export default function CustomerTrackerScreen() {
  const { user } = useAuth();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchVisit();

    const sub = supabase
      .channel('customer-tracker')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'visits', filter: `customer_id=eq.${user.id}` },
        (payload) => {
          setVisit((prev) => prev && prev.id === payload.new.id ? { ...prev, status: payload.new.status } : prev);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user]);

  async function fetchVisit() {
    try {
      const { data, error } = await supabase
        .from('visits')
        .select(`
          id, car_plate, service, status,
          shop:shop_id(name)
        `)
        .eq('customer_id', user!.id)
        .neq('status', 'delivered')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setVisit({
          id: data.id,
          car_plate: data.car_plate,
          service: data.service,
          status: data.status,
          shop: Array.isArray(data.shop) ? data.shop[0] : data.shop,
        } as Visit);
      }
    } catch {
      // Ignore silently if no active visit
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Live Status Bento Tile */}
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Live car status</Text>

        {!visit ? (
          <View>
            <Text style={styles.tileValue}>No active wash</Text>
            <Text style={styles.subtle}>Your car status will appear here when you have a wash in progress.</Text>
          </View>
        ) : (
          <View>
            <Text style={styles.tileValue}>{visit.shop?.name || 'Zlean Car Wash'}</Text>
            <View style={styles.carPlateBadge}>
              <Text style={styles.carPlateText}>{visit.car_plate}</Text>
            </View>
            <Text style={styles.serviceText}>{visit.service}</Text>

            <View style={styles.timeline}>
              {STAGES.map((stage, i) => {
                const currentIndex = STAGES.indexOf(visit.status);
                const isPast = i < currentIndex;
                const isCurrent = i === currentIndex;

                return (
                  <View key={stage} style={styles.stageRow}>
                    <View style={[
                      styles.dot,
                      isPast && styles.dotPast,
                      isCurrent && styles.dotCurrent
                    ]} />
                    <Text style={[
                      styles.stageText,
                      isCurrent && styles.stageTextCurrent,
                      isPast && styles.stageTextPast
                    ]}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </Text>
                    {/* Render a connecting line unless it's the last item */}
                    {i < STAGES.length - 1 && (
                      <View style={[styles.line, isPast && styles.linePast]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.container, paddingBottom: spacing.xl },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
  },
  tileLarge: { marginBottom: spacing.lg },
  tileTitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.sm, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tileValue: { fontSize: 24, color: colors.text, ...typography.heading, marginBottom: spacing.md },
  subtle: { fontSize: 15, color: colors.textSubtle, marginTop: spacing.sm, lineHeight: 22 },

  carPlateBadge: {
    backgroundColor: colors.accentBlack,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  carPlateText: { color: colors.primary, fontWeight: '700', fontSize: 18, letterSpacing: 1 },
  serviceText: { fontSize: 16, color: colors.textSubtle, marginBottom: spacing.xl },

  timeline: { paddingLeft: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative', minHeight: 48 },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.border, marginTop: 4, marginRight: spacing.md, zIndex: 2 },
  dotPast: { backgroundColor: colors.accentBlack },
  dotCurrent: { backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.accentBlack, transform: [{ scale: 1.2 }] },
  line: { position: 'absolute', left: 7, top: 20, bottom: -4, width: 2, backgroundColor: colors.border, zIndex: 1 },
  linePast: { backgroundColor: colors.accentBlack },
  stageText: { fontSize: 18, color: colors.textSubtle, fontWeight: '500' },
  stageTextPast: { color: colors.text, opacity: 0.7 },
  stageTextCurrent: { color: colors.text, fontWeight: '800', letterSpacing: -0.5 },
});
