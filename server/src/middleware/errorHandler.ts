import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: Error & { statusCode?: number; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message, err.stack);

  const isValidationError = err instanceof ZodError;
  const statusCode = isValidationError ? 400 : (err.statusCode ?? err.status ?? 500);
  res.status(statusCode).json({
    error: isValidationError ? 'ValidationError' : err.name || 'InternalServerError',
    message: isValidationError
      ? err.issues.map(issue => issue.message).join(', ')
      : err.message || 'An unexpected error occurred',
    statusCode
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested route does not exist',
    statusCode: 404
  });
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}
