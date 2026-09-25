import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { issueCsrfCookie, SESSION_COOKIE } from '../middleware/auth';
import { JWT_SECRET } from '../config';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(14),
  organizationName: z.string().trim().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const SESSION_DURATION_MS = 60 * 60 * 1000;

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { name, email, password, organizationName } = registerSchema.parse(req.body);

    // Check if user with this email already exists
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    await client.query('BEGIN');
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtextextended(lower($1), 0))',
      [organizationName]
    );

    const existingOrganization = await client.query(
      'SELECT id FROM organizations WHERE lower(trim(name)) = lower($1) LIMIT 1',
      [organizationName]
    );
    if (existingOrganization.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'An organization with this name already exists' });
      return;
    }

    const orgResult = await client.query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id, name',
      [organizationName]
    );
    const organizationId = orgResult.rows[0].id;
    const actualOrgName = orgResult.rows[0].name;

    // Create user under the organization
    const passwordHash = await bcrypt.hash(password, 10);
    const userResult = await client.query(
      'INSERT INTO users (organization_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [organizationId, name, email, passwordHash, 'owner']
    );
    const userId = userResult.rows[0].id;

    await client.query('COMMIT');

    // Generate JWT token
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = jwt.sign({ id: userId, organizationId, sessionVersion: 0 }, JWT_SECRET, { expiresIn: '1h' });
    setSessionCookie(res, token);
    issueCsrfCookie(res);

    res.status(201).json({
      data: {
        expiresAt,
        user: { id: userId, name, email, organizationId, organizationName: actualOrgName, role: 'owner' },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await pool.query(
      `SELECT u.id, u.organization_id, u.name, u.email, u.password_hash, u.role, u.session_version, o.name as organization_name
       FROM users u 
       JOIN organizations o ON u.organization_id = o.id 
       WHERE u.email = $1`,
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const token = jwt.sign({ id: user.id, organizationId: user.organization_id, sessionVersion: user.session_version }, JWT_SECRET, { expiresIn: '1h' });
    setSessionCookie(res, token);
    issueCsrfCookie(res);

    res.json({
      data: {
        expiresAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organization_id,
          organizationName: user.organization_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.organization_id, u.role, o.name AS organization_name
       FROM users u
       JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user!.id]
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    res.json({
      data: {
        expiresAt: req.user?.exp
          ? req.user.exp * 1000
          : Date.now() + SESSION_DURATION_MS,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organization_id,
          organizationName: user.organization_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('UPDATE users SET session_version = session_version + 1 WHERE id = $1', [req.user!.id]);
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    res.clearCookie('ff_csrf', { secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
