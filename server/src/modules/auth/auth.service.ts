import { AppError } from "../../lib/errors.js";
import { deleteOrgCascade } from "../../lib/cascade.js";
import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
  verifyPassword,
} from "../../lib/tokens.js";
import {
  CardModel,
  NotificationModel,
  OrgInviteModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectMembershipModel,
  RefreshTokenModel,
  SubtaskModel,
  UserModel,
  DELETED_USER_NAME,
  activeUser,
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
    ...activeUser,
  });
  const ok = user && (await verifyPassword(input.password, user.passwordHash));
  if (!user || !ok) {
    throw AppError.unauthenticated("Invalid email or password");
  }
  const tokens = await issueTokens(user._id.toString(), input.deviceInfo);
  return { user, tokens };
}

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

  // A token minted before the account was deleted must not be exchangeable.
  const stillActive = await UserModel.exists({
    _id: record.userId,
    ...activeUser,
  });
  if (!stillActive) {
    throw AppError.unauthenticated("Account no longer exists");
  }

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

export interface OrgDeletionImpact {
  id: string;
  name: string;
  memberCount: number;
}

export interface DeletionPreview {
  /** Orgs the caller solely owns that still have other members. Blocking. */
  blockingOrgs: OrgDeletionImpact[];
  /** Orgs the caller is the only member of — deleted along with the account. */
  orgsToDelete: OrgDeletionImpact[];
}

/**
 * Works out what deleting this account would do, without changing anything.
 * The same checks run again inside `deleteAccount`, so a membership that
 * changes between the preview and the confirmation cannot slip through.
 */
export async function previewAccountDeletion(
  userId: string,
): Promise<DeletionPreview> {
  const owned = await OrgMembershipModel.find({ userId, role: "owner" })
    .select("organizationId")
    .lean();

  const blockingOrgs: OrgDeletionImpact[] = [];
  const orgsToDelete: OrgDeletionImpact[] = [];
  if (owned.length === 0) return { blockingOrgs, orgsToDelete };

  const orgs = await OrganizationModel.find({
    _id: { $in: owned.map((m) => m.organizationId) },
  })
    .select("_id name")
    .lean();

  for (const org of orgs) {
    const [otherMembers, otherOwners] = await Promise.all([
      OrgMembershipModel.countDocuments({
        organizationId: org._id,
        userId: { $ne: userId },
      }),
      OrgMembershipModel.countDocuments({
        organizationId: org._id,
        userId: { $ne: userId },
        role: "owner",
      }),
    ]);

    const impact: OrgDeletionImpact = {
      id: String(org._id),
      name: org.name,
      memberCount: otherMembers + 1,
    };

    if (otherMembers === 0) {
      // Nobody else can reach it once the account is gone.
      orgsToDelete.push(impact);
    } else if (otherOwners === 0) {
      // Other people would be left without an Owner.
      blockingOrgs.push(impact);
    }
  }

  return { blockingOrgs, orgsToDelete };
}

/**
 * Soft-deletes the account: identity is scrubbed and every access path is
 * revoked, while the document survives so authored comments and cards keep a
 * resolvable author. The original email is released for a future signup.
 */
export async function deleteAccount(
  userId: string,
  input: { password: string; confirmEmail: string },
): Promise<{ deletedOrgs: OrgDeletionImpact[] }> {
  const user = await UserModel.findOne({ _id: userId, ...activeUser });
  if (!user) throw AppError.unauthenticated("Account no longer exists");

  if (input.confirmEmail.toLowerCase().trim() !== user.email) {
    throw AppError.validation("That email does not match this account");
  }

  if (!(await verifyPassword(input.password, user.passwordHash))) {
    throw AppError.unauthenticated("That password is incorrect");
  }

  const { blockingOrgs, orgsToDelete } = await previewAccountDeletion(userId);
  if (blockingOrgs.length > 0) {
    throw AppError.conflict(
      blockingOrgs.length === 1
        ? `You are the only Owner of ${blockingOrgs[0]?.name}. Promote another Owner or delete the organization first.`
        : `You are the only Owner of ${blockingOrgs.length} organizations. Promote another Owner in each, or delete them first.`,
      { code: "SOLE_OWNER_ORGS", organizations: blockingOrgs },
    );
  }

  // Organizations nobody else belongs to go with the account.
  for (const org of orgsToDelete) await deleteOrgCascade(org.id);

  await Promise.all([
    // Access is revoked before identity is scrubbed, so a race cannot leave a
    // usable session behind.
    RefreshTokenModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    ),
    OrgMembershipModel.deleteMany({ userId }),
    ProjectMembershipModel.deleteMany({ userId }),
    NotificationModel.deleteMany({ userId }),
    // Invitations addressed to the freed email must not survive it.
    OrgInviteModel.deleteMany({ email: user.email }),
    // Leave the work, drop the person from it.
    CardModel.updateMany({ assigneeIds: userId }, { $pull: { assigneeIds: userId } }),
    SubtaskModel.updateMany({ assigneeId: userId }, { $set: { assigneeId: null } }),
  ]);

  user.set({
    deletedAt: new Date(),
    name: DELETED_USER_NAME,
    // `.invalid` is reserved by RFC 2606, so this can never collide with or
    // route to a real address, and it keeps the unique index satisfied.
    email: `deleted+${String(user._id)}@account.invalid`,
    // Unusable hash: bcrypt never produces this, so no password can match.
    passwordHash: "!deleted",
    avatarUrl: undefined,
  });
  await user.save();

  return { deletedOrgs: orgsToDelete };
}

export async function currentUser(userId: string) {
  const user = await UserModel.findOne({ _id: userId, ...activeUser });
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
