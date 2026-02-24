import { Router } from 'express';
import { supabase, supabaseAdmin } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, shop_id, status, created_at')
    .eq('role', 'admin')
    .order('created_at', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, email, password, shop_id } = req.body || {};
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email required' });
  }
  if (!shop_id) {
    return res.status(400).json({ error: 'shop_id required' });
  }
  
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existing) {
    return res.status(409).json({ error: 'Email already used' });
  }
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: password || `admin_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'admin',
    },
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  await supabase
    .from('profiles')
    .update({ shop_id })
    .eq('id', authData.user.id);

  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, role, shop_id, status, created_at')
    .eq('id', authData.user.id)
    .single();

  res.status(201).json(data);
});

router.patch('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, password, shop_id, status } = req.body || {};
  
  const { data: admin, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .eq('role', 'admin')
    .single();
  
  if (fetchError || !admin) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (shop_id !== undefined) updates.shop_id = shop_id;
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
  
  if (email) {
    await supabaseAdmin.auth.admin.updateUserById(id, { email });
  }
  
  const { data } = await supabase
    .from('profiles')
    .select('id, name, email, role, shop_id, status, created_at')
    .eq('id', id)
    .single();
  
  res.json(data);
});

export default router;
