import { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Validates the specified part of the request against a Zod schema.
 */
export function validate(schema: ZodSchema, source: ValidateTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({ message: 'Validation failed', errors });
      return;
    }

    // Replace with parsed (and transformed) data
    req[source] = result.data;
    next();
  };
}
