import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { JWT_SECRET } from '../config';
export const SESSION_COOKIE = 'ff_session';
export const CSRF_COOKIE = 'ff_csrf';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
        role: 'owner' | 'admin' | 'member';
        sessionVersion: number;
        exp?: number;
      };
      project?: {
        id: string;
        name: string;
      };
    }
  }
}

/**
 * Validates API key for SDK requests
 */
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');
  if (!apiKey) {
    res.status(401).json({ error: 'Missing X-API-Key header' });
    return;
  }

  try {
    const parts = apiKey.split('_');
    const apiKeyId = parts.length === 3 && parts[0] === 'ff' ? parts[1] : apiKey;
    const result = await pool.query(
      'SELECT id, name, api_key_hash FROM projects WHERE api_key_id = $1 AND api_key_hash IS NOT NULL',
      [apiKeyId]
    );
    const project = result.rows[0];
    if (!project || !(await bcrypt.compare(apiKey, project.api_key_hash))) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    req.project = { id: project.id, name: project.name };
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates JWT for Dashboard requests
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = req.cookies?.[SESSION_COOKIE] ??
    (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined);

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (typeof verified === 'string' || !verified.id) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const membership = await pool.query(
      'SELECT organization_id, role, session_version FROM users WHERE id = $1',
      [verified.id]
    );
    if (membership.rowCount === 0) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    if (verified.sessionVersion !== membership.rows[0].session_version) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    req.user = {
      id: verified.id,
      organizationId: membership.rows[0].organization_id,
      role: membership.rows[0].role,
      sessionVersion: membership.rows[0].session_version,
      exp: verified.exp,
    };
    if (!req.cookies?.[CSRF_COOKIE]) {
      issueCsrfCookie(res);
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (...allowedRoles: Array<'owner' | 'admin' | 'member'>) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };

export const issueCsrfCookie = (res: Response) => {
  res.cookie(CSRF_COOKIE, crypto.randomBytes(32).toString('hex'), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000,
    path: '/',
  });
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  if (SAFE_METHODS.has(req.method) || !req.cookies?.[SESSION_COOKIE]) {
    next();
    return;
  }

  const expectedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const origin = req.header('Origin');
  const csrfCookie = req.cookies?.[CSRF_COOKIE];
  const csrfHeader = req.header('X-CSRF-Token');
  if (origin !== expectedOrigin || !csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({ error: 'CSRF validation failed' });
    return;
  }
  next();
};
