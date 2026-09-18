import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { evaluateFlag } from '../services/evaluation.service';
import { AppError } from '../middleware/errorHandler';

const evaluateSchema = z.object({
  flagKey: z.string().min(1),
  projectId: z.string().uuid().optional(),
  environment: z.enum(['development', 'staging', 'production']),
  userId: z.string().optional(),
  groups: z.array(z.string()).optional(),
});

const batchEvaluateSchema = z.object({
  flagKeys: z.array(z.string().min(1)),
  projectId: z.string().uuid().optional(),
  environment: z.enum(['development', 'staging', 'production']),
  userId: z.string().optional(),
  groups: z.array(z.string()).optional(),
});

// POST /api/v1/evaluate
export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = evaluateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);
    if (parsed.data.projectId && req.project?.id !== parsed.data.projectId) {
      throw new AppError('API key does not belong to the requested project', 403);
    }

    const result = await evaluateFlag({ ...parsed.data, projectId: req.project!.id });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/evaluate/batch
export async function batchEvaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = batchEvaluateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);
    if (parsed.data.projectId && req.project?.id !== parsed.data.projectId) {
      throw new AppError('API key does not belong to the requested project', 403);
    }

    const { flagKeys, userId, groups, environment } = parsed.data;
    const projectId = req.project!.id;

    const results = await Promise.all(
      flagKeys.map((flagKey) =>
        evaluateFlag({ flagKey, projectId, environment, userId, groups })
      )
    );

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}
