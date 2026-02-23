import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id : req.auth!.shopId;
  if (!shopId && req.auth!.role !== 'super_admin') return res.json([]);
  const sql = shopId
    ? 'SELECT * FROM service_packages WHERE shop_id = ? ORDER BY name'
    : 'SELECT * FROM service_packages ORDER BY shop_id, name';
  const args = shopId ? [shopId] : [];
  const r = await db.execute({ sql, args: args as string[] });
  res.json(r.rows);
});

router.post('/', requireAdminOrSuper, async (req, res) => {
  const { name, description, price, duration_minutes, shop_id } = req.body || {};
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  if (!shopId || !name || price == null) return res.status(400).json({ error: 'shop_id, name and price required' });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO service_packages (id, shop_id, name, description, price, duration_minutes, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    args: [id, shopId, name, description ?? null, Number(price), duration_minutes != null ? Number(duration_minutes) : null],
  });
  const r = await db.execute({ sql: 'SELECT * FROM service_packages WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration_minutes, is_active } = req.body || {};
  const r = await db.execute({ sql: 'SELECT shop_id FROM service_packages WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (req.auth!.role === 'admin' && (r.rows[0].shop_id as string) !== req.auth!.shopId) return res.status(403).json({ error: 'Forbidden' });
  const updates: string[] = [];
  const args: unknown[] = [];
  if (name !== undefined) { updates.push('name = ?'); args.push(name); }
  if (description !== undefined) { updates.push('description = ?'); args.push(description); }
  if (price !== undefined) { updates.push('price = ?'); args.push(Number(price)); }
  if (duration_minutes !== undefined) { updates.push('duration_minutes = ?'); args.push(duration_minutes); }
  if (is_active !== undefined) { updates.push('is_active = ?'); args.push(is_active ? 1 : 0); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  args.push(id);
  await db.execute({ sql: `UPDATE service_packages SET ${updates.join(', ')} WHERE id = ?`, args });
  const out = await db.execute({ sql: 'SELECT * FROM service_packages WHERE id = ?', args: [id] });
  res.json(out.rows[0]);
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const r = await db.execute({ sql: 'SELECT shop_id FROM service_packages WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (req.auth!.role === 'admin' && (r.rows[0].shop_id as string) !== req.auth!.shopId) return res.status(403).json({ error: 'Forbidden' });
  await db.execute({ sql: 'DELETE FROM service_packages WHERE id = ?', args: [id] });
  res.status(204).send();
});

export default router;
