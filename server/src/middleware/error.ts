import { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export class AppError extends Error {
  public status: number;
  public code: string;

  constructor(message: string, status: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'AppError';
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      message: err.message,
      code: err.code,
      ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
    return;
  }

  console.error('Unhandled error:', err);

  res.status(500).json({
    message: config.isProduction ? 'Internal server error' : err.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}
