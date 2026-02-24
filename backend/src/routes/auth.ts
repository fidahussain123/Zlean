import { Router } from 'express';
import { supabase, supabaseAdmin } from '../db/supabase.js';
import { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD } from '../middleware/auth.js';
import type { Role } from '../db/supabase.js';

const router = Router();

router.post('/login', async (req, res) => {
  const body = req.body || {};
  const login = (body.login ?? body.email ?? body.phone ?? '').toString().trim();
  const password = body.password;
  if (!login || !password) {
    return res.status(400).json({ error: 'Email or phone and password required' });
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: login,
    password: password,
  });

  if (authError) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (authData.user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, phone, role, shop_id')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Profile not found' });
    }

    return res.json({
      token: authData.session?.access_token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        shopId: profile.shop_id,
      },
    });
  }

  return res.status(401).json({ error: 'Invalid email or password' });
});

router.post('/signup/customer', async (req, res) => {
  const { email, password, name } = req.body || {};
  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const nameStr = typeof name === 'string' ? name.trim() : '';
  const pass = typeof password === 'string' ? password : '';
  if (!emailStr || !pass || !nameStr) {
    return res.status(400).json({ error: 'Email, password and name required' });
  }
  if (pass.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: emailStr,
    password: pass,
    options: {
      data: {
        name: nameStr,
        role: 'customer',
      },
    },
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    return res.status(400).json({ error: authError.message });
  }

  if (authData.user) {
    return res.status(201).json({
      token: authData.session?.access_token,
      user: {
        id: authData.user.id,
        name: nameStr,
        email: emailStr,
        role: 'customer',
      },
    });
  }

  return res.status(400).json({ error: 'Failed to create account' });
});

export default router;
