import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { requireAuth, attachAuth } from '../middleware/auth.js';
import { requireSuperAdmin, requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  if (req.auth!.role === 'super_admin') {
    const r = await db.execute({ sql: 'SELECT * FROM shops ORDER BY created_at DESC', args: [] });
    return res.json(r.rows);
  }
  if (req.auth!.shopId) {
    const r = await db.execute({ sql: 'SELECT * FROM shops WHERE id = ?', args: [req.auth.shopId] });
    return res.json(r.rows);
  }
  return res.json([]);
});

router.get('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  if (req.auth!.role !== 'super_admin' && req.auth!.shopId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const r = await db.execute({ sql: 'SELECT * FROM shops WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json(r.rows[0]);
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, address, phone, owner_id, plan } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO shops (id, name, address, phone, owner_id, plan, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [id, name, address || null, phone || null, owner_id || null, plan || 'basic', 'active'],
  });
  const r = await db.execute({ sql: 'SELECT * FROM shops WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  if (req.auth!.role !== 'super_admin' && req.auth!.shopId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, address, phone, plan, status } = req.body || {};
  const updates: string[] = [];
  const args: unknown[] = [];
  if (name !== undefined) { updates.push('name = ?'); args.push(name); }
  if (address !== undefined) { updates.push('address = ?'); args.push(address); }
  if (phone !== undefined) { updates.push('phone = ?'); args.push(phone); }
  if (plan !== undefined) { updates.push('plan = ?'); args.push(plan); }
  if (status !== undefined && req.auth!.role === 'super_admin') { updates.push('status = ?'); args.push(status); }
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  args.push(id);
  await db.execute({
    sql: `UPDATE shops SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });
  const r = await db.execute({ sql: 'SELECT * FROM shops WHERE id = ?', args: [id] });
  res.json(r.rows[0]);
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  await db.execute({ sql: 'UPDATE shops SET status = ? WHERE id = ?', args: ['inactive', id] });
  res.status(204).send();
});

export default router;
