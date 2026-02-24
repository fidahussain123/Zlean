import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper, requireWorker } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.get('/admin', requireAdminOrSuper, async (req, res) => {
  const shopId = req.auth!.role === 'super_admin' ? req.query.shop_id as string : req.auth!.shopId;
  
  if (!shopId) {
    return res.json({ totalToday: 0, inProgress: 0, ready: 0, revenueToday: 0, visits: [] });
  }

  const today = new Date().toISOString().slice(0, 10);
  
  const { data: visits, error: visitsError } = await supabase
    .from('visits')
    .select(`
      *,
      customer:profiles!visits_customer_id_fkey(name, phone),
      worker:profiles!visits_worker_id_fkey(name)
    `)
    .eq('shop_id', shopId)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: false });

  if (visitsError) {
    return res.status(500).json({ error: visitsError.message });
  }

  const mappedVisits = (visits || []).map(v => ({
    ...v,
    customer_name: (v.customer as { name?: string } | null)?.name || null,
    customer_phone: (v.customer as { phone?: string } | null)?.phone || null,
    worker_name: (v.worker as { name?: string } | null)?.name || null,
  }));

  const totalToday = mappedVisits.length;
  const inProgress = mappedVisits.filter(v => ['waiting', 'washing', 'drying'].includes(v.status || '')).length;
  const ready = mappedVisits.filter(v => v.status === 'ready').length;

  const { data: revenueData } = await supabase
    .from('invoices')
    .select('amount, visits!inner(shop_id)')
    .eq('status', 'paid')
    .eq('visits.shop_id', shopId)
    .gte('paid_at', `${today}T00:00:00`)
    .lt('paid_at', `${today}T23:59:59`);

  const revenueToday = (revenueData || []).reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

  res.json({ totalToday, inProgress, ready, revenueToday, visits: mappedVisits });
});

router.get('/worker', requireWorker, async (req, res) => {
  const workerId = req.auth!.userId;
  const today = new Date().toISOString().slice(0, 10);
  
  const { data: visits, error } = await supabase
    .from('visits')
    .select(`
      *,
      customer:profiles!visits_customer_id_fkey(name, phone)
    `)
    .eq('worker_id', workerId)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const mappedVisits = (visits || []).map(v => ({
    ...v,
    customer_name: (v.customer as { name?: string } | null)?.name || null,
    customer_phone: (v.customer as { phone?: string } | null)?.phone || null,
  }));

  const completed = mappedVisits.filter(v => v.status === 'delivered').length;
  const inProgress = mappedVisits.filter(v => ['waiting', 'washing', 'drying', 'ready'].includes(v.status || '')).length;
  
  res.json({ assignedToday: mappedVisits.length, completed, inProgress, visits: mappedVisits });
});

export default router;
