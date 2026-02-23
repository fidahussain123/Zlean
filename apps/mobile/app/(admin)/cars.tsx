import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

interface Visit {
  id: string;
  car_plate: string;
  car_model?: string;
  service: string;
  status: string;
}

export default function AdminCarsScreen() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Visit[]>('/cars/visits');
        setVisits(Array.isArray(data) ? data : []);
      } catch {
        setVisits([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <View style={styles.centered}><Text style={styles.subtle}>Loading…</Text></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={visits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <Text style={styles.name}>{item.car_plate}</Text>
            <Text style={styles.subtle}>{item.service} · {item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.subtle}>No visits yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.container },
  list: { padding: spacing.container },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.md,
    ...shadow.tile,
  },
  name: { fontSize: 18, color: colors.text, fontWeight: '700' },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: 4 },
});
