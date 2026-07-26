import { MembershipModel, UserModel } from '../../models';
import type { ScopeType, RoleName } from '@taskify/shared';

export async function listMembers(scopeType: ScopeType, scopeId: string) {
  const memberships = await MembershipModel.find({ scopeType, scopeId })
    .populate('userId', 'name email avatarUrl')
    .sort({ role: 1, createdAt: 1 })
    .lean()
    .exec();

  return memberships.map((m: any) => ({
    id: m._id.toString(),
    userId: m.userId?._id?.toString() || m.userId?.toString(),
    name: m.userId?.name || 'Unknown',
    email: m.userId?.email || '',
    avatarUrl: m.userId?.avatarUrl || '',
    role: m.role,
    addedBy: m.addedBy?.toString() || null,
    createdAt: m.createdAt?.toISOString(),
  }));
}

export async function addMember(
  scopeType: ScopeType,
  scopeId: string,
  userId: string,
  role: RoleName,
  addedBy: string,
) {
  // Verify user exists
  const user = await UserModel.findById(userId).lean().exec();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
  }

  const membership = await MembershipModel.create({
    scopeType,
    scopeId,
    userId,
    role,
    addedBy,
  });

  return {
    id: membership._id.toString(),
    userId: membership.userId.toString(),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    role: membership.role,
    createdAt: membership.createdAt.toISOString(),
  };
}

export async function updateMemberRole(
  scopeType: ScopeType,
  scopeId: string,
  targetUserId: string,
  newRole: RoleName,
  actorUserId: string,
) {
  // Cannot change own role via this endpoint
  if (targetUserId === actorUserId) {
    throw Object.assign(new Error('Cannot change your own role'), { status: 400, code: 'SELF_ROLE_CHANGE' });
  }

  const membership = await MembershipModel.findOne({ scopeType, scopeId, userId: targetUserId }).exec();
  if (!membership) {
    throw Object.assign(new Error('Membership not found'), { status: 404, code: 'MEMBERSHIP_NOT_FOUND' });
  }

  membership.role = newRole;
  await membership.save();

  return {
    id: membership._id.toString(),
    userId: membership.userId.toString(),
    role: membership.role,
  };
}

export async function removeMember(
  scopeType: ScopeType,
  scopeId: string,
  targetUserId: string,
  actorUserId: string,
) {
  if (targetUserId === actorUserId) {
    throw Object.assign(new Error('Cannot remove yourself'), { status: 400, code: 'SELF_REMOVE' });
  }

  const result = await MembershipModel.deleteOne({ scopeType, scopeId, userId: targetUserId }).exec();
  if (result.deletedCount === 0) {
    throw Object.assign(new Error('Membership not found'), { status: 404, code: 'MEMBERSHIP_NOT_FOUND' });
  }
}

export async function getUserRoleInScope(
  userId: string,
  scopeType: ScopeType,
  scopeId: string,
): Promise<RoleName | null> {
  const membership = await MembershipModel.findOne({ scopeType, scopeId, userId })
    .select('role')
    .lean()
    .exec();
  return membership?.role as RoleName | null;
}
