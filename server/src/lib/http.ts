import type { NextFunction, Request, RequestHandler, Response } from "express";

/** Wrap an async handler so rejected promises reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** The authenticated caller — safe to use only after `requireAuth`. */
export function auth(req: Request) {
  if (!req.auth) throw new Error("auth() called before requireAuth middleware");
  return req.auth;
}
