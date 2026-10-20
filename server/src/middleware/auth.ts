import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import jwt, { JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../config';
export const SESSION_COOKIE = 'ff_session';
export const CSRF_COOKIE = 'ff_csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const API_KEY_PATTERN = /^ff_([a-f0-9]{16})_([a-f0-9]{64})$/i;
const CSRF_TOKEN_PATTERN = /^[a-f0-9]{64}$/i;

type AuthPayload = JwtPayload & {
  id: string;
  sessionVersion: number;
  exp: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
        role: 'owner' | 'admin' | 'member';
        sessionVersion: number;
        exp: number;
      };
      project?: {
        id: string;
        name: string;
        plan?: string;
        organizationId?: string;
      };
    }
  }
}

const digestApiKey = (key: string) => crypto.createHash('sha256').update(key, 'utf8').digest();

export const clearAuthCookies = (res: Response) => {
  const options = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };

  res.clearCookie(SESSION_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, options);
};

const rejectAuth = (res: Response) => {
  clearAuthCookies(res);
  res.status(401).json({ error: 'Invalid or expired token' });
};

/** Validates API keys for evaluate requests. */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  const match = apiKey && API_KEY_PATTERN.exec(apiKey);

  if (!match) {
    res.status(401).json({
      error: apiKey ? 'Invalid API key' : 'Missing X-API-Key header'
    });
    return;
  }

  try {
    const apiKeyId = match[1];
    const result = await pool.query(
      `SELECT id, name, organization_id, plan, api_key_hash
       FROM projects
       WHERE api_key_id = $1 AND api_key_hash IS NOT NULL`,
      [apiKeyId]
    );
    const project = result.rows[0];
    if (!project || typeof project.api_key_hash !== 'string') {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    const storedDigest = Buffer.from(project.api_key_hash, 'hex');
    const suppliedDigest = digestApiKey(apiKey!);

    if (
      storedDigest.length !== suppliedDigest.length ||
      !crypto.timingSafeEqual(storedDigest, suppliedDigest)
    ) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    req.project = {
      id: project.id,
      name: project.name,
      organizationId: project.organization_id,
      plan: project.plan
    };
    next();
  } catch (error) {
    next(error);
  }
};

const authenticateRequest = async (req: Request): Promise<boolean> => {
  const authHeader = req.header('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : undefined;

  // Prefer the session cookie when present.
  const token = req.cookies?.[SESSION_COOKIE] ?? bearerToken;
  if (!token || typeof token !== 'string') return false;

  let verified: string | JwtPayload;

  try {
    verified = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
  } catch {
    return false;
  }
  if (
    typeof verified === 'string' ||
    typeof verified.id !== 'string' ||
    typeof verified.sessionVersion !== 'number' ||
    typeof verified.exp !== 'number'
  ) {
    return false;
  }
  const membership = await pool.query(
    `SELECT organization_id, role, session_version
     FROM users
     WHERE id = $1`,
    [verified.id]
  );

  if (membership.rowCount !== 1) return false;

  const user = membership.rows[0];
  if (verified.sessionVersion !== user.session_version) return false;

  if (!['owner', 'admin', 'member'].includes(user.role)) return false;

  const payload = verified as AuthPayload;

  req.user = {
    id: payload.id,
    organizationId: user.organization_id,
    role: user.role,
    sessionVersion: user.session_version,
    exp: payload.exp
  };

  return true;
};

export const issueCsrfCookie = (res: Response) => {
  res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString('hex'), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/'
  });
};

const continueWithCsrf = (req: Request, res: Response, next: NextFunction) => {
  const csrfCookie = req.cookies?.[CSRF_COOKIE];

  if (req.user && (typeof csrfCookie !== 'string' || !CSRF_TOKEN_PATTERN.test(csrfCookie))) {
    issueCsrfCookie(res);
  }

  next();
};

/** Validates JWT for dashboard requests. */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(await authenticateRequest(req))) {
      rejectAuth(res);
      return;
    }
    continueWithCsrf(req, res, next);
  } catch (error) {
    next(error);
  }
};

/** Allows anonymous access while attaching a valid dashboard session when present. */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(await authenticateRequest(req))) {
      clearAuthCookies(res);
    }
    continueWithCsrf(req, res, next);
  } catch (error) {
    next(error);
  }
};

export const requireRole =
  (...allowedRoles: Array<'owner' | 'admin' | 'member'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

const getAllowedOrigins = () => {
  const origins = new Set<string>();

  // Support one or more comma-separated production origins.
  for (const candidate of (process.env.CORS_ORIGIN ?? '').split(',')) {
    const value = candidate.trim();
    if (!value) continue;

    try {
      origins.add(new URL(value).origin);
    } catch {
      // Ignore malformed configured origins.
    }
  }

  // Local development origins are allowed only outside production.
  if (process.env.NODE_ENV !== 'production') {
    for (const origin of [
      'http://localhost:5173',
      'http://localhost',
      'http://127.0.0.1:5173',
      'http://127.0.0.1'
    ]) {
      origins.add(origin);
    }
  }

  return origins;
};

/**
 * Apply to cookie-authenticated routes that can change server state.
 * Ensure cookie-parser runs before this middleware.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  // Bearer-token-only requests are not authenticated by the session cookie.
  if (!req.cookies?.[SESSION_COOKIE]) {
    next();
    return;
  }

  const origin = req.header('Origin');
  const allowedOrigins = getAllowedOrigins();

  let normalizedOrigin: string | undefined;

  if (origin) {
    try {
      const parsedOrigin = new URL(origin);

      // Origin headers should contain only an origin, not a path or credentials.
      if (
        parsedOrigin.username ||
        parsedOrigin.password ||
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search ||
        parsedOrigin.hash
      ) {
        res.status(403).json({ error: 'CSRF validation failed' });
        return;
      }

      normalizedOrigin = parsedOrigin.origin;
    } catch {
      res.status(403).json({ error: 'CSRF validation failed' });
      return;
    }
  }

  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.header('X-CSRF-Token');

  // Require an allowed Origin and a matching, correctly formatted token.
  if (
    !normalizedOrigin ||
    !allowedOrigins.has(normalizedOrigin) ||
    typeof csrfCookie !== 'string' ||
    typeof csrfHeader !== 'string' ||
    !CSRF_TOKEN_PATTERN.test(csrfCookie) ||
    !CSRF_TOKEN_PATTERN.test(csrfHeader)
  ) {
    res.status(403).json({ error: 'CSRF validation failed' });
    return;
  }

  const cookieBuffer = Buffer.from(csrfCookie, 'hex');
  const headerBuffer = Buffer.from(csrfHeader, 'hex');

  if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
    res.status(403).json({ error: 'CSRF validation failed' });
    return;
  }
  next();
};
