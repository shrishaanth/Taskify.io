import type { Response } from "express";
import { config } from "../config/index.js";

export const REFRESH_COOKIE = "taskify_refresh";
const COOKIE_PATH = "/api/v1/auth";

/**
 * In production the SPA and the API live on different sites (Vercel and
 * Render). A SameSite=Lax cookie is neither stored from nor sent with a
 * cross-site fetch, so the refresh cookie has to be SameSite=None there,
 * which browsers only accept together with Secure.
 */
const attributes = () =>
  ({
    httpOnly: true,
    sameSite: config.isProduction ? "none" : "lax",
    secure: config.isProduction,
    path: COOKIE_PATH,
  }) as const;

/** Every endpoint that starts a session must set this, or it ends in minutes. */
export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, { ...attributes(), expires: expiresAt });
}

export function clearRefreshCookie(res: Response) {
  // Browsers only drop a cookie when the attributes match the ones it was set with.
  res.clearCookie(REFRESH_COOKIE, attributes());
}
