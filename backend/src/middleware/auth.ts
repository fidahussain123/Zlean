import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/turso.js';
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
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    if (payload.userId && payload.role) {
      const row = await db.execute({
        sql: 'SELECT id, role, shop_id, email FROM users WHERE id = ? AND status = ?',
        args: [payload.userId, 'active'],
      });
      if (row.rows.length) {
        const u = row.rows[0];
        req.auth = {
          userId: u.id as string,
          role: u.role as AuthContext['role'],
          shopId: u.shop_id as string | undefined,
          email: u.email as string | undefined,
        };
      }
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
