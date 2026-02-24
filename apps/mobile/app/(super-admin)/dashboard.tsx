import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

interface Counts {
  shops: number;
  admins: number;
  visits: number;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState<Counts>({ shops: 0, admins: 0, visits: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [
          { count: shopsCount },
          { count: adminsCount }
        ] = await Promise.all([
          supabase.from('shops').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
        ]);

        setCounts({
          shops: shopsCount || 0,
          admins: adminsCount || 0,
          visits: 0,
        });
      } catch {
        setCounts({ shops: 0, admins: 0, visits: 0 });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tiles = [
    { label: 'Shops', value: counts.shops, href: '/(super-admin)/shops' },
    { label: 'Admins', value: counts.admins, href: '/(super-admin)/admins' },
    { label: 'Revenue', value: '—', href: '/(super-admin)/revenue' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={[styles.tile, styles.tileLarge]}>
        <Text style={styles.tileTitle}>Live Status</Text>
        <Text style={styles.tileValue}>Platform overview</Text>
        {loading && <Text style={styles.subtle}>Loading…</Text>}
      </View>
      <View style={styles.row}>
        {tiles.map((t) => (
          <Pressable
            key={t.label}
            style={({ pressed }) => [styles.tile, styles.tileSmall, pressed && styles.tilePressed]}
            onPress={() => router.push(t.href as any)}
          >
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={styles.tileNumber}>{t.value}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        style={({ pressed }) => [styles.inviteBtn, pressed && styles.btnPressed]}
        onPress={() => router.push('/(super-admin)/invite')}
      >
        <Text style={styles.inviteBtnText}>+ Invite Shop Owner</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.settingsBtn, pressed && styles.btnPressed]}
        onPress={() => router.push('/(super-admin)/settings')}
      >
        <Text style={styles.settingsBtnText}>Settings</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.container, paddingBottom: spacing.xl },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
  },
  tileLarge: { marginBottom: spacing.lg },
  tilePressed: { opacity: 0.95, transform: [{ translateY: -2 }] },
  tileTitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.xs },
  tileValue: { fontSize: 20, color: colors.text, ...typography.heading },
  tileLabel: { fontSize: 12, color: colors.textSubtle },
  tileNumber: { fontSize: 24, color: colors.text, ...typography.heading, marginTop: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  tileSmall: { flex: 1, minWidth: 0 },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: spacing.sm },
  inviteBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  inviteBtnText: { color: colors.text, fontWeight: '600', fontSize: 16 },
  settingsBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: { transform: [{ scale: 0.98 }] },
  settingsBtnText: { color: colors.text, fontWeight: '600' },
});
