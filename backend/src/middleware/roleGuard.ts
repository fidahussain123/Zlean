import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../db/supabase.js';

export interface AuthContext {
  userId: string;
  role: Role;
  shopId?: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const roleHierarchy: Record<Role, number> = {
  super_admin: 4,
  admin: 3,
  worker: 2,
  customer: 1,
};

export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (allowed.includes(req.auth.role)) {
      return next();
    }
    if (req.auth.role === 'super_admin') {
      return next();
    }
    return res.status(403).json({ error: 'Forbidden' });
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'super_admin') {
    return res.status(403).json({ error: 'Super admin only' });
  }
  next();
}

export function requireAdminOrSuper(req: Request, res: Response, next: NextFunction) {
  if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
  if (req.auth.role === 'super_admin' || req.auth.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}

export function requireWorker(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'worker') {
    return res.status(403).json({ error: 'Worker only' });
  }
  next();
}

export function requireCustomer(req: Request, res: Response, next: NextFunction) {
  if (!req.auth || req.auth.role !== 'customer') {
    return res.status(403).json({ error: 'Customer only' });
  }
  next();
}
