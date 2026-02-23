import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function AdminLayout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerTintColor: colors.accentBlack,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => (
          <Pressable onPress={() => router.push('settings')} style={{ paddingHorizontal: 16 }}>
            <Text style={{ color: colors.accentBlack, fontSize: 16, fontWeight: '600' }}>Settings</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="workers" options={{ title: 'Workers' }} />
      <Stack.Screen name="cars" options={{ title: 'Cars' }} />
      <Stack.Screen name="cars-new" options={{ title: 'Add Car' }} />
      <Stack.Screen name="car-detail" options={{ title: 'Car Detail' }} />
      <Stack.Screen name="billing" options={{ title: 'Billing' }} />
      <Stack.Screen name="appointments" options={{ title: 'Appointments' }} />
      <Stack.Screen name="customers" options={{ title: 'Customers' }} />
      <Stack.Screen name="memberships" options={{ title: 'Memberships' }} />
      <Stack.Screen name="reports" options={{ title: 'Reports' }} />
      <Stack.Screen name="services" options={{ title: 'Service packages' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
