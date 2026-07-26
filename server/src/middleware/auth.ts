import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';
import { config } from '../config';

const secret = config.jwtSecret;

export interface JwtPayload {
  userId: string;
  tokenVersion: number;
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  // Legacy compatibility: old routes are being retired in Phase 4.
  // New routes use requirePermission instead.
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  next();
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Verifies JWT and re-checks the user's tokenVersion from the database
 * on every request. This ensures token revocation (password change, admin
 * force-logout) takes effect immediately instead of waiting for token expiry.
 */
export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;

    // Fresh DB check: if tokenVersion doesn't match, the token is revoked
    const user = await UserModel.findById(payload.userId)
      .select('tokenVersion')
      .lean()
      .exec();

    if (!user) {
      res.status(401).json({ message: 'Account no longer exists' });
      return;
    }

    if (user.tokenVersion !== payload.tokenVersion) {
      res.status(401).json({ message: 'Token revoked — please log in again' });
      return;
    }

    req.user = { userId: payload.userId, tokenVersion: payload.tokenVersion };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Optional auth — sets req.user if a valid token is present, but doesn't
 * reject the request if missing. Useful for public endpoints that show
 * different content to authenticated users.
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.user = { userId: payload.userId, tokenVersion: payload.tokenVersion };
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}
