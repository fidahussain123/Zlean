import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/visits', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id : req.auth!.shopId;
  if (!shopId && req.auth!.role !== 'super_admin') return res.json([]);
  const sql = shopId
    ? 'SELECT * FROM visits WHERE shop_id = ? ORDER BY created_at DESC'
    : 'SELECT * FROM visits ORDER BY created_at DESC';
  const args = shopId ? [shopId] : [];
  const r = await db.execute({ sql, args: args as string[] });
  res.json(r.rows);
});

router.get('/visits/queue', requireWorker, async (req, res) => {
  const workerId = req.auth!.userId;
  const r = await db.execute({
    sql: `SELECT * FROM visits WHERE worker_id = ? AND date(created_at) = date('now') AND status NOT IN ('delivered') ORDER BY created_at ASC`,
    args: [workerId],
  });
  res.json(r.rows);
});

router.get('/visits/:id', async (req, res) => {
  const { id } = req.params;
  const r = await db.execute({ sql: 'SELECT * FROM visits WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const v = r.rows[0];
  if (req.auth!.role === 'admin' && v.shop_id !== req.auth!.shopId) return res.status(403).json({ error: 'Forbidden' });
  if (req.auth!.role === 'worker' && v.worker_id !== req.auth!.userId) return res.status(403).json({ error: 'Forbidden' });
  res.json(v);
});

router.post('/visits', requireAdminOrSuper, async (req, res) => {
  const { customer_id, worker_id, shop_id, car_plate, car_model, service, notes } = req.body || {};
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  if (!shopId || !car_plate || !service) {
    return res.status(400).json({ error: 'shop_id, car_plate and service required' });
  }
  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO visits (id, customer_id, worker_id, shop_id, car_plate, car_model, service, notes, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'waiting')`,
    args: [id, customer_id || null, worker_id || null, shopId, car_plate, car_model || null, service, notes || null],
  });
  const r = await db.execute({ sql: 'SELECT * FROM visits WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

router.patch('/visits/:id', async (req, res) => {
  const { id } = req.params;
  const { status, worker_id, photos, notes, estimated_time } = req.body || {};
  const r = await db.execute({ sql: 'SELECT * FROM visits WHERE id = ?', args: [id] });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  const v = r.rows[0];
  if (req.auth!.role === 'admin' && v.shop_id !== req.auth!.shopId) return res.status(403).json({ error: 'Forbidden' });
  if (req.auth!.role === 'worker' && v.worker_id !== req.auth!.userId) return res.status(403).json({ error: 'Forbidden' });
  const updates: string[] = ['updated_at = datetime(\'now\')'];
  const args: unknown[] = [];
  if (status !== undefined) { updates.push('status = ?'); args.push(status); }
  if (worker_id !== undefined) { updates.push('worker_id = ?'); args.push(worker_id); }
  if (photos !== undefined) { updates.push('photos = ?'); args.push(typeof photos === 'string' ? photos : JSON.stringify(photos)); }
  if (notes !== undefined) { updates.push('notes = ?'); args.push(notes); }
  if (estimated_time !== undefined) { updates.push('estimated_time = ?'); args.push(estimated_time); }
  args.push(id);
  await db.execute({ sql: `UPDATE visits SET ${updates.join(', ')} WHERE id = ?`, args });
  const out = await db.execute({ sql: 'SELECT * FROM visits WHERE id = ?', args: [id] });
  res.json(out.rows[0]);
});

export default router;
