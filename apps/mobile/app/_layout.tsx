import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { getStoredUser, type AuthUser } from '@/services/api';
import { AuthContext } from '@/contexts/auth';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getStoredUser();
      setUser(u);
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, setUser }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(super-admin)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(worker)" />
        <Stack.Screen name="(customer)" />
      </Stack>
    </AuthContext.Provider>
  );
}
