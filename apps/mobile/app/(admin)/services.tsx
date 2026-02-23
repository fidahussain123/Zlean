import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes?: number;
  is_active: number;
}

export default function AdminServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const data = await api<Service[]>('/services');
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.subtle}>₹{item.price}</Text>
            {item.duration_minutes != null && (
              <Text style={styles.subtle}>{item.duration_minutes} min</Text>
            )}
            <Text style={styles.badge}>{item.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.subtle}>No service packages. Add one from your backend or admin panel.</Text></View>}
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
  badge: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  empty: { padding: spacing.xl, alignItems: 'center' },
});
