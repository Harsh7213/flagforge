import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import { Environment } from '../types';

const ENVIRONMENTS: Environment[] = ['development', 'staging', 'production'];

const createFlagSchema = z.object({
  key: z.string().min(1).max(255).regex(/^[a-z0-9_-]+$/, {
    message: 'Flag key must only contain lowercase letters, numbers, underscores, or hyphens',
  }),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().uuid(),
});

const updateFlagSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  archived: z.boolean().optional(),
});

const toggleEnvSchema = z.object({
  enabled: z.boolean(),
});

const addRuleSchema = z.object({
  type: z.enum(['user_ids', 'groups', 'percentage']),
  value: z.union([z.array(z.string()), z.number().min(0).max(100)]),
});

async function logAudit(
  client: { query: Function },
  flagId: string,
  actor: string,
  actorRole: string,
  action: string,
  payload?: object
) {
  await client.query(
    `INSERT INTO audit_logs (id, flag_id, project_id, flag_key, flag_name, actor, actor_role, action, payload)
     SELECT $1, ff.id, ff.project_id, ff.key, ff.name, $3, $4, $5, $6
     FROM feature_flags ff WHERE ff.id = $2`,
    [uuidv4(), flagId, actor, actorRole, action, payload ? JSON.stringify(payload) : null]
  );
}

// Helpers for Multi-Tenancy Data Isolation
async function verifyProjectAccess(projectId: string, req: Request) {
  if (req.project) return; // SDK call with API key, already verified
  if (!req.user) throw new AppError('Unauthorized', 401);
  const res = await pool.query('SELECT id FROM projects WHERE id = $1 AND organization_id = $2', [projectId, req.user.organizationId]);
  if (res.rowCount === 0) throw new AppError('Project not found or unauthorized', 403);
}

async function verifyFlagAccess(flagId: string, req: Request) {
  if (req.project) return;
  if (!req.user) throw new AppError('Unauthorized', 401);
  const res = await pool.query(
    'SELECT ff.id FROM feature_flags ff JOIN projects p ON ff.project_id = p.id WHERE ff.id = $1 AND p.organization_id = $2',
    [flagId, req.user.organizationId]
  );
  if (res.rowCount === 0) throw new AppError('Flag not found or unauthorized', 403);
}

function getActor(req: Request) {
  return req.user ? req.user.id : 'system';
}

function getActorRole(req: Request) {
  return req.user?.role ?? 'system';
}

