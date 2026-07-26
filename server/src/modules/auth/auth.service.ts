import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserModel, RefreshTokenModel, MembershipModel, OrganizationModel } from '../../models';
import { config } from '../../config';

const SALT_ROUNDS = 10;

// ── Token helpers ─────────────────────────────────────────────

export function signAccessToken(userId: string, tokenVersion: number): string {
  return jwt.sign({ userId, tokenVersion }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function signRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ── Auth service ──────────────────────────────────────────────

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string;
    tokenVersion: number;
  };
}

export async function register(
  name: string,
  email: string,
  password: string,
  ipAddress?: string,
): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Check for existing user
  const existing = await UserModel.findOne({ email: normalizedEmail });
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await UserModel.create({
    name,
    email: normalizedEmail,
    passwordHash,
    tokenVersion: 0,
  });

  const accessToken = signAccessToken(user._id.toString(), user.tokenVersion);
  const refreshToken = await storeRefreshToken(user._id.toString(), ipAddress);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function login(
  email: string,
  password: string,
  ipAddress?: string,
): Promise<AuthResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await UserModel.findOne({ email: normalizedEmail });
  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
  }

  const accessToken = signAccessToken(user._id.toString(), user.tokenVersion);
  const refreshToken = await storeRefreshToken(user._id.toString(), ipAddress);

  return {
    accessToken,
    refreshToken,
    user: toPublicUser(user),
  };
}

export async function refreshAccessToken(refreshTokenStr: string): Promise<AuthResult> {
  const tokenHash = hashToken(refreshTokenStr);
  const stored = await RefreshTokenModel.findOne({ tokenHash, isRevoked: false });

  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Invalid or expired refresh token'), { status: 401, code: 'INVALID_REFRESH_TOKEN' });
  }

  // Rotate: revoke old, issue new
  stored.isRevoked = true;
  stored.revokedAt = new Date();
  await stored.save();

  const user = await UserModel.findById(stored.userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
  }

  const accessToken = signAccessToken(user._id.toString(), user.tokenVersion);
  const newRefreshToken = await storeRefreshToken(user._id.toString());

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: toPublicUser(user),
  };
}

export async function logout(refreshTokenStr: string): Promise<void> {
  const tokenHash = hashToken(refreshTokenStr);
  await RefreshTokenModel.updateOne(
    { tokenHash },
    { $set: { isRevoked: true, revokedAt: new Date() } },
  );
}

export async function revokeAllSessions(userId: string): Promise<void> {
  // Increment tokenVersion → all existing access tokens become invalid
  await UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
  // Revoke all refresh tokens
  await RefreshTokenModel.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } },
  );
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Current password is incorrect'), { status: 401, code: 'INVALID_PASSWORD' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.tokenVersion += 1; // Revoke all existing sessions
  await user.save();

  // Revoke all refresh tokens
  await RefreshTokenModel.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } },
  );
}

export async function getUser(userId: string) {
  const user = await UserModel.findById(userId).lean().exec();
  if (!user) return null;
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; avatarUrl?: string },
) {
  const update: Record<string, string> = {};
  if (updates.name !== undefined) update.name = updates.name;
  if (updates.avatarUrl !== undefined) update.avatarUrl = updates.avatarUrl;

  const user = await UserModel.findByIdAndUpdate(userId, { $set: update }, { new: true })
    .lean()
    .exec();
  if (!user) return null;
  return toPublicUser(user);
}

// ── Helpers ───────────────────────────────────────────────────

async function storeRefreshToken(userId: string, ipAddress?: string): Promise<string> {
  const token = signRefreshToken();
  const tokenHash = hashToken(token);

  await RefreshTokenModel.create({
    userId,
    tokenHash,
    ipAddress: ipAddress || '',
    expiresAt: new Date(Date.now() + parseDuration(config.jwtRefreshExpiresIn)),
  });

  return token;
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

function toPublicUser(user: any) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}
