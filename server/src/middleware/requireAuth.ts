import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { OrgMembershipModel, UserModel, activeUser } from "../models/index.js";
import type { AuthContext } from "../types/express.js";

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearer(req.header("authorization"));
    if (!token) throw AppError.unauthenticated("Missing access token");

    const { userId } = verifyAccessToken(token);

    // Re-read on every request, so an access token minted before the account
    // was deleted stops working immediately rather than at its 15-minute TTL.
    // Independent lookups, so they share one round trip instead of two.
    const [exists, memberships] = await Promise.all([
      UserModel.exists({ _id: userId, ...activeUser }),
      OrgMembershipModel.find({ userId }).select("organizationId role").lean(),
    ]);
    if (!exists) throw AppError.unauthenticated("Account no longer exists");

    const auth: AuthContext = {
      userId,
      orgMemberships: memberships.map((m) => ({
        organizationId: String(m.organizationId),
        role: m.role,
      })),
      orgIds: memberships.map((m) => String(m.organizationId)),
    };
    req.auth = auth;
    next();
  } catch (err) {
    next(err);
  }
};
