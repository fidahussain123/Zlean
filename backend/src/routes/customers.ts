import { Router } from 'express';
import { supabase, supabaseAdmin } from '../db/supabase.js';
import { attachAuth, requireAuth } from '../middleware/auth.js';
import { requireAdminOrSuper } from '../middleware/roleGuard.js';

const router = Router();

router.use(attachAuth);
router.use(requireAuth);

router.post('/find-or-create', requireAdminOrSuper, async (req, res) => {
  const { name, phone } = req.body || {};
  const phoneStr = typeof phone === 'string' ? phone.trim() : '';
  const nameStr = typeof name === 'string' ? name.trim() : 'Walk-in';
  
  if (!phoneStr) {
    return res.status(400).json({ error: 'Phone required' });
  }
  
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, name, phone')
    .eq('phone', phoneStr)
    .eq('role', 'customer')
    .limit(1)
    .single();
  
  if (existing) {
    return res.json(existing);
  }
  
  const tempEmail = `${phoneStr.replace(/\D/g, '')}@walkin.zlean.local`;
  const tempPassword = `walkin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: tempEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      name: nameStr,
      role: 'customer',
    },
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  await supabase
    .from('profiles')
    .update({ phone: phoneStr })
    .eq('id', authData.user.id);

  res.status(201).json({ 
    id: authData.user.id, 
    name: nameStr, 
    phone: phoneStr 
  });
});

export default router;
