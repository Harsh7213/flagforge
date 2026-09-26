import { Request, Response, NextFunction } from 'express';
import pool from '../db/pool';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string;
    const limit = parseInt(req.query.limit as string) || 50;

    let query = `
      SELECT al.*,
        CASE WHEN u.name IS NOT NULL THEN u.name ELSE al.actor END as actor,
        COALESCE(al.actor_role, u.role, 'system') AS actor_role
      FROM audit_logs al
      JOIN projects p ON al.project_id = p.id
      LEFT JOIN users u ON al.actor = u.id::text
    `;
    const params: (string | number)[] = [];

    if (req.user) {
      // Dashboard request: restrict to user's organization
      query += ` WHERE p.organization_id = $1`;
      params.push(req.user.organizationId);

      if (projectId) {
        query += ` AND al.project_id = $2`;
        params.push(projectId);
      }
    } else {
      // Should not be reached since requireAuth is on this route, but fallback
      query += ` WHERE 1=0`; 
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({
      data: result.rows,
      total: result.rowCount, // Not exactly total, but enough for UI
    });
  } catch (error) {
    next(error);
  }
};
