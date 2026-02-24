import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { configureGoogleSignIn, signInWithGoogle, isGoogleSignInAvailable } from '@/lib/google-auth';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

export default function Login() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const showGoogleAuth = isGoogleSignInAvailable();

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

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

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        if (result.error !== 'Sign in cancelled') {
          Alert.alert('Google Sign-In failed', result.error || 'Unknown error');
        }
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
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
            default:
              router.replace('/(customer)/tracker');
              break;
          }
        } else {
          router.replace('/(customer)/tracker');
        }
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setGoogleLoading(false);
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
          disabled={loading || googleLoading}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>

        {showGoogleAuth && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [styles.googleBtn, pressed && styles.btnPressed]}
              onPress={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              <Text style={styles.googleBtnText}>
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </Text>
            </Pressable>
          </>
        )}

        <Pressable style={styles.linkBtn} onPress={() => router.push('/(auth)/signup')} disabled={loading || googleLoading}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.push('/(auth)/shop-signup')} disabled={loading || googleLoading}>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSubtle,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
  },
  googleBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  linkBtn: { marginTop: spacing.md, alignSelf: 'center' },
  linkText: { color: colors.textSubtle, fontSize: 14 },
  shopLinkText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
});
