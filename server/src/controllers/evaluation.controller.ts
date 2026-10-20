import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { evaluateFlag } from '../services/evaluation.service';
import { AppError } from '../middleware/errorHandler';

const evaluateSchema = z
  .object({
    flagKey: z.string().min(1),
    environment: z.enum(['development', 'staging', 'production']),
    userName: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional()
  })
  .strict();

const batchEvaluateSchema = z
  .object({
    flagKeys: z.array(z.string().min(1)).max(50, 'A batch can evaluate at most 50 flags'),
    environment: z.enum(['development', 'staging', 'production']),
    userName: z.array(z.string()).optional(),
    groups: z.array(z.string()).optional()
  })
  .strict();

// POST /api/v1/evaluate
export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = evaluateSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

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

    const { flagKeys, userName, groups, environment } = parsed.data;
    const projectId = req.project!.id;

    const results = await Promise.all(
      flagKeys.map(flagKey => evaluateFlag({ flagKey, projectId, environment, userName, groups }))
    );

    res.json({ data: results });
  } catch (err) {
    next(err);
  }
}
