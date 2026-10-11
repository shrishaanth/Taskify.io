import type { Response } from "express";
import { config } from "../config/index.js";

export const REFRESH_COOKIE = "taskify_refresh";
const COOKIE_PATH = "/api/v1/auth";

/** Every endpoint that starts a session must set this, or it ends in minutes. */
export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    expires: expiresAt,
    path: COOKIE_PATH,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
}
