import type { RequestHandler } from "express";
import { z } from "zod";
import { AppError } from "../lib/errors.js";

export interface RequestSchemas {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}

/**
 * The single request validator (spec §1 — exactly one validation library).
 * Parsed (and coerced) values are written back onto the request so handlers
 * see clean, typed input. 400 `VALIDATION_ERROR` on failure.
 */
export function validate(schemas: RequestSchemas): RequestHandler {
  const shape: Record<string, z.ZodTypeAny> = {};
  if (schemas.body) shape.body = schemas.body;
  if (schemas.params) shape.params = schemas.params;
  if (schemas.query) shape.query = schemas.query;
  const schema = z.object(shape);

  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(
        AppError.validation(
          "Request validation failed",
          result.error.flatten(),
        ),
      );
    }

    const data = result.data as {
      body?: unknown;
      params?: Record<string, string>;
      query?: Record<string, unknown>;
    };
    if (data.body !== undefined) req.body = data.body;
    if (data.params !== undefined) req.params = data.params;
    if (data.query !== undefined) {
      // express 5 makes req.query a getter; mutate in place to stay compatible.
      for (const key of Object.keys(req.query)) delete (req.query as Record<string, unknown>)[key];
      Object.assign(req.query, data.query);
    }
    next();
  };
}
