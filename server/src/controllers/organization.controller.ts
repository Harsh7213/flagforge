import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db/pool';
import { JWT_SECRET } from '../config';
import { SESSION_COOKIE } from '../middleware/auth';

const SESSION_DURATION_MS = 60 * 60 * 1000;
const INVITATION_DURATION_MS = 24 * 60 * 60 * 1000;

const invitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(32),
  name: z.string().min(2),
  password: z.string().min(14),
});

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
};

export const createInvitation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, role } = invitationSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (existingUser.rowCount) {
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const token = `invite_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + INVITATION_DURATION_MS);
    await pool.query(
      `INSERT INTO organization_invitations
       (organization_id, email, role, token_hash, expires_at, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user!.organizationId, normalizedEmail, role, hashToken(token), expiresAt, req.user!.id]
    );

    res.status(201).json({ data: { email: normalizedEmail, role, token, expiresAt } });
  } catch (error) {
    next(error);
  }
};

export const listMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at
       FROM users WHERE organization_id = $1 ORDER BY created_at ASC`,
      [req.user!.organizationId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const member = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND organization_id = $2',
      [req.params.userId, req.user!.organizationId]
    );
    if (member.rowCount === 0) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    if (member.rows[0].id === req.user!.id) {
      res.status(400).json({ error: 'You cannot remove yourself' });
      return;
    }
    if (member.rows[0].role === 'owner' || (req.user!.role === 'admin' && member.rows[0].role === 'admin')) {
      res.status(403).json({ error: 'You cannot remove this member' });
      return;
    }

    await pool.query(
      'UPDATE users SET session_version = session_version + 1 WHERE id = $1',
      [req.params.userId]
    );
    await pool.query(
      'DELETE FROM users WHERE id = $1 AND organization_id = $2',
      [req.params.userId, req.user!.organizationId]
    );
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const { token, name, password } = acceptInvitationSchema.parse(req.body);
    await client.query('BEGIN');

    const invitationResult = await client.query(
      `SELECT oi.id, oi.organization_id, oi.email, oi.role, o.name AS organization_name
       FROM organization_invitations oi
       JOIN organizations o ON o.id = oi.organization_id
       WHERE oi.token_hash = $1 AND oi.accepted_at IS NULL AND oi.expires_at > NOW()
       FOR UPDATE`,
      [hashToken(token)]
    );
    const invitation = invitationResult.rows[0];
    if (!invitation) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Invalid or expired invitation' });
      return;
    }

    const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [invitation.email]);
    if (existingUser.rowCount) {
      await client.query('ROLLBACK');
      res.status(409).json({ error: 'A user with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [invitation.organization_id, name, invitation.email, passwordHash, invitation.role]
    );
    await client.query('UPDATE organization_invitations SET accepted_at = NOW() WHERE id = $1', [invitation.id]);
    await client.query('COMMIT');

    const userId = userResult.rows[0].id;
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const sessionToken = jwt.sign(
      { id: userId, organizationId: invitation.organization_id },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    setSessionCookie(res, sessionToken);

    res.status(201).json({
      data: {
        expiresAt,
        user: {
          id: userId,
          name,
          email: invitation.email,
          organizationId: invitation.organization_id,
          organizationName: invitation.organization_name,
          role: invitation.role,
        },
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
