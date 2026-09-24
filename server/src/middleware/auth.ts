import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';
export const SESSION_COOKIE = 'ff_session';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        organizationId: string;
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
    const result = await pool.query('SELECT id, name FROM projects WHERE api_key = $1', [apiKey]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    req.project = result.rows[0];
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Validates JWT for Dashboard requests
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = req.cookies?.[SESSION_COOKIE] ??
    (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined);

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; organizationId: string; exp?: number };
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
