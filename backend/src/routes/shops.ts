import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { requireAuth, attachAuth } from '../middleware/auth.js';
import { requireSuperAdmin, requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/', requireAdminOrSuper, async (req, res) => {
  if (req.auth!.role === 'super_admin') {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  if (req.auth!.shopId) {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', req.auth!.shopId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  return res.json([]);
});

router.get('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  if (req.auth!.role !== 'super_admin' && req.auth!.shopId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.post('/', requireSuperAdmin, async (req, res) => {
  const { name, address, phone, owner_id, plan } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const { data, error } = await supabase
    .from('shops')
    .insert({
      name,
      address: address || null,
      phone: phone || null,
      owner_id: owner_id || null,
      plan: plan || 'basic',
      status: 'active',
    })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  if (req.auth!.role !== 'super_admin' && req.auth!.shopId !== id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { name, address, phone, plan, status } = req.body || {};
  const updates: Record<string, unknown> = {};
  
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (plan !== undefined) updates.plan = plan;
  if (status !== undefined && req.auth!.role === 'super_admin') updates.status = status;
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  const { data, error } = await supabase
    .from('shops')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', requireSuperAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('shops')
    .update({ status: 'inactive' })
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;
