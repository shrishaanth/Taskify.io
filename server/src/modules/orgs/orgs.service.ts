import { randomBytes } from "node:crypto";
import { AppError } from "../../lib/errors.js";
import { uniqueSlug } from "../../lib/slug.js";
import { hashPassword } from "../../lib/tokens.js";
import {
  OrgInviteModel,
  OrgMembershipModel,
  OrganizationModel,
  UserModel,
  type OrgRole,
  type UserDoc,
} from "../../models/index.js";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function createOrg(name: string, ownerId: string) {
  const slug = await uniqueSlug(name, async (s) =>
    Boolean(await OrganizationModel.exists({ slug: s })),
  );
  const org = await OrganizationModel.create({ name, slug });
  await OrgMembershipModel.create({
    organizationId: org._id,
    userId: ownerId,
    role: "owner",
  });
  return org;
}

export async function getOrg(orgId: string) {
  const org = await OrganizationModel.findById(orgId);
  if (!org) throw AppError.notFound();
  return org;
}

export async function updateOrg(
  orgId: string,
  patch: { name?: string; slug?: string },
) {
  const org = await getOrg(orgId);
  if (patch.name !== undefined) org.name = patch.name;
  if (patch.slug !== undefined) {
    const clash = await OrganizationModel.exists({
      slug: patch.slug,
      _id: { $ne: org._id },
    });
    if (clash) throw AppError.conflict("That slug is taken");
    org.slug = patch.slug;
  }
  await org.save();
  return org;
}

export async function listMembers(orgId: string) {
  const memberships = await OrgMembershipModel.find({ organizationId: orgId }).lean();
  const users = await UserModel.find({
    _id: { $in: memberships.map((m) => m.userId) },
  }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return memberships
    .map((m) => {
      const u = byId.get(String(m.userId));
      return u ? { user: u, role: m.role } : null;
    })
    .filter((x): x is { user: (typeof users)[number]; role: OrgRole } => x !== null);
}

export async function createInvite(input: {
  orgId: string;
  email: string;
  role: "admin" | "member";
  invitedById: string;
}) {
  const email = input.email.toLowerCase().trim();

  // Already a member of THIS org? (membership is per-org — a member of another
  // org is fine, UC-2.)
  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    const already = await OrgMembershipModel.exists({
      organizationId: input.orgId,
      userId: existingUser._id,
    });
    if (already) throw AppError.conflict("That user is already a member");
  }

  const invite = await OrgInviteModel.create({
    organizationId: input.orgId,
    email,
    role: input.role,
    token: randomBytes(24).toString("base64url"),
    invitedById: input.invitedById,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });
  return invite;
}

interface AcceptContext {
  /** Set when the caller is already authenticated. */
  authUserId?: string;
  /** Provided when creating a brand-new account as part of accepting. */
  name?: string;
  password?: string;
}

export async function acceptInvite(token: string, ctx: AcceptContext) {
  const invite = await OrgInviteModel.findOne({ token });
  if (
    !invite ||
    invite.acceptedAt ||
    invite.expiresAt.getTime() < Date.now()
  ) {
    throw AppError.notFound("Invite not found or no longer valid");
  }

  let userId: string;
  let createdUser: UserDoc | null = null;

  if (ctx.authUserId) {
    const user = await UserModel.findById(ctx.authUserId);
    if (!user) throw AppError.unauthenticated();
    // The link was mailed to a specific address.
    if (user.email !== invite.email) {
      throw AppError.forbidden("This invite is for a different email address");
    }
    userId = user._id.toString();
  } else {
    // UC-2 3a — new account created in one step.
    const existing = await UserModel.findOne({ email: invite.email });
    if (existing) {
      throw AppError.conflict("An account exists — log in, then accept the invite");
    }
    if (!ctx.name || !ctx.password) {
      throw AppError.validation("name and password are required to create an account");
    }
    createdUser = await UserModel.create({
      email: invite.email,
      name: ctx.name,
      passwordHash: await hashPassword(ctx.password),
    });
    userId = createdUser._id.toString();
  }

  await OrgMembershipModel.updateOne(
    { organizationId: invite.organizationId, userId },
    { $setOnInsert: { role: invite.role } },
    { upsert: true },
  );

  invite.acceptedAt = new Date();
  await invite.save();

  return {
    organizationId: String(invite.organizationId),
    role: invite.role,
    userId,
    createdUser,
  };
}

export async function changeMemberRole(
  orgId: string,
  userId: string,
  role: OrgRole,
) {
  const membership = await OrgMembershipModel.findOne({
    organizationId: orgId,
    userId,
  });
  if (!membership) throw AppError.notFound();

  // FR-1.6 — never leave the org without an Owner.
  if (membership.role === "owner" && role !== "owner") {
    const owners = await OrgMembershipModel.countDocuments({
      organizationId: orgId,
      role: "owner",
    });
    if (owners <= 1) {
      throw AppError.conflict("The organization must keep at least one Owner");
    }
  }

  membership.role = role;
  await membership.save();
  return membership;
}

export async function removeMember(orgId: string, userId: string) {
  const membership = await OrgMembershipModel.findOne({
    organizationId: orgId,
    userId,
  });
  if (!membership) throw AppError.notFound();

  if (membership.role === "owner") {
    const owners = await OrgMembershipModel.countDocuments({
      organizationId: orgId,
      role: "owner",
    });
    if (owners <= 1) {
      throw AppError.conflict("Cannot remove the last Owner");
    }
  }

  await membership.deleteOne();
}
