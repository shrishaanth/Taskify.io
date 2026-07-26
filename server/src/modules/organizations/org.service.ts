import { OrganizationModel, MembershipModel } from '../../models';
import type { CreateOrgInput, UpdateOrgInput } from '@taskify/shared';

export async function createOrg(input: CreateOrgInput, ownerId: string) {
  const org = await OrganizationModel.create({
    ...input,
    ownerId,
  });

  // Create owner membership
  await MembershipModel.create({
    scopeType: 'organization',
    scopeId: org._id,
    userId: ownerId,
    role: 'owner',
    addedBy: ownerId,
  });

  return toPublicOrg(org);
}

export async function listOrgs(userId: string) {
  const memberships = await MembershipModel.find({
    userId,
    scopeType: 'organization',
  })
    .select('scopeId')
    .lean()
    .exec();

  const orgIds = memberships.map((m) => m.scopeId);
  const orgs = await OrganizationModel.find({ _id: { $in: orgIds } })
    .sort({ name: 1 })
    .lean()
    .exec();

  return orgs.map(toPublicOrg);
}

export async function getOrg(orgId: string) {
  const org = await OrganizationModel.findById(orgId).lean().exec();
  if (!org) return null;
  return toPublicOrg(org);
}

export async function getOrgBySlug(slug: string) {
  const org = await OrganizationModel.findOne({ slug }).lean().exec();
  if (!org) return null;
  return toPublicOrg(org);
}

export async function updateOrg(orgId: string, input: UpdateOrgInput) {
  const org = await OrganizationModel.findByIdAndUpdate(orgId, { $set: input }, { new: true, runValidators: true })
    .lean()
    .exec();
  if (!org) return null;
  return toPublicOrg(org);
}

export async function deleteOrg(orgId: string): Promise<boolean> {
  const result = await OrganizationModel.findByIdAndDelete(orgId).exec();
  if (!result) return false;
  // Clean up memberships
  await MembershipModel.deleteMany({ scopeType: 'organization', scopeId: orgId }).exec();
  return true;
}

// ── Helpers ───────────────────────────────────────────────────

function toPublicOrg(org: any) {
  return {
    id: org._id.toString(),
    slug: org.slug,
    name: org.name,
    description: org.description || '',
    avatarUrl: org.avatarUrl || '',
    ownerId: org.ownerId?.toString(),
    settings: org.settings || { allowedDomains: [], defaultRole: 'member' },
    createdAt: org.createdAt?.toISOString(),
    updatedAt: org.updatedAt?.toISOString(),
  };
}
