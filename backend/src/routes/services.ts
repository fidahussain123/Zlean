import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id as string : req.auth!.shopId;
  
  let query = supabase
    .from('service_packages')
    .select('*')
    .order('name');
  
  if (shopId) {
    query = query.eq('shop_id', shopId);
  } else if (req.auth!.role !== 'super_admin') {
    return res.json([]);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireAdminOrSuper, async (req, res) => {
  const { name, description, price, duration_minutes, shop_id } = req.body || {};
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  
  if (!shopId || !name || price == null) {
    return res.status(400).json({ error: 'shop_id, name and price required' });
  }
  
  const { data, error } = await supabase
    .from('service_packages')
    .insert({
      shop_id: shopId,
      name,
      description: description ?? null,
      price: Number(price),
      duration_minutes: duration_minutes != null ? Number(duration_minutes) : null,
      is_active: true,
    })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, duration_minutes, is_active } = req.body || {};
  
  const { data: service, error: fetchError } = await supabase
    .from('service_packages')
    .select('shop_id')
    .eq('id', id)
    .single();
  
  if (fetchError || !service) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && service.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price !== undefined) updates.price = Number(price);
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
  if (is_active !== undefined) updates.is_active = is_active;
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  const { data, error } = await supabase
    .from('service_packages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  
  const { data: service, error: fetchError } = await supabase
    .from('service_packages')
    .select('shop_id')
    .eq('id', id)
    .single();
  
  if (fetchError || !service) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && service.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { error } = await supabase
    .from('service_packages')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
