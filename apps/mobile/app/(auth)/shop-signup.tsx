import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { colors, spacing, radius, shadow } from '@/constants/theme';

type Step = 'email' | 'onboarding';

export default function ShopOwnerSignup() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  // Step 2: Onboarding
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');

  const handleCheckEmail = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('email', trimmed)
        .eq('status', 'pending')
        .single();

      if (error || !data) {
        setError('No pending invitation found for this email');
        setLoading(false);
        return;
      }

      setInviteToken(data.token);
      setStep('onboarding');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!shopName.trim()) {
      setError('Please enter your shop name');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            role: 'admin',
          }
        }
      });

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create account');
      }

      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .insert({
          name: shopName.trim(),
          address: shopAddress.trim() || null,
          phone: shopPhone.trim() || null,
          owner_id: authData.user.id
        })
        .select('id')
        .single();

      if (shopError) {
        console.error('Failed to create shop', shopError);
      }

      if (shopData) {
        await supabase
          .from('profiles')
          .update({ shop_id: shopData.id })
          .eq('id', authData.user.id);
      }

      supabase
        .from('invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('token', inviteToken)
        .then();

      router.replace('/(admin)/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'email') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>zLean</Text>
          <Text style={styles.title}>Shop Owner Signup</Text>
          <Text style={styles.subtitle}>
            Enter the email your administrator used to invite you
          </Text>
        </View>

        <View style={styles.formTile}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="owner@example.com"
            placeholderTextColor={colors.textSubtle}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              loading && styles.btnDisabled,
              pressed && !loading && styles.btnPressed,
            ]}
            onPress={handleCheckEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.primaryBtnText}>Continue</Text>
            )}
          </Pressable>
        </View>

        <Pressable
          style={styles.backLink}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.backLinkText}>Already have an account? Log in</Text>
        </Pressable>
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
            Complete your account setup for {email}
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
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textSubtle}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Re-enter password"
            placeholderTextColor={colors.textSubtle}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
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
            editable={!loading}
          />

          <Text style={styles.label}>Address (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main Street, City"
            placeholderTextColor={colors.textSubtle}
            value={shopAddress}
            onChangeText={setShopAddress}
            editable={!loading}
          />

          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 234 567 8900"
            placeholderTextColor={colors.textSubtle}
            value={shopPhone}
            onChangeText={setShopPhone}
            keyboardType="phone-pad"
            editable={!loading}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.primaryBtn,
            loading && styles.btnDisabled,
            pressed && !loading && styles.btnPressed,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account & Shop</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.backLink}
          onPress={() => setStep('email')}
        >
          <Text style={styles.backLinkText}>Use a different email</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.container, paddingBottom: 60 },
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.container, justifyContent: 'center' },
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
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: spacing.md, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    padding: 18,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  btnPressed: { transform: [{ scale: 0.98 }] },
  backLink: { alignItems: 'center', padding: spacing.md },
  backLinkText: { color: colors.textSubtle, fontSize: 14 },
});
