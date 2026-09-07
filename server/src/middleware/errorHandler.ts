import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError, type ErrorBody } from "../lib/errors.js";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound("Route not found"));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toBody());
    return;
  }

  if (err instanceof ZodError) {
    const body: ErrorBody = {
      message: "Request validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    };
    res.status(400).json(body);
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  ) {
    res.status(409).json({ message: "Resource already exists", code: "CONFLICT" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error", code: "INTERNAL" });
};
