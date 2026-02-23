import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from '../middleware/auth.js';
import type { Role } from '../db/turso.js';

const router = Router();

function createToken(userId: string, role: Role): string {
  return Buffer.from(JSON.stringify({ userId, role, t: Date.now() }), 'utf8').toString('base64url');
}

router.post('/login', async (req, res) => {
  const body = req.body || {};
  const login = (body.login ?? body.email ?? body.phone ?? '').toString().trim();
  const password = body.password;
  if (!login || !password) {
    return res.status(400).json({ error: 'Email or phone and password required' });
  }

  if (login === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
    const row = await db.execute({
      sql: 'SELECT id, name, email, role FROM users WHERE email = ? AND role = ?',
      args: [SUPER_ADMIN_EMAIL, 'super_admin'],
    });
    if (row.rows.length > 0) {
      const u = row.rows[0];
      return res.json({
        token: createToken(u.id as string, 'super_admin'),
        user: { id: u.id, name: u.name, email: u.email, role: 'super_admin' },
      });
    }
  }

  const adminRow = await db.execute({
    sql: 'SELECT id, name, email, role, shop_id, password_hash FROM users WHERE email = ? AND role = ? AND status = ?',
    args: [login, 'admin', 'active'],
  });
  if (adminRow.rows.length > 0) {
    const u = adminRow.rows[0];
    const hash = u.password_hash as string;
    if (hash && (await bcrypt.compare(password, hash))) {
      return res.json({
        token: createToken(u.id as string, 'admin'),
        user: { id: u.id, name: u.name, email: u.email, role: 'admin', shopId: u.shop_id },
      });
    }
  }

  const norm = login.replace(/\D/g, '').slice(-10);
  const workerRow = await db.execute({
    sql: 'SELECT id, name, phone, email, role, shop_id, password_hash FROM users WHERE (phone = ? OR phone = ? OR email = ?) AND role = ? AND status = ?',
    args: [login, norm, login, 'worker', 'active'],
  });
  if (workerRow.rows.length > 0) {
    const u = workerRow.rows[0];
    const hash = u.password_hash as string;
    if (hash && (await bcrypt.compare(password, hash))) {
      return res.json({
        token: createToken(u.id as string, 'worker'),
        user: { id: u.id, name: u.name, phone: u.phone, email: u.email, role: 'worker', shopId: u.shop_id },
      });
    }
  }

  const customerRow = await db.execute({
    sql: 'SELECT id, name, email, role, password_hash FROM users WHERE email = ? AND role = ? AND status = ?',
    args: [login, 'customer', 'active'],
  });
  if (customerRow.rows.length > 0) {
    const u = customerRow.rows[0];
    const hash = u.password_hash as string;
    if (hash && (await bcrypt.compare(password, hash))) {
      return res.json({
        token: createToken(u.id as string, 'customer'),
        user: { id: u.id, name: u.name, email: u.email, role: 'customer' },
      });
    }
  }

  return res.status(401).json({ error: 'Invalid email/phone or password' });
});

router.post('/signup/customer', async (req, res) => {
  const { email, password, name } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const nameStr = typeof name === 'string' ? name.trim() : '';
  const pass = typeof password === 'string' ? password : '';
  if (!emailStr || !pass || !nameStr) {
    return res.status(400).json({ error: 'Email, password and name required' });
  }
  if (pass.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ?',
    args: [emailStr],
  });
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const id = uuidv4();
  const password_hash = await bcrypt.hash(pass, 12);
  await db.execute({
    sql: 'INSERT INTO users (id, name, email, role, password_hash, status) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, nameStr, emailStr, 'customer', password_hash, 'active'],
  });
  const token = createToken(id, 'customer');
  return res.status(201).json({
    token,
    user: { id, name: nameStr, email: emailStr, role: 'customer' },
  });
});

export default router;
