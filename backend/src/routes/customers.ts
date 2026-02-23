import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

/** Find customer by phone or create one (walk-in). Returns { id, name, phone }. */
router.post('/find-or-create', requireAdminOrSuper, async (req, res) => {
  const { name, phone } = req.body || {};
  const phoneStr = typeof phone === 'string' ? phone.trim() : '';
  const nameStr = typeof name === 'string' ? name.trim() : 'Walk-in';
  if (!phoneStr) return res.status(400).json({ error: 'Phone required' });
  const r = await db.execute({
    sql: 'SELECT id, name, phone FROM users WHERE phone = ? AND role = ? LIMIT 1',
    args: [phoneStr, 'customer'],
  });
  if (r.rows.length > 0) {
    return res.json(r.rows[0]);
  }
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO users (id, name, phone, role, status) VALUES (?, ?, ?, ?, ?)',
    args: [id, nameStr, phoneStr, 'customer', 'active'],
  });
  res.status(201).json({ id, name: nameStr, phone: phoneStr });
});

export default router;
