import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

export default function Login() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const id = loginId.trim();
    if (!id || !password) {
      Alert.alert('Error', 'Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: id,
        password: password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        if (profileError) throw profileError;

        switch (profile.role) {
          case 'super_admin':
            router.replace('/(super-admin)/dashboard');
            break;
          case 'admin':
            router.replace('/(admin)/dashboard');
            break;
          case 'worker':
            router.replace('/(worker)/queue');
            break;
          case 'customer':
            router.replace('/(customer)/tracker');
            break;
          default:
            router.replace('/(auth)/login');
        }
      }
    } catch (e) {
      Alert.alert('Login failed', e instanceof Error ? e.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>zZLean</Text>
      <Text style={styles.subtitle}>Car Wash Management</Text>
      <View style={styles.tile}>
        <Text style={styles.tileTitle}>Sign in</Text>
        <TextInput
          style={styles.input}
          placeholder="Email or phone"
          placeholderTextColor={colors.textSubtle}
          value={loginId}
          onChangeText={setLoginId}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textSubtle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(auth)/signup')} disabled={loading}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(auth)/shop-signup')} disabled={loading}>
          <Text style={styles.shopLinkText}>Shop Owner? Register your shop</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.container,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    color: colors.text,
    ...typography.headingBold,
    letterSpacing: -0.02,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSubtle,
    marginBottom: spacing.xl,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
  },
  tileTitle: {
    fontSize: 14,
    color: colors.textSubtle,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.button,
    padding: 16,
    marginBottom: spacing.sm,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtn: {
    backgroundColor: colors.accentBlack,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  primaryBtnText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  linkBtn: { marginTop: spacing.md, alignSelf: 'center' },
  linkText: { color: colors.textSubtle, fontSize: 14 },
  shopLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
