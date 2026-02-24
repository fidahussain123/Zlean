import { Stack, useRouter, Redirect } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';

export default function SuperAdminLayout() {
  const router = useRouter();
  const { user, ready } = useAuth();

  if (ready && (!user || user.role !== 'super_admin')) {
    return <Redirect href="/" />;
  }

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
      <Stack.Screen name="shops" options={{ title: 'Shops' }} />
      <Stack.Screen name="admins" options={{ title: 'Admins' }} />
      <Stack.Screen name="revenue" options={{ title: 'Revenue' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
