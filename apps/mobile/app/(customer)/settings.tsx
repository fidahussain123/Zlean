import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, radius, shadow } from '@/constants/theme';

export default function CustomerSettingsScreen() {
  const router = useRouter();

  async function doLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  function handleLogout() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) {
        doLogout();
      }
    } else {
      Alert.alert('Log out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: doLogout },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtle}>Account preferences</Text>
      </View>
      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.btnPressed]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutBtnText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.container },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.lg,
    ...shadow.tile,
  },
  title: { fontSize: 18, color: colors.text, fontWeight: '700' },
  subtle: { fontSize: 14, color: colors.textSubtle, marginTop: spacing.sm },
  logoutBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPressed: { transform: [{ scale: 0.98 }] },
  logoutBtnText: { color: colors.text, fontWeight: '600' },
});
