import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/turso.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendInviteEmail } from '../services/email.js';

const router = Router();

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function createAuthToken(userId: string, role: string): string {
  return Buffer.from(JSON.stringify({ userId, role, t: Date.now() }), 'utf8').toString('base64url');
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

  const existingUser = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? AND role = ?',
    args: [emailStr, 'admin'],
  });
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ error: 'This email is already registered as a shop owner' });
  }

  const pendingInvite = await db.execute({
    sql: "SELECT id, expires_at FROM invites WHERE email = ? AND status = 'pending'",
    args: [emailStr],
  });
  if (pendingInvite.rows.length > 0) {
    const inv = pendingInvite.rows[0];
    if (!isExpired(inv.expires_at as string)) {
      return res.status(409).json({ error: 'An active invite already exists for this email' });
    }
    await db.execute({
      sql: "UPDATE invites SET status = 'expired' WHERE id = ?",
      args: [inv.id],
    });
  }

  const id = uuidv4();
  const token = generateToken();
  const expiresAt = getExpiresAt();
  const createdBy = req.auth!.userId;

  await db.execute({
    sql: 'INSERT INTO invites (id, email, token, status, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, emailStr, token, 'pending', createdBy, expiresAt],
  });

  const inviterRow = await db.execute({
    sql: 'SELECT name FROM users WHERE id = ?',
    args: [createdBy],
  });
  const inviterName = inviterRow.rows[0]?.name as string || 'zLean Admin';

  const emailSent = await sendInviteEmail({ to: emailStr, token, inviterName });

  return res.status(201).json({
    id,
    email: emailStr,
    token,
    status: 'pending',
    expiresAt,
    emailSent,
  });
});

router.get('/', requireAuth, requireRole('super_admin'), async (_req, res) => {
  const now = new Date().toISOString();
  await db.execute({
    sql: "UPDATE invites SET status = 'expired' WHERE status = 'pending' AND expires_at < ?",
    args: [now],
  });

  const result = await db.execute({
    sql: `SELECT i.id, i.email, i.token, i.status, i.created_at, i.expires_at, i.accepted_at, u.name as created_by_name
          FROM invites i
          LEFT JOIN users u ON i.created_by = u.id
          ORDER BY i.created_at DESC`,
    args: [],
  });

  const invites = result.rows.map(row => ({
    id: row.id,
    email: row.email,
    token: row.token,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdByName: row.created_by_name,
  }));

  return res.json(invites);
});

router.post('/check-email', async (req, res) => {
  const { email } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!emailStr || !emailStr.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const result = await db.execute({
    sql: "SELECT id, email, token, status, expires_at FROM invites WHERE email = ? AND status = 'pending'",
    args: [emailStr],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'No invitation found for this email. Contact your administrator to get an invite.' });
  }

  const invite = result.rows[0];

  if (isExpired(invite.expires_at as string)) {
    await db.execute({
      sql: "UPDATE invites SET status = 'expired' WHERE id = ?",
      args: [invite.id],
    });
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

  const result = await db.execute({
    sql: "SELECT id, email, status, expires_at FROM invites WHERE token = ?",
    args: [token],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invalid invite link' });
  }

  const invite = result.rows[0];

  if (invite.status === 'accepted') {
    return res.status(410).json({ error: 'This invite has already been used' });
  }

  if (invite.status === 'revoked') {
    return res.status(410).json({ error: 'This invite has been revoked' });
  }

  if (isExpired(invite.expires_at as string)) {
    await db.execute({
      sql: "UPDATE invites SET status = 'expired' WHERE id = ?",
      args: [invite.id],
    });
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

  const inviteResult = await db.execute({
    sql: "SELECT id, email, status, expires_at FROM invites WHERE token = ?",
    args: [token],
  });

  if (inviteResult.rows.length === 0) {
    return res.status(404).json({ error: 'Invalid invite link' });
  }

  const invite = inviteResult.rows[0];

  if (invite.status !== 'pending') {
    return res.status(410).json({ error: `This invite is ${invite.status}` });
  }

  if (isExpired(invite.expires_at as string)) {
    await db.execute({
      sql: "UPDATE invites SET status = 'expired' WHERE id = ?",
      args: [invite.id],
    });
    return res.status(410).json({ error: 'This invite has expired' });
  }

  const shopId = uuidv4();
  const userId = uuidv4();
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  await db.execute({
    sql: 'INSERT INTO shops (id, name, address, phone, owner_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    args: [shopId, shopName.trim(), shopAddress?.trim() || null, shopPhone?.trim() || null, userId, 'active'],
  });

  await db.execute({
    sql: 'INSERT INTO users (id, name, email, role, shop_id, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [userId, name.trim(), invite.email, 'admin', shopId, passwordHash, 'active'],
  });

  await db.execute({
    sql: "UPDATE invites SET status = 'accepted', accepted_at = ? WHERE id = ?",
    args: [now, invite.id],
  });

  const authToken = createAuthToken(userId, 'admin');

  return res.status(201).json({
    token: authToken,
    user: {
      id: userId,
      name: name.trim(),
      email: invite.email,
      role: 'admin',
      shopId,
    },
    shop: {
      id: shopId,
      name: shopName.trim(),
      address: shopAddress?.trim() || null,
      phone: shopPhone?.trim() || null,
    },
  });
});

router.post('/:id/resend', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { id } = req.params;

  const result = await db.execute({
    sql: "SELECT id, email, status, expires_at FROM invites WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  const invite = result.rows[0];

  if (invite.status === 'accepted') {
    return res.status(400).json({ error: 'Cannot resend an accepted invite' });
  }

  const newToken = generateToken();
  const newExpiresAt = getExpiresAt();

  await db.execute({
    sql: "UPDATE invites SET token = ?, expires_at = ?, status = 'pending' WHERE id = ?",
    args: [newToken, newExpiresAt, id],
  });

  const inviterRow = await db.execute({
    sql: 'SELECT name FROM users WHERE id = ?',
    args: [req.auth!.userId],
  });
  const inviterName = inviterRow.rows[0]?.name as string || 'zLean Admin';

  const emailSent = await sendInviteEmail({ to: invite.email as string, token: newToken, inviterName });

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

  const result = await db.execute({
    sql: "SELECT id, status FROM invites WHERE id = ?",
    args: [id],
  });

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Invite not found' });
  }

  const invite = result.rows[0];

  if (invite.status === 'accepted') {
    return res.status(400).json({ error: 'Cannot revoke an accepted invite' });
  }

  await db.execute({
    sql: "UPDATE invites SET status = 'revoked' WHERE id = ?",
    args: [id],
  });

  return res.json({ success: true });
});

export default router;
