import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

interface Admin {
  id: string;
  name: string;
  email?: string;
  shop_id?: string;
  status: string;
}

export default function AdminsScreen() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<Admin[]>('/admins');
        setAdmins(Array.isArray(data) ? data : []);
      } catch {
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading admins…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={admins}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tile}>
            <Text style={styles.name}>{item.name}</Text>
            {item.email ? <Text style={styles.subtle}>{item.email}</Text> : null}
            <Text style={styles.status}>{item.status}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.subtle}>No admins yet.</Text>}
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
