import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { AppError } from "./errors.js";

/* ------------------------------------------------------------------ */
/* Passwords — bcrypt (NFR-1.4)                                        */
/* ------------------------------------------------------------------ */
const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------ */
/* Access tokens — short-lived JWT, `userId` claim only (spec §5)     */
/* ------------------------------------------------------------------ */
export interface AccessTokenClaims {
  userId: string;
}

export function signAccessToken(userId: string): string {
  const expiresIn = config.ACCESS_TOKEN_TTL as NonNullable<
    jwt.SignOptions["expiresIn"]
  >;
  return jwt.sign({ userId }, config.JWT_ACCESS_SECRET, { expiresIn });
}

/** Verifies signature + expiry. Throws `AppError.unauthenticated` on failure. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof (decoded as { userId?: unknown }).userId !== "string"
    ) {
      throw new Error("malformed claims");
    }
    return { userId: (decoded as { userId: string }).userId };
  } catch {
    throw AppError.unauthenticated("Invalid or expired access token");
  }
}

/* ------------------------------------------------------------------ */
/* Refresh tokens — opaque random string, only the hash is stored     */
/* ------------------------------------------------------------------ */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + config.refreshTokenTtlMs);
}
