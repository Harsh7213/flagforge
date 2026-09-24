import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255),
});

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId;
    const result = await pool.query(
      'SELECT id, name, created_at FROM projects WHERE organization_id = $1 ORDER BY created_at DESC',
      [orgId]
    );
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user!.organizationId;
    const { name } = createProjectSchema.parse(req.body);
    const apiKeyId = crypto.randomBytes(8).toString('hex');
    const apiKey = `ff_${apiKeyId}_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 12);
    const result = await pool.query(
      'INSERT INTO projects (name, organization_id, api_key_id, api_key_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, created_at',
      [name, orgId, apiKeyId, apiKeyHash]
    );
    res.status(201).json({ data: { ...result.rows[0], api_key: apiKey } });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const orgId = req.user!.organizationId;
    const { name } = updateProjectSchema.parse(req.body);
    const result = await pool.query(
      'UPDATE projects SET name = $1 WHERE id = $2 AND organization_id = $3 RETURNING id, name, created_at',
      [name, id, orgId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const rotateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKeyId = crypto.randomBytes(8).toString('hex');
    const apiKey = `ff_${apiKeyId}_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(apiKey, 12);
    const result = await pool.query(
      `UPDATE projects SET api_key_id = $1, api_key_hash = $2
      WHERE id = $3 AND organization_id = $4
       RETURNING id, name, created_at`,
      [apiKeyId, apiKeyHash, req.params.id, req.user!.organizationId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ data: { ...result.rows[0], api_key: apiKey } });
  } catch (error) {
    next(error);
  }
};

export const revokeApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'UPDATE projects SET api_key_id = NULL, api_key_hash = NULL WHERE id = $1 AND organization_id = $2 RETURNING id',
      [req.params.id, req.user!.organizationId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const orgId = req.user!.organizationId;
    // Ensure the project belongs to the user's organization
    const result = await pool.query(
      'DELETE FROM projects WHERE id = $1 AND organization_id = $2 RETURNING id',
      [id, orgId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
