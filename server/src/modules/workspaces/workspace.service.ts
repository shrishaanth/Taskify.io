import { WorkspaceModel, MembershipModel } from '../../models';
import type { CreateWorkspaceInput } from '@taskify/shared';

export async function createWorkspace(orgId: string, input: CreateWorkspaceInput, creatorId: string) {
  const ws = await WorkspaceModel.create({
    ...input,
    organizationId: orgId,
  });

  // Auto-add creator as owner
  await MembershipModel.create({
    scopeType: 'workspace',
    scopeId: ws._id,
    userId: creatorId,
    role: 'owner',
    addedBy: creatorId,
  });

  return toPublicWorkspace(ws);
}

export async function listWorkspaces(orgId: string) {
  const workspaces = await WorkspaceModel.find({ organizationId: orgId })
    .sort({ name: 1 })
    .lean()
    .exec();
  return workspaces.map(toPublicWorkspace);
}

export async function getWorkspace(wsId: string) {
  const ws = await WorkspaceModel.findById(wsId).lean().exec();
  if (!ws) return null;
  return toPublicWorkspace(ws);
}

export async function updateWorkspace(wsId: string, input: Partial<CreateWorkspaceInput>) {
  const ws = await WorkspaceModel.findByIdAndUpdate(wsId, { $set: input }, { new: true, runValidators: true })
    .lean()
    .exec();
  if (!ws) return null;
  return toPublicWorkspace(ws);
}

export async function deleteWorkspace(wsId: string): Promise<boolean> {
  const result = await WorkspaceModel.findByIdAndDelete(wsId).exec();
  if (!result) return false;
  await MembershipModel.deleteMany({ scopeType: 'workspace', scopeId: wsId }).exec();
  return true;
}

function toPublicWorkspace(ws: any) {
  return {
    id: ws._id.toString(),
    organizationId: ws.organizationId?.toString(),
    name: ws.name,
    slug: ws.slug,
    description: ws.description || '',
    avatarUrl: ws.avatarUrl || '',
    leadId: ws.leadId?.toString() || null,
    visibility: ws.visibility || 'open',
    createdAt: ws.createdAt?.toISOString(),
    updatedAt: ws.updatedAt?.toISOString(),
  };
}
