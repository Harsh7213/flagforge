import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message, err.stack);

  const statusCode = err.statusCode ?? 500;
  res.status(statusCode).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    statusCode,
  });
}

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested route does not exist',
    statusCode: 404,
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
