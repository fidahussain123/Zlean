import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireSuperAdmin, requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireSuperAdmin, async (req, res) => {
  const r = await db.execute({
    sql: 'SELECT id, name, email, role, shop_id, status, created_at FROM users WHERE role = ? ORDER BY created_at DESC',
    args: ['admin'],
  });
  res.json(r.rows);
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, email, password, shop_id } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  if (!shop_id) return res.status(400).json({ error: 'shop_id required' });
  const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
  if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already used' });
  const id = uuidv4();
  const password_hash = password ? await bcrypt.hash(password, 12) : null;
  await db.execute({
    sql: 'INSERT INTO users (id, name, email, role, shop_id, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, name, email, 'admin', shop_id, password_hash, 'active'],
  });
  const r = await db.execute({
    sql: 'SELECT id, name, email, role, shop_id, status, created_at FROM users WHERE id = ?',
    args: [id],
  });
  res.status(201).json(r.rows[0]);
});

router.patch('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, shop_id, status } = req.body || {};
  const r = await db.execute({ sql: 'SELECT id FROM users WHERE id = ? AND role = ?', args: [id, 'admin'] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const updates: string[] = [];
  const args: unknown[] = [];
  if (name !== undefined) { updates.push('name = ?'); args.push(name); }
  if (email !== undefined) { updates.push('email = ?'); args.push(email); }
  if (shop_id !== undefined) { updates.push('shop_id = ?'); args.push(shop_id); }
  if (status !== undefined) { updates.push('status = ?'); args.push(status); }
  if (password !== undefined && password) {
    updates.push('password_hash = ?');
    args.push(await bcrypt.hash(password, 12));
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  args.push(id);
  await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
  const out = await db.execute({
    sql: 'SELECT id, name, email, role, shop_id, status, created_at FROM users WHERE id = ?',
    args: [id],
  });
  res.json(out.rows[0]);
});

export default router;
