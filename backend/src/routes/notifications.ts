import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.auth!.userId)
    .order('sent_at', { ascending: false })
    .limit(50);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/log', async (req, res) => {
  const { user_id, type, channel, message } = req.body || {};
  
  if (!user_id || !type) {
    return res.status(400).json({ error: 'user_id and type required' });
  }
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id,
      type,
      channel: channel || 'push',
      message: message || null,
      status: 'sent',
    })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
