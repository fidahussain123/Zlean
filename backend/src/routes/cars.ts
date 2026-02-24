import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/visits', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id as string : req.auth!.shopId;
  
  let query = supabase
    .from('visits')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (shopId) {
    query = query.eq('shop_id', shopId);
  } else if (req.auth!.role !== 'super_admin') {
    return res.json([]);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/visits/queue', requireWorker, async (req, res) => {
  const workerId = req.auth!.userId;
  const today = new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase
    .from('visits')
    .select('*')
    .eq('worker_id', workerId)
    .gte('created_at', `${today}T00:00:00`)
    .not('status', 'eq', 'delivered')
    .order('created_at', { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/visits/:id', async (req, res) => {
  const { id } = req.params;
  
  const { data: visit, error } = await supabase
    .from('visits')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !visit) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && visit.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.auth!.role === 'worker' && visit.worker_id !== req.auth!.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(visit);
});

router.post('/visits', requireAdminOrSuper, async (req, res) => {
  const { customer_id, worker_id, shop_id, car_plate, car_model, service, notes } = req.body || {};
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  
  if (!shopId || !car_plate || !service) {
    return res.status(400).json({ error: 'shop_id, car_plate and service required' });
  }
  
  const { data, error } = await supabase
    .from('visits')
    .insert({
      customer_id: customer_id || null,
      worker_id: worker_id || null,
      shop_id: shopId,
      car_plate,
      car_model: car_model || null,
      service,
      notes: notes || null,
      status: 'waiting',
    })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/visits/:id', async (req, res) => {
  const { id } = req.params;
  const { status, worker_id, photos, notes, estimated_time } = req.body || {};
  
  const { data: visit, error: fetchError } = await supabase
    .from('visits')
    .select('*')
    .eq('id', id)
    .single();
  
  if (fetchError || !visit) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && visit.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (req.auth!.role === 'worker' && visit.worker_id !== req.auth!.userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  
  if (status !== undefined) updates.status = status;
  if (worker_id !== undefined) updates.worker_id = worker_id;
  if (photos !== undefined) updates.photos = typeof photos === 'string' ? JSON.parse(photos) : photos;
  if (notes !== undefined) updates.notes = notes;
  if (estimated_time !== undefined) updates.estimated_time = estimated_time;
  
  const { data, error } = await supabase
    .from('visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