// GET /api/v1/flags?projectId=
export async function listFlags(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string || req.project?.id;
    if (!projectId) throw new AppError('projectId is required', 400);

    await verifyProjectAccess(projectId, req);

    const { archived, search } = req.query as { archived?: string; search?: string };

    let query = `
      SELECT ff.*,
        json_agg(
          json_build_object(
            'id', fe.id,
            'environment', fe.environment,
            'enabled', fe.enabled,
            'updated_at', fe.updated_at
          ) ORDER BY fe.environment
        ) AS environments
      FROM feature_flags ff
      LEFT JOIN flag_environments fe ON fe.flag_id = ff.id
      WHERE ff.project_id = $1
    `;
    const params: unknown[] = [projectId];
    let paramIdx = 2;

    if (archived !== undefined) {
      query += ` AND ff.archived = $${paramIdx++}`;
      params.push(archived === 'true');
    } else {
      query += ` AND ff.archived = false`;
    }

    if (search) {
      query += ` AND (ff.name ILIKE $${paramIdx} OR ff.key ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    query += ` GROUP BY ff.id ORDER BY ff.created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/flags/:id
export async function getFlag(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await verifyFlagAccess(id, req);

    const flagResult = await pool.query(`SELECT * FROM feature_flags WHERE id = $1`, [id]);
    if (flagResult.rows.length === 0) throw new AppError('Flag not found', 404);

    const flag = flagResult.rows[0];

    const envResult = await pool.query(
      `SELECT fe.*, 
        COALESCE(json_agg(
          json_build_object(
            'id', tr.id,
            'type', tr.type,
            'value', tr.value,
            'created_at', tr.created_at
          ) ORDER BY tr.created_at
        ) FILTER (WHERE tr.id IS NOT NULL), '[]') AS rules
       FROM flag_environments fe
       LEFT JOIN targeting_rules tr ON tr.flag_environment_id = fe.id
       WHERE fe.flag_id = $1
       GROUP BY fe.id
       ORDER BY fe.environment`,
      [id]
    );

    res.json({ data: { ...flag, environments: envResult.rows } });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/flags
export async function createFlag(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const parsed = createFlagSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const { key, name, description, projectId } = parsed.data;
    await verifyProjectAccess(projectId, req);

    const flagId = uuidv4();
    const actor = getActor(req);

    await client.query('BEGIN');

    const flagResult = await client.query(
      `INSERT INTO feature_flags (id, project_id, key, name, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [flagId, projectId, key, name, description || null]
    );

    for (const env of ENVIRONMENTS) {
      await client.query(
        `INSERT INTO flag_environments (id, flag_id, environment, enabled)
         VALUES ($1, $2, $3, false)`,
        [uuidv4(), flagId, env]
      );
    }

    await logAudit(client, flagId, actor, getActorRole(req), 'created', { key, name });
    await client.query('COMMIT');

    res.status(201).json({ data: flagResult.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PUT /api/v1/flags/:id
export async function updateFlag(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    await verifyFlagAccess(id, req);

    const parsed = updateFlagSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const { name, description, archived } = parsed.data;
    const actor = getActor(req);

    await client.query('BEGIN');

    const updates: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); params.push(name); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); params.push(description); }
    if (archived !== undefined) { updates.push(`archived = $${idx++}`); params.push(archived); }
    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await client.query(
      `UPDATE feature_flags SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    await logAudit(client, id, actor, getActorRole(req), 'updated', parsed.data);
    await client.query('COMMIT');

    res.json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// DELETE /api/v1/flags/:id
export async function deleteFlag(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    await verifyFlagAccess(id, req);

    await client.query('BEGIN');
    const flag = await client.query('SELECT key, name FROM feature_flags WHERE id = $1 FOR UPDATE', [id]);
    if (flag.rows.length === 0) throw new AppError('Flag not found', 404);

    await logAudit(client, id, getActor(req), getActorRole(req), 'deleted', flag.rows[0]);
    await client.query('DELETE FROM feature_flags WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Flag deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PATCH /api/v1/flags/:id/environments/:env/toggle
export async function toggleEnvironment(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    const env = req.params.env as string;
    await verifyFlagAccess(id, req);

    const parsed = toggleEnvSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError('enabled (boolean) is required', 400);

    const actor = getActor(req);

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE flag_environments
       SET enabled = $1, updated_at = NOW()
       WHERE flag_id = $2 AND environment = $3
       RETURNING *`,
      [parsed.data.enabled, id, env]
    );

    if (result.rows.length === 0) throw new AppError('Flag environment not found', 404);

    await logAudit(client, id, actor, getActorRole(req), 'toggled', { environment: env, enabled: parsed.data.enabled });
    await client.query('COMMIT');

    res.json({ data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/v1/flags/:id/audit
export async function getFlagAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await verifyFlagAccess(id, req);

    const result = await pool.query(
      `SELECT al.*, ff.key AS flag_key,
        CASE WHEN u.name IS NOT NULL THEN u.name ELSE al.actor END AS actor,
        COALESCE(al.actor_role, u.role, 'system') AS actor_role
       FROM audit_logs al
       JOIN feature_flags ff ON ff.id = al.flag_id
       LEFT JOIN users u ON al.actor = u.id::text
      WHERE al.flag_id = $1 ORDER BY al.created_at DESC`,
      [id]
    );
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
}

export async function addRule(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    const env = req.query.env as string;
    if (!env) throw new AppError('env is required', 400);
    await verifyFlagAccess(id, req);
    const parsed = addRuleSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    await client.query('BEGIN');
    const environment = await client.query(
      'SELECT id FROM flag_environments WHERE flag_id = $1 AND environment = $2',
      [id, env]
    );
    if (environment.rowCount === 0) throw new AppError('Flag environment not found', 404);

    const rule = await client.query(
      `INSERT INTO targeting_rules (id, flag_environment_id, type, value)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [uuidv4(), environment.rows[0].id, parsed.data.type, JSON.stringify(parsed.data.value)]
    );
    await logAudit(client, id, getActor(req), getActorRole(req), 'rule_added', { environment: env, ...parsed.data });
    await client.query('COMMIT');
    res.status(201).json({ data: rule.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function deleteRule(req: Request, res: Response, next: NextFunction) {
  const client = await pool.connect();
  try {
    const id = req.params.id as string;
    const ruleId = req.params.ruleId as string;
    await verifyFlagAccess(id, req);
    await client.query('BEGIN');
    const result = await client.query(
      `DELETE FROM targeting_rules tr USING flag_environments fe
       WHERE tr.id = $1 AND tr.flag_environment_id = fe.id AND fe.flag_id = $2
       RETURNING tr.id`,
      [ruleId, id]
    );
    if (result.rowCount === 0) throw new AppError('Targeting rule not found', 404);
    await logAudit(client, id, getActor(req), getActorRole(req), 'rule_deleted', { ruleId });
    await client.query('COMMIT');
    res.status(204).send();
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/v1/flags/:id/rules (Not used heavily but good to have)
// Delete Rule similarly protected
// Let's implement getStats
export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string || req.project?.id;
    if (!projectId) throw new AppError('projectId is required', 400);

    await verifyProjectAccess(projectId, req);

    const [totalResult, activeResult, archivedResult, envResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM feature_flags WHERE project_id = $1`, [projectId]),
      pool.query(
        `SELECT COUNT(DISTINCT ff.id) FROM feature_flags ff
         JOIN flag_environments fe ON fe.flag_id = ff.id
         WHERE ff.project_id = $1 AND fe.enabled = true AND ff.archived = false`,
        [projectId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM feature_flags WHERE project_id = $1 AND archived = true`,
        [projectId]
      ),
      pool.query(
        `SELECT fe.environment, COUNT(*) as enabled_count
         FROM flag_environments fe
         JOIN feature_flags ff ON ff.id = fe.flag_id
         WHERE ff.project_id = $1 AND fe.enabled = true AND ff.archived = false
         GROUP BY fe.environment`,
        [projectId]
      ),
    ]);

    const envStats: Record<string, number> = {};
    envResult.rows.forEach((row: { environment: string; enabled_count: string }) => {
      envStats[row.environment] = parseInt(row.enabled_count, 10);
    });

    res.json({
      data: {
        total: parseInt(totalResult.rows[0].count, 10),
        active: parseInt(activeResult.rows[0].count, 10),
        archived: parseInt(archivedResult.rows[0].count, 10),
        byEnvironment: envStats,
      },
    });
  } catch (err) {
    next(err);
  }
}
