import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/turso.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', async (req, res) => {
  const r = await db.execute({
    sql: 'SELECT * FROM notifications WHERE user_id = ? ORDER BY sent_at DESC LIMIT 50',
    args: [req.auth!.userId],
  });
  res.json(r.rows);
});

router.post('/log', async (req, res) => {
  const { user_id, type, channel, message } = req.body || {};
  if (!user_id || !type) return res.status(400).json({ error: 'user_id and type required' });
  const id = uuidv4();
  await db.execute({
    sql: 'INSERT INTO notifications (id, user_id, type, channel, message, status) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, user_id, type, channel || 'push', message || null, 'sent'],
  });
  const r = await db.execute({ sql: 'SELECT * FROM notifications WHERE id = ?', args: [id] });
  res.status(201).json(r.rows[0]);
});

export default router;
