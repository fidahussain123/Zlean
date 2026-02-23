import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { authApi, setSession } from '@/services/api';
import { colors, spacing, radius, typography, shadow } from '@/constants/theme';

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await authApi.signupCustomer(trimmedEmail, password, trimmedName);
      await setSession(token, user);
      router.replace('/(customer)/tracker');
    } catch (e) {
      let message = e instanceof Error ? e.message : 'Something went wrong';
      if (message === 'fetch failed' || message.includes('Network')) {
        message = 'Cannot reach server. Check your connection and that the backend is running.';
      }
      Alert.alert('Sign up failed', message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <Text style={styles.subtitle}>Customer sign up</Text>
      <View style={styles.tile}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={colors.textSubtle}
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.textSubtle}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.textSubtle}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>{loading ? 'Creating…' : 'Sign up'}</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  title: { fontSize: 24, color: colors.text, ...typography.headingBold, marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.lg },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    ...shadow.tile,
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
});
