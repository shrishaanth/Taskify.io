import type { RequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

const pass: RequestHandler = (_req, _res, next) => next();

function limiter(max: number, windowMinutes: number): RequestHandler {
  // The suites sign up and log in hundreds of times from one address.
  if (config.isTest) return pass;
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit: max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      message: "Too many attempts. Please wait a few minutes and try again.",
      code: "RATE_LIMITED",
    },
  });
}

/**
 * Credential endpoints. Each attempt costs a bcrypt comparison, so without a
 * cap they are both a password-guessing surface and a way to burn CPU.
 */
export const credentialLimiter = limiter(20, 15);

/** Token refresh happens routinely, so it gets far more room. */
export const refreshLimiter = limiter(120, 15);
