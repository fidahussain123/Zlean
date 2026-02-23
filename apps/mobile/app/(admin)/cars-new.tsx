import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/services/api';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

interface Worker {
  id: string;
  name: string;
}
interface Service {
  id: string;
  name: string;
  price: number;
}

export default function CarsNewScreen() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [carPlate, setCarPlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [workerId, setWorkerId] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingForm, setLoadingForm] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [w, s] = await Promise.all([
          api<Worker[]>('/workers'),
          api<Service[]>('/services'),
        ]);
        setWorkers(Array.isArray(w) ? w : []);
        setServices(Array.isArray(s) ? s : []);
        if (Array.isArray(s) && s.length) setServiceId(s[0].id);
        if (Array.isArray(w) && w.length) setWorkerId(w[0].id);
      } catch {
        setWorkers([]);
        setServices([]);
      } finally {
        setLoadingForm(false);
      }
    })();
  }, []);

  async function handleSubmit() {
    const plate = carPlate.trim().toUpperCase();
    if (!plate) {
      Alert.alert('Error', 'Car plate is required');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Customer phone is required');
      return;
    }
    const service = services.find((x) => x.id === serviceId);
    const serviceName = service?.name ?? 'Service';
    setLoading(true);
    try {
      const customer = await api<{ id: string }>('/customers/find-or-create', {
        method: 'POST',
        body: { name: customerName.trim() || 'Walk-in', phone: customerPhone.trim() },
      });
      await api('/cars/visits', {
        method: 'POST',
        body: {
          customer_id: customer.id,
          worker_id: workerId || null,
          car_plate: plate,
          car_model: carModel.trim() || null,
          service: serviceName,
          estimated_time: estimatedTime.trim() || null,
          notes: notes.trim() || null,
        },
      });
      Alert.alert('Done', 'Car checked in', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add car');
    } finally {
      setLoading(false);
    }
  }

  if (loadingForm) {
    return (
      <View style={styles.centered}>
        <Text style={styles.subtle}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.tile}>
        <Text style={styles.label}>Customer name</Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.textSubtle}
          value={customerName}
          onChangeText={setCustomerName}
          editable={!loading}
        />
        <Text style={styles.label}>Customer phone</Text>
        <TextInput
          style={styles.input}
          placeholder="Phone"
          placeholderTextColor={colors.textSubtle}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />
        <Text style={styles.label}>Car plate</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. KA01AB1234"
          placeholderTextColor={colors.textSubtle}
          value={carPlate}
          onChangeText={(t) => setCarPlate(t.toUpperCase())}
          autoCapitalize="characters"
          editable={!loading}
        />
        <Text style={styles.label}>Car model</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Honda City"
          placeholderTextColor={colors.textSubtle}
          value={carModel}
          onChangeText={setCarModel}
          editable={!loading}
        />
        <Text style={styles.label}>Service</Text>
        <View style={styles.pickerRow}>
          {services.map((sv) => (
            <Pressable
              key={sv.id}
              style={[styles.chip, serviceId === sv.id && styles.chipActive]}
              onPress={() => setServiceId(sv.id)}
            >
              <Text style={[styles.chipText, serviceId === sv.id && styles.chipTextActive]}>{sv.name}</Text>
              <Text style={styles.chipSub}>₹{sv.price}</Text>
            </Pressable>
          ))}
        </View>
        {services.length === 0 && <Text style={styles.subtle}>No packages. Add in Services.</Text>}
        <Text style={styles.label}>Assign worker</Text>
        <View style={styles.pickerRow}>
          {workers.map((w) => (
            <Pressable
              key={w.id}
              style={[styles.chip, workerId === w.id && styles.chipActive]}
              onPress={() => setWorkerId(w.id)}
            >
              <Text style={[styles.chipText, workerId === w.id && styles.chipTextActive]}>{w.name}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Estimated ready time</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2:00 PM"
          placeholderTextColor={colors.textSubtle}
          value={estimatedTime}
          onChangeText={setEstimatedTime}
          editable={!loading}
        />
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          placeholder="Notes"
          placeholderTextColor={colors.textSubtle}
          value={notes}
          onChangeText={setNotes}
          multiline
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Adding…' : 'Check in car'}</Text>
        </Pressable>
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
    ...shadow.tile,
  },
  label: { fontSize: 14, color: colors.textSubtle, marginBottom: 4, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.button,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notes: { minHeight: 80, textAlignVertical: 'top' },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  chip: {
    backgroundColor: colors.background,
    borderRadius: radius.button,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentBlack, borderColor: colors.accentBlack },
  chipText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  chipTextActive: { color: colors.primary },
  chipSub: { fontSize: 12, color: colors.textSubtle },
  primaryBtn: {
    backgroundColor: colors.accentBlack,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  btnPressed: { transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  subtle: { fontSize: 14, color: colors.textSubtle },
});
