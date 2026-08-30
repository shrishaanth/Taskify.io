import { describe, it, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
} from "./tokens.js";
import { config } from "../config/index.js";
import { AppError } from "./errors.js";

describe("passwords", () => {
  it("hashes with bcrypt and verifies round-trip", async () => {
    const hash = await hashPassword("hunter2!!");
    expect(hash).toMatch(/^\$2[aby]\$/);
    expect(hash).not.toContain("hunter2");
    expect(await verifyPassword("hunter2!!", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

describe("access tokens", () => {
  it("signs a userId-only JWT and verifies it", () => {
    const token = signAccessToken("user-123");
    const decoded = jwt.decode(token) as Record<string, unknown>;
    expect(decoded.userId).toBe("user-123");
    // no role claims are embedded
    expect(decoded.role).toBeUndefined();
    expect(verifyAccessToken(token)).toEqual({ userId: "user-123" });
  });

  it("rejects a token signed with the wrong secret", () => {
    const forged = jwt.sign({ userId: "x" }, "not-the-secret");
    expect(() => verifyAccessToken(forged)).toThrow(AppError);
    try {
      verifyAccessToken(forged);
    } catch (e) {
      expect((e as AppError).code).toBe("UNAUTHENTICATED");
    }
  });

  it("rejects an expired token", () => {
    const expired = jwt.sign({ userId: "x" }, config.JWT_ACCESS_SECRET, {
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow(/expired/i);
  });

  it("rejects a token with no userId claim", () => {
    const bad = jwt.sign({ foo: "bar" }, config.JWT_ACCESS_SECRET);
    expect(() => verifyAccessToken(bad)).toThrow(AppError);
  });
});

describe("refresh tokens", () => {
  it("returns an opaque token plus its sha-256 hash", () => {
    const { token, tokenHash } = generateRefreshToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tokenHash).toHaveLength(64);
    expect(hashRefreshToken(token)).toBe(tokenHash);
    expect(token).not.toEqual(tokenHash);
  });

  it("computes the expiry from the configured TTL days", () => {
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const exp = refreshTokenExpiry();
    const days = (exp.getTime() - Date.UTC(2026, 0, 1)) / 86_400_000;
    expect(days).toBe(config.REFRESH_TOKEN_TTL_DAYS);
    vi.useRealTimers();
  });
});
