import type { Request, Response } from "express";
import { config } from "../../config/index.js";
import { AppError } from "../../lib/errors.js";
import { userDto } from "../../lib/serialize.js";
import { auth } from "../../lib/http.js";
import * as service from "./auth.service.js";

const REFRESH_COOKIE = "taskify_refresh";

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.isProduction,
    expires: expiresAt,
    path: "/api/v1/auth",
  });
}

function readRefreshToken(req: Request): string {
  const fromBody =
    typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
  const fromCookie: string = req.cookies?.[REFRESH_COOKIE] ?? "";
  const token = fromBody || fromCookie;
  if (!token) throw AppError.unauthenticated("Missing refresh token");
  return token;
}

const deviceInfo = (req: Request) => req.get("user-agent") ?? undefined;

export async function signup(req: Request, res: Response) {
  const { user, tokens } = await service.signup({
    ...req.body,
    ...(deviceInfo(req) ? { deviceInfo: deviceInfo(req) } : {}),
  });
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  res.status(201).json({
    user: userDto(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function login(req: Request, res: Response) {
  const { user, tokens } = await service.login({
    ...req.body,
    ...(deviceInfo(req) ? { deviceInfo: deviceInfo(req) } : {}),
  });
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  res.json({
    user: userDto(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function refresh(req: Request, res: Response) {
  const tokens = await service.rotate(
    readRefreshToken(req),
    deviceInfo(req) ?? undefined,
  );
  setRefreshCookie(res, tokens.refreshToken, tokens.refreshExpiresAt);
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
}

export async function logout(req: Request, res: Response) {
  await service.logout(readRefreshToken(req));
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.status(204).end();
}

export async function logoutAll(req: Request, res: Response) {
  await service.logoutAll(auth(req).userId);
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const { user, memberships } = await service.currentUser(auth(req).userId);
  res.json({ user: userDto(user), memberships });
}
