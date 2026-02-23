import { Router } from 'express';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

/** Admin: today's stats + today's visits with customer/worker names */
router.get('/admin', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id : req.auth!.shopId;
  if (!shopId) {
    return res.json({ totalToday: 0, inProgress: 0, ready: 0, revenueToday: 0, visits: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  const visitsRes = await db.execute({
    sql: `SELECT v.*, 
          c.name as customer_name, c.phone as customer_phone,
          w.name as worker_name
          FROM visits v
          LEFT JOIN users c ON v.customer_id = c.id
          LEFT JOIN users w ON v.worker_id = w.id
          WHERE v.shop_id = ? AND date(v.created_at) = ?
          ORDER BY v.created_at DESC`,
    args: [shopId, today],
  });
  const visits = visitsRes.rows as Array<Record<string, unknown>>;

  const totalToday = visits.length;
  const inProgress = visits.filter((v) => ['waiting', 'washing', 'drying'].includes((v.status as string) ?? '')).length;
  const ready = visits.filter((v) => (v.status as string) === 'ready').length;

  const revRes = await db.execute({
    sql: `SELECT COALESCE(SUM(i.amount), 0) as total FROM invoices i
          JOIN visits v ON i.visit_id = v.id
          WHERE v.shop_id = ? AND i.status = 'paid' AND date(i.paid_at) = ?`,
    args: [shopId, today],
  });
  const revenueToday = Number((revRes.rows[0] as { total?: number })?.total ?? 0);

  res.json({ totalToday, inProgress, ready, revenueToday, visits });
});

/** Worker: my queue today stats */
router.get('/worker', requireWorker, async (req, res) => {
  const workerId = req.auth!.userId;
  const today = new Date().toISOString().slice(0, 10);
  const visitsRes = await db.execute({
    sql: `SELECT v.*, c.name as customer_name, c.phone as customer_phone
          FROM visits v LEFT JOIN users c ON v.customer_id = c.id
          WHERE v.worker_id = ? AND date(v.created_at) = ?
          ORDER BY v.created_at ASC`,
    args: [workerId, today],
  });
  const visits = visitsRes.rows as Array<Record<string, unknown>>;
  const completed = visits.filter((v) => (v.status as string) === 'delivered').length;
  const inProgress = visits.filter((v) => ['waiting', 'washing', 'drying', 'ready'].includes((v.status as string) ?? '')).length;
  res.json({ assignedToday: visits.length, completed, inProgress, visits });
});

export default router;
