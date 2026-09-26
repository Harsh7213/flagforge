import rateLimit from 'express-rate-limit';

const projectKey = (req: Express.Request) => req.project!.id;

const createEvaluationLimit = (limit: number) => rateLimit({
  windowMs: 60 * 1000,
  limit,
  keyGenerator: projectKey,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many evaluation requests. Please retry later.' },
});

export const evaluationLimit = createEvaluationLimit(300);
export const batchEvaluationLimit = createEvaluationLimit(60);