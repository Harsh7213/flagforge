import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '../config';
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
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = req.cookies?.[SESSION_COOKIE] ??
    (authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined);

  if (!token) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    if (typeof verified === 'string' || !verified.id || !verified.organizationId) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    const payload = verified as { id: string; organizationId: string; exp?: number };
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
