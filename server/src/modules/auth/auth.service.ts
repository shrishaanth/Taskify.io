import { AppError } from "../../lib/errors.js";
import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  verifyPassword,
} from "../../lib/tokens.js";
import {
  OrgMembershipModel,
  OrganizationModel,
  RefreshTokenModel,
  UserModel,
  type UserDoc,
} from "../../models/index.js";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

async function issueTokens(
  userId: string,
  deviceInfo?: string,
): Promise<IssuedTokens> {
  const { token, tokenHash } = generateRefreshToken();
  const refreshExpiresAt = refreshTokenExpiry();
  await RefreshTokenModel.create({
    userId,
    tokenHash,
    expiresAt: refreshExpiresAt,
    ...(deviceInfo ? { deviceInfo } : {}),
  });
  return {
    accessToken: signAccessToken(userId),
    refreshToken: token,
    refreshExpiresAt,
  };
}

export async function signup(input: {
  email: string;
  name: string;
  password: string;
  deviceInfo?: string;
}): Promise<{ user: UserDoc; tokens: IssuedTokens }> {
  const email = input.email.toLowerCase().trim();
  if (await UserModel.exists({ email })) {
    throw AppError.conflict("An account with that email already exists");
  }
  const user = await UserModel.create({
    email,
    name: input.name,
    passwordHash: await hashPassword(input.password),
  });
  // UC-1: an account is created with NO OrgMembership.
  const tokens = await issueTokens(user._id.toString(), input.deviceInfo);
  return { user, tokens };
}

export async function login(input: {
  email: string;
  password: string;
  deviceInfo?: string;
}): Promise<{ user: UserDoc; tokens: IssuedTokens }> {
  const user = await UserModel.findOne({
    email: input.email.toLowerCase().trim(),
  });
  const ok = user && (await verifyPassword(input.password, user.passwordHash));
  if (!user || !ok) {
    throw AppError.unauthenticated("Invalid email or password");
  }
  const tokens = await issueTokens(user._id.toString(), input.deviceInfo);
  return { user, tokens };
}

/** Validate a refresh token, rotate it, and mint a fresh access token. */
export async function rotate(
  rawRefreshToken: string,
  deviceInfo?: string,
): Promise<IssuedTokens> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const record = await RefreshTokenModel.findOne({ tokenHash });

  if (!record || record.revokedAt || record.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthenticated("Refresh token is invalid or expired");
  }

  record.revokedAt = new Date();
  await record.save();

  return issueTokens(record.userId.toString(), deviceInfo);
}

export async function logout(rawRefreshToken: string): Promise<void> {
  await RefreshTokenModel.updateOne(
    { tokenHash: hashRefreshToken(rawRefreshToken), revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function logoutAll(userId: string): Promise<void> {
  await RefreshTokenModel.updateMany(
    { userId, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date() } },
  );
}

export async function currentUser(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw AppError.unauthenticated("Account no longer exists");

  const memberships = await OrgMembershipModel.find({ userId }).lean();
  const orgs = await OrganizationModel.find({
    _id: { $in: memberships.map((m) => m.organizationId) },
  }).lean();
  const orgById = new Map(orgs.map((o) => [String(o._id), o]));

  return {
    user,
    memberships: memberships
      .map((m) => {
        const org = orgById.get(String(m.organizationId));
        return org
          ? {
              organizationId: String(m.organizationId),
              role: m.role,
              organization: { id: String(org._id), name: org.name, slug: org.slug },
            }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null),
  };
}
