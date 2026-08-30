import type { RequestHandler } from "express";
import { AppError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";
import { OrgMembershipModel, UserModel } from "../models/index.js";
import type { AuthContext } from "../types/express.js";

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token.trim();
}

/**
 * Verifies the access token, confirms the user still exists, and resolves the
 * caller's Org memberships **once per request** (spec §3). Downstream role
 * middleware reads `req.auth`, never a role claim from the token (§4).
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = extractBearer(req.header("authorization"));
    if (!token) throw AppError.unauthenticated("Missing access token");

    const { userId } = verifyAccessToken(token);

    const exists = await UserModel.exists({ _id: userId });
    if (!exists) throw AppError.unauthenticated("Account no longer exists");

    const memberships = await OrgMembershipModel.find({ userId })
      .select("organizationId role")
      .lean();

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
