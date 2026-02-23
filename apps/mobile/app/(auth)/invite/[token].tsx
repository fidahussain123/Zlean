import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { setSession } from '@/services/api';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, radius, shadow } from '@/constants/theme';
import { API_URL } from '@/constants/api';

interface InviteValidation {
  email: string;
  valid: boolean;
}

interface AcceptResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin';
    shopId: string;
  };
  shop: {
    id: string;
    name: string;
    address?: string;
    phone?: string;
  };
}

export default function InviteAcceptScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { setUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link');
      setLoading(false);
      setValidating(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_URL}/invites/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Invalid invite');
          setValidating(false);
          setLoading(false);
          return;
        }

        const validation = data as InviteValidation;
        if (validation.valid) {
          setInviteEmail(validation.email);
        } else {
          setError('This invite is no longer valid');
        }
      } catch {
        setError('Failed to validate invite');
      } finally {
        setValidating(false);
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async () => {
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    if (!shopName.trim()) {
      setFormError('Please enter your shop name');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/invites/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          password,
          shopName: shopName.trim(),
          shopAddress: shopAddress.trim() || undefined,
          shopPhone: shopPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create account');
        setSubmitting(false);
        return;
      }

      const result = data as AcceptResponse;
      await setSession(result.token, result.user);
      setUser(result.user);
      router.replace('/(admin)/dashboard');
    } catch {
      setFormError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || validating) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Validating invite...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorTile}>
          <Text style={styles.errorTitle}>Unable to Continue</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={({ pressed }) => [styles.loginBtn, pressed && styles.btnPressed]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>zLean</Text>
          <Text style={styles.title}>Set Up Your Shop</Text>
          <Text style={styles.subtitle}>
            Welcome! Complete your account setup for {inviteEmail}
          </Text>
        </View>

        <View style={styles.formTile}>
          <Text style={styles.sectionTitle}>Your Account</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor={colors.textSubtle}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!submitting}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textSubtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!submitting}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textSubtle}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!submitting}
          />
        </View>

        <View style={styles.formTile}>
          <Text style={styles.sectionTitle}>Shop Details</Text>

          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="My Car Wash"
            placeholderTextColor={colors.textSubtle}
            value={shopName}
            onChangeText={setShopName}
            editable={!submitting}
          />

          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main Street, City"
            placeholderTextColor={colors.textSubtle}
            value={shopAddress}
            onChangeText={setShopAddress}
            editable={!submitting}
          />

          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 8900"
            placeholderTextColor={colors.textSubtle}
            value={shopPhone}
            onChangeText={setShopPhone}
            keyboardType="phone-pad"
            editable={!submitting}
          />
        </View>

        {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            submitting && styles.submitBtnDisabled,
            pressed && !submitting && styles.btnPressed,
          ]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.submitBtnText}>Create Account & Shop</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backLink}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.backLinkText}>Already have an account? Log in</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.container, paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.container },
  loadingText: { marginTop: spacing.md, color: colors.textSubtle, fontSize: 14 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 32, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', lineHeight: 20 },
  formTile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.lg,
    ...shadow.tile,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: spacing.md },
  label: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 },
  input: {
    backgroundColor: colors.background,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  formErrorText: { color: '#EF4444', fontSize: 14, marginBottom: spacing.md, textAlign: 'center' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    padding: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  btnPressed: { transform: [{ scale: 0.98 }] },
  backLink: { alignItems: 'center', padding: spacing.md },
  backLinkText: { color: colors.textSubtle, fontSize: 14 },
  errorTile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 360,
    ...shadow.tile,
  },
  errorTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 12 },
  errorMessage: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  loginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  loginBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
});
