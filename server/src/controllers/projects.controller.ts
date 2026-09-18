import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';
import { z } from 'zod';

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
      'SELECT id, name, api_key, created_at FROM projects WHERE organization_id = $1 ORDER BY created_at DESC',
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
    const result = await pool.query(
      'INSERT INTO projects (name, organization_id) VALUES ($1, $2) RETURNING id, name, api_key, created_at',
      [name, orgId]
    );
    res.status(201).json({ data: result.rows[0] });
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
      'UPDATE projects SET name = $1 WHERE id = $2 AND organization_id = $3 RETURNING id, name, api_key, created_at',
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
