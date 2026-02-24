import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase.js';
import type { AuthContext } from './roleGuard.js';

const SUPER_ADMIN_EMAIL = 'zlean314@gmail.com';
const SUPER_ADMIN_PASSWORD = 'NAELZ@123';

export async function attachAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.slice(7);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next();
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, shop_id, email')
      .eq('id', user.id)
      .single();

    if (profile) {
      req.auth = {
        userId: profile.id,
        role: profile.role as AuthContext['role'],
        shopId: profile.shop_id || undefined,
        email: profile.email || undefined,
      };
    }
  } catch {
    // ignore invalid token
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export { SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD };
export { requireRole } from './roleGuard.js';
