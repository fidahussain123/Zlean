import { Stack, useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';

export default function CustomerLayout() {
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
      <Stack.Screen name="tracker" options={{ title: 'Live status' }} />
      <Stack.Screen name="booking" options={{ title: 'Booking' }} />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="membership" options={{ title: 'Membership' }} />
      <Stack.Screen name="invoices" options={{ title: 'Invoices' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
