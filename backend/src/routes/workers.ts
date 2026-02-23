import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id : req.auth!.shopId;
  if (!shopId && req.auth!.role !== 'super_admin') return res.json([]);
  const sql = shopId
    ? 'SELECT id, name, phone, role, shop_id, status, created_at FROM users WHERE role = ? AND shop_id = ? ORDER BY created_at DESC'
    : 'SELECT id, name, phone, role, shop_id, status, created_at FROM users WHERE role = ? ORDER BY created_at DESC';
  const args = shopId ? ['worker', shopId] : ['worker'];
  const r = await db.execute({ sql, args: args as string[] });
  res.json(r.rows);
});

router.post('/', requireAdminOrSuper, async (req, res) => {
  const { name, phone, password, shop_id } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  if (!shopId) return res.status(400).json({ error: 'Shop required' });
  const id = uuidv4();
  const password_hash = password ? await bcrypt.hash(password, 12) : null;
  await db.execute({
    sql: 'INSERT INTO users (id, name, phone, role, shop_id, password_hash, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, name, phone, 'worker', shopId, password_hash, 'active'],
  });
  const r = await db.execute({ sql: 'SELECT id, name, phone, role, shop_id, status, created_at FROM users WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { name, phone, password, status } = req.body || {};
  const r = await db.execute({ sql: 'SELECT shop_id FROM users WHERE id = ? AND role = ?', args: [id, 'worker'] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (req.auth!.role === 'admin' && (r.rows[0].shop_id as string) !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const updates: string[] = [];
  const args: unknown[] = [];
  if (name !== undefined) { updates.push('name = ?'); args.push(name); }
  if (phone !== undefined) { updates.push('phone = ?'); args.push(phone); }
  if (status !== undefined) { updates.push('status = ?'); args.push(status); }
  if (password !== undefined && password) {
    updates.push('password_hash = ?');
    args.push(await bcrypt.hash(password, 12));
  }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  args.push(id);
  await db.execute({ sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`, args });
  const out = await db.execute({ sql: 'SELECT id, name, phone, role, shop_id, status, created_at FROM users WHERE id = ?', args: [id] });
  res.json(out.rows[0]);
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const r = await db.execute({ sql: 'SELECT shop_id FROM users WHERE id = ? AND role = ?', args: [id, 'worker'] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (req.auth!.role === 'admin' && (r.rows[0].shop_id as string) !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await db.execute({ sql: 'UPDATE users SET status = ? WHERE id = ?', args: ['inactive', id] });
  res.status(204).send();
});

export default router;
