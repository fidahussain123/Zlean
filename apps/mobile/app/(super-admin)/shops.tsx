import { useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status: string;
}

export default function ShopsScreen() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Shop[]>('/shops');
        setShops(Array.isArray(data) ? data : []);
      } catch {
        setShops([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading shops…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <Text style={styles.name}>{item.name}</Text>
            {item.address ? <Text style={styles.subtle}>{item.address}</Text> : null}
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.subtle}>No shops yet.</Text>}
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
  status: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
});
