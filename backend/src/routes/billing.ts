import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/invoices', async (req, res) => {
  const visitId = req.query.visit_id as string | undefined;
  if (visitId) {
    const r = await db.execute({ sql: 'SELECT * FROM invoices WHERE visit_id = ?', args: [visitId] });
    return res.json(r.rows);
  }
  if (req.auth!.role === 'super_admin') {
    const r = await db.execute({ sql: 'SELECT * FROM invoices ORDER BY created_at DESC', args: [] });
    return res.json(r.rows);
  }
  if (req.auth!.role === 'admin' && req.auth!.shopId) {
    const r = await db.execute({
      sql: 'SELECT i.* FROM invoices i JOIN visits v ON i.visit_id = v.id WHERE v.shop_id = ? ORDER BY i.created_at DESC',
      args: [req.auth.shopId],
    });
    return res.json(r.rows);
  }
  if (req.auth!.role === 'customer') {
    const r = await db.execute({
      sql: 'SELECT i.* FROM invoices i JOIN visits v ON i.visit_id = v.id WHERE v.customer_id = ? ORDER BY i.created_at DESC',
      args: [req.auth.userId],
    });
    return res.json(r.rows);
  }
  return res.json([]);
});

router.post('/invoices', requireAdminOrSuper, async (req, res) => {
  const { visit_id, amount, payment_method } = req.body || {};
  if (!visit_id || amount == null) return res.status(400).json({ error: 'visit_id and amount required' });
  const v = await db.execute({ sql: 'SELECT shop_id FROM visits WHERE id = ?', args: [visit_id] });
  if (v.rows.length === 0) return res.status(404).json({ error: 'Visit not found' });
  if (req.auth!.role === 'admin' && (v.rows[0].shop_id as string) !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO invoices (id, visit_id, amount, payment_method, status) VALUES (?, ?, ?, ?, ?)',
    args: [id, visit_id, amount, payment_method || 'cash', 'pending'],
  });
  const r = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

router.patch('/invoices/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const r = await db.execute({
    sql: 'SELECT i.id FROM invoices i JOIN visits v ON i.visit_id = v.id WHERE i.id = ?',
    args: [id],
  });
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  if (status === 'paid') {
    await db.execute({
      sql: "UPDATE invoices SET status = ?, paid_at = datetime('now') WHERE id = ?",
      args: ['paid', id],
    });
  }
  const out = await db.execute({ sql: 'SELECT * FROM invoices WHERE id = ?', args: [id] });
  res.json(out.rows[0]);
});

export default router;
