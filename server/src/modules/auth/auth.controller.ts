import type { Request, Response } from "express";
import { AppError } from "../../lib/errors.js";
import { userDto } from "../../lib/serialize.js";
import { auth } from "../../lib/http.js";
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  setRefreshCookie,
} from "../../lib/refreshCookie.js";
import { disconnectUser } from "../../realtime/io.js";
import * as service from "./auth.service.js";

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
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function logoutAll(req: Request, res: Response) {
  await service.logoutAll(auth(req).userId);
  disconnectUser(auth(req).userId);
  clearRefreshCookie(res);
  res.status(204).end();
}

export async function me(req: Request, res: Response) {
  const { user, memberships } = await service.currentUser(auth(req).userId);
  res.json({ user: userDto(user), memberships });
}

export async function deletionPreview(req: Request, res: Response) {
  res.json(await service.previewAccountDeletion(auth(req).userId));
}

export async function deleteAccount(req: Request, res: Response) {
  await service.deleteAccount(auth(req).userId, req.body);
  // Revoking tokens does nothing to connections that are already open.
  disconnectUser(auth(req).userId);
  clearRefreshCookie(res);
  res.status(204).end();
}
