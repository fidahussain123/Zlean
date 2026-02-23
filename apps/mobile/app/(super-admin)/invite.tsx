import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import { api } from '@/services/api';
import { colors, spacing, radius, shadow } from '@/constants/theme';

interface Invite {
  id: string;
  email: string;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  createdByName?: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#F59E0B';
    case 'accepted':
      return '#10B981';
    case 'expired':
      return '#6B7280';
    case 'revoked':
      return '#EF4444';
    default:
      return colors.textSubtle;
  }
}

export default function InviteScreen() {
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadInvites = useCallback(async () => {
    try {
      const data = await api<Invite[]>('/invites');
      setInvites(Array.isArray(data) ? data : []);
    } catch {
      setInvites([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await loadInvites();
      setLoading(false);
    })();
  }, [loadInvites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvites();
    setRefreshing(false);
  };

  const handleSendInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSuccess('');
    setSending(true);

    try {
      await api<{ id: string }>('/invites', {
        method: 'POST',
        body: { email: trimmed },
      });
      setSuccess(`Invite sent to ${trimmed}`);
      setEmail('');
      await loadInvites();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (invite: Invite) => {
    const doResend = async () => {
      try {
        await api(`/invites/${invite.id}/resend`, { method: 'POST' });
        setSuccess(`Invite resent to ${invite.email}`);
        await loadInvites();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to resend invite');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Resend invite to ${invite.email}?`)) {
        doResend();
      }
    } else {
      Alert.alert('Resend Invite', `Resend invite to ${invite.email}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resend', onPress: doResend },
      ]);
    }
  };

  const handleRevoke = async (invite: Invite) => {
    const doRevoke = async () => {
      try {
        await api(`/invites/${invite.id}`, { method: 'DELETE' });
        setSuccess('Invite revoked');
        await loadInvites();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to revoke invite');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Revoke invite for ${invite.email}? They will no longer be able to sign up.`)) {
        doRevoke();
      }
    } else {
      Alert.alert('Revoke Invite', `Revoke invite for ${invite.email}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: doRevoke },
      ]);
    }
  };

  const renderInvite = ({ item }: { item: Invite }) => (
    <View style={styles.tile}>
      <View style={styles.inviteHeader}>
        <Text style={styles.email}>{item.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>
        Sent {formatDate(item.createdAt)}
        {item.status === 'pending' && ` · Expires ${formatDate(item.expiresAt)}`}
        {item.status === 'accepted' && item.acceptedAt && ` · Accepted ${formatDate(item.acceptedAt)}`}
      </Text>

      {(item.status === 'pending' || item.status === 'expired') && (
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.btnPressed]}
            onPress={() => handleResend(item)}
          >
            <Text style={styles.actionBtnText}>Resend</Text>
          </Pressable>
          {item.status === 'pending' && (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.revokeBtn, pressed && styles.btnPressed]}
              onPress={() => handleRevoke(item)}
            >
              <Text style={[styles.actionBtnText, styles.revokeText]}>Revoke</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formTile}>
        <Text style={styles.title}>Invite Shop Owner</Text>
        <Text style={styles.subtitle}>
          Enter the email of a car wash shop owner. They'll receive an email to set up their account.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="owner@example.com"
          placeholderTextColor={colors.textSubtle}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!sending}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            sending && styles.sendBtnDisabled,
            pressed && !sending && styles.btnPressed,
          ]}
          onPress={handleSendInvite}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Text style={styles.sendBtnText}>Send Invite</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Sent Invites</Text>

      <FlatList
        data={invites}
        keyExtractor={(item) => item.id}
        renderItem={renderInvite}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.emptyText}>No invites sent yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formTile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    margin: spacing.container,
    marginBottom: spacing.md,
    ...shadow.tile,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.textSubtle, marginBottom: spacing.md, lineHeight: 20 },
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
  errorText: { color: '#EF4444', fontSize: 14, marginBottom: spacing.sm },
  successText: { color: '#10B981', fontSize: 14, marginBottom: spacing.sm },
  sendBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    padding: 16,
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.6 },
  sendBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  btnPressed: { transform: [{ scale: 0.98 }] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: spacing.container,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.container, paddingBottom: spacing.lg },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.tile,
    marginBottom: spacing.md,
    ...shadow.tile,
  },
  inviteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  email: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, color: colors.textSubtle, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    backgroundColor: colors.background,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  actionBtnText: { fontSize: 14, fontWeight: '500', color: colors.text },
  revokeBtn: { borderColor: '#EF4444' },
  revokeText: { color: '#EF4444' },
  emptyText: { fontSize: 14, color: colors.textSubtle, textAlign: 'center', marginTop: spacing.lg },
});
