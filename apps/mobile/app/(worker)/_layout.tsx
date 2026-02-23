import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function WorkerLayout() {
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
      <Stack.Screen name="queue" options={{ title: 'Queue' }} />
      <Stack.Screen name="car-entry" options={{ title: 'Car entry' }} />
      <Stack.Screen name="status-update" options={{ title: 'Status' }} />
      <Stack.Screen name="billing-assist" options={{ title: 'Billing' }} />
      <Stack.Screen name="visit/[id]" options={{ title: 'Car detail' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
