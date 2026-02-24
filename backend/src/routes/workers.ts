import { Router } from 'express';
import { supabase, supabaseAdmin } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id as string : req.auth!.shopId;
  
  let query = supabase
    .from('profiles')
    .select('id, name, phone, role, shop_id, status, created_at')
    .eq('role', 'worker')
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

router.post('/', requireAdminOrSuper, async (req, res) => {
  const { name, phone, password, shop_id } = req.body || {};
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }
  
  const shopId = req.auth!.role === 'super_admin' ? shop_id : req.auth!.shopId;
  if (!shopId) {
    return res.status(400).json({ error: 'Shop required' });
  }
  
  const email = `${phone.replace(/\D/g, '')}@worker.zlean.local`;
  const pwd = password || `worker_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: pwd,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'worker',
    },
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  await supabase
    .from('profiles')
    .update({ phone, shop_id: shopId })
    .eq('id', authData.user.id);

  const { data } = await supabase
    .from('profiles')
    .select('id, name, phone, role, shop_id, status, created_at')
    .eq('id', authData.user.id)
    .single();

  res.status(201).json(data);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { name, phone, password, status } = req.body || {};
  
  const { data: worker, error: fetchError } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', id)
    .eq('role', 'worker')
    .single();
  
  if (fetchError || !worker) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && worker.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (status !== undefined) updates.status = status;
  
  if (Object.keys(updates).length === 0 && !password) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  if (Object.keys(updates).length > 0) {
    await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);
  }

  if (password) {
    await supabaseAdmin.auth.admin.updateUserById(id, { password });
  }
  
  const { data } = await supabase
    .from('profiles')
    .select('id, name, phone, role, shop_id, status, created_at')
    .eq('id', id)
    .single();
  
  res.json(data);
});

router.delete('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  
  const { data: worker, error: fetchError } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', id)
    .eq('role', 'worker')
    .single();
  
  if (fetchError || !worker) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (req.auth!.role === 'admin' && worker.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await supabase
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', id);
  
  res.status(204).send();
});

export default router;
