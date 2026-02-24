import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/invoices', async (req, res) => {
  const visitId = req.query.visit_id as string | undefined;
  
  if (visitId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('visit_id', visitId);
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  
  if (req.auth!.role === 'super_admin') {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  
  if (req.auth!.role === 'admin' && req.auth!.shopId) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, visits!inner(shop_id)')
      .eq('visits.shop_id', req.auth!.shopId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  
  if (req.auth!.role === 'customer') {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, visits!inner(customer_id)')
      .eq('visits.customer_id', req.auth!.userId)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  
  return res.json([]);
});

router.post('/invoices', requireAdminOrSuper, async (req, res) => {
  const { visit_id, amount, payment_method } = req.body || {};
  if (!visit_id || amount == null) {
    return res.status(400).json({ error: 'visit_id and amount required' });
  }
  
  const { data: visit, error: visitError } = await supabase
    .from('visits')
    .select('shop_id')
    .eq('id', visit_id)
    .single();
  
  if (visitError || !visit) {
    return res.status(404).json({ error: 'Visit not found' });
  }
  
  if (req.auth!.role === 'admin' && visit.shop_id !== req.auth!.shopId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      visit_id,
      amount,
      payment_method: payment_method || 'cash',
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/invoices/:id', requireAdminOrSuper, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id')
    .eq('id', id)
    .single();
  
  if (fetchError || !invoice) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (status === 'paid') {
    const { data, error } = await supabase
      .from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }
  
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  
  res.json(data);
});

export default router;
