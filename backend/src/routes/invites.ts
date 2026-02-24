import { Router } from 'express';
import crypto from 'crypto';
import { supabase, supabaseAdmin } from '../db/supabase.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendInviteEmail } from '../services/email.js';

const router = Router();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function getExpiresAt(): string {
  const date = new Date();
  date.setHours(date.getHours() + 48);
  return date.toISOString();
}

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

router.post('/', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { email } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!emailStr || !emailStr.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', emailStr)
    .eq('role', 'admin')
    .single();

  if (existingUser) {
    return res.status(409).json({ error: 'This email is already registered as a shop owner' });
  }

  const { data: pendingInvite } = await supabase
    .from('invites')
    .select('id, expires_at')
    .eq('email', emailStr)
    .eq('status', 'pending')
    .single();

  if (pendingInvite) {
    if (!isExpired(pendingInvite.expires_at)) {
      return res.status(409).json({ error: 'An active invite already exists for this email' });
    }
    await supabase
      .from('invites')
      .update({ status: 'expired' })
      .eq('id', pendingInvite.id);
  }

  const token = generateToken();
  const expiresAt = getExpiresAt();
  const createdBy = req.auth!.userId;

  const { data: invite, error } = await supabase
    .from('invites')
    .insert({
      email: emailStr,
      token,
      status: 'pending',
      created_by: createdBy,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const { data: inviter } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', createdBy)
    .single();

  const inviterName = inviter?.name || 'zLean Admin';

  const emailSent = await sendInviteEmail({ to: emailStr, token, inviterName });

  return res.status(201).json({
    id: invite.id,
    email: emailStr,
    token,
    status: 'pending',
    expiresAt,
    emailSent,
  });
});

router.get('/', requireAuth, requireRole('super_admin'), async (_req, res) => {
  const now = new Date().toISOString();
  
  await supabase
    .from('invites')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('expires_at', now);

  const { data: invites, error } = await supabase
    .from('invites')
    .select(`
      id,
      email,
      token,
      status,
      created_at,
      expires_at,
      accepted_at,
      profiles!invites_created_by_fkey(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const mappedInvites = (invites || []).map(row => ({
    id: row.id,
    email: row.email,
    token: row.token,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdByName: (row.profiles as { name: string } | null)?.name || 'Unknown',
  }));

  return res.json(mappedInvites);
});

router.post('/check-email', async (req, res) => {
  const { email } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!emailStr || !emailStr.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const { data: invite } = await supabase
    .from('invites')
    .select('id, email, token, status, expires_at')
    .eq('email', emailStr)
    .eq('status', 'pending')
    .single();

  if (!invite) {
    return res.status(404).json({ error: 'No invitation found for this email. Contact your administrator to get an invite.' });
  }

  if (isExpired(invite.expires_at)) {
    await supabase
      .from('invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return res.status(410).json({ error: 'Your invitation has expired. Please contact your administrator for a new invite.' });
  }

  return res.json({
    hasInvite: true,
    token: invite.token,
    email: invite.email,
  });
});

router.get('/:token', async (req, res) => {
  const { token } = req.params;

  const { data: invite } = await supabase
    .from('invites')
    .select('id, email, status, expires_at')
    .eq('token', token)
    .single();

  if (!invite) {
    return res.status(404).json({ error: 'Invalid invite link' });
  }

  if (invite.status === 'accepted') {
    return res.status(410).json({ error: 'This invite has already been used' });
  }

  if (invite.status === 'revoked') {
    return res.status(410).json({ error: 'This invite has been revoked' });
  }

  if (isExpired(invite.expires_at)) {
    await supabase
      .from('invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return res.status(410).json({ error: 'This invite has expired' });
  }

  return res.json({
    email: invite.email,
    valid: true,
  });
});

router.post('/:token/accept', async (req, res) => {
  const { token } = req.params;
  const { password, name, shopName, shopAddress, shopPhone } = req.body || {};

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!shopName || typeof shopName !== 'string' || !shopName.trim()) {
    return res.status(400).json({ error: 'Shop name is required' });
  }

  const { data: invite } = await supabase
    .from('invites')
    .select('id, email, status, expires_at')
    .eq('token', token)
    .single();

  if (!invite) {
    return res.status(404).json({ error: 'Invalid invite link' });
  }

  if (invite.status !== 'pending') {
    return res.status(410).json({ error: `This invite is ${invite.status}` });
  }

  if (isExpired(invite.expires_at)) {
    await supabase
      .from('invites')
      .update({ status: 'expired' })
      .eq('id', invite.id);
    return res.status(410).json({ error: 'This invite has expired' });
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: invite.email,
    password: password,
    email_confirm: true,
    user_metadata: {
      name: name.trim(),
      role: 'admin',
    },
  });

  if (authError) {
    return res.status(400).json({ error: authError.message });
  }

  const userId = authData.user.id;

  const { data: shop, error: shopError } = await supabase
    .from('shops')
    .insert({
      name: shopName.trim(),
      address: shopAddress?.trim() || null,
      phone: shopPhone?.trim() || null,
      owner_id: userId,
      status: 'active',
    })
    .select()
    .single();

  if (shopError) {
    return res.status(500).json({ error: shopError.message });
  }

  await supabase
    .from('profiles')
    .update({ shop_id: shop.id })
    .eq('id', userId);

  await supabase
    .from('invites')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  const { data: sessionData } = await supabase.auth.signInWithPassword({
    email: invite.email,
    password: password,
  });

  return res.status(201).json({
    token: sessionData.session?.access_token,
    user: {
      id: userId,
      name: name.trim(),
      email: invite.email,
      role: 'admin',
      shopId: shop.id,
    },
    shop: {
      id: shop.id,
      name: shopName.trim(),
      address: shopAddress?.trim() || null,
      phone: shopPhone?.trim() || null,
    },
  });
});

router.post('/:id/resend', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params;

  const { data: invite } = await supabase
    .from('invites')
    .select('id, email, status, expires_at')
    .eq('id', id)
    .single();

  if (!invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  if (invite.status === 'accepted') {
    return res.status(400).json({ error: 'Cannot resend an accepted invite' });
  }

  const newToken = generateToken();
  const newExpiresAt = getExpiresAt();

  await supabase
    .from('invites')
    .update({ token: newToken, expires_at: newExpiresAt, status: 'pending' })
    .eq('id', id);

  const { data: inviter } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', req.auth!.userId)
    .single();

  const inviterName = inviter?.name || 'zLean Admin';

  const emailSent = await sendInviteEmail({ to: invite.email, token: newToken, inviterName });

  return res.json({
    id,
    email: invite.email,
    token: newToken,
    status: 'pending',
    expiresAt: newExpiresAt,
    emailSent,
  });
});

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params;

  const { data: invite } = await supabase
    .from('invites')
    .select('id, status')
    .eq('id', id)
    .single();

  if (!invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  if (invite.status === 'accepted') {
    return res.status(400).json({ error: 'Cannot revoke an accepted invite' });
  }

  await supabase
    .from('invites')
    .update({ status: 'revoked' })
    .eq('id', id);

  return res.json({ success: true });
});

export default router;
