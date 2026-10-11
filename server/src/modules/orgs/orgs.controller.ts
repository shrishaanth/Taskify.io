import type { Request, Response } from "express";
import { auth } from "../../lib/http.js";
import { orgDto, orgInviteDto, userDto } from "../../lib/serialize.js";
import { signAccessToken, verifyAccessToken } from "../../lib/tokens.js";
import { AppError } from "../../lib/errors.js";
import {
  emitOrgMemberChanged,
  emitOrgMemberRemoved,
} from "../../realtime/emit.js";
import {
  evictUserFromRooms,
  joinUserToRooms,
} from "../../realtime/io.js";
import * as service from "./orgs.service.js";

export async function create(req: Request, res: Response) {
  const org = await service.createOrg(req.body.name, auth(req).userId);
  res.status(201).json(orgDto(org));
}

export async function get(req: Request, res: Response) {
  const org = await service.getOrg(req.params.orgId);
  res.json(orgDto(org));
}

export async function update(req: Request, res: Response) {
  const org = await service.updateOrg(req.params.orgId, req.body);
  res.json(orgDto(org));
}

export async function destroy(req: Request, res: Response) {
  await service.deleteOrg(req.params.orgId);
  res.status(204).end();
}

export async function members(req: Request, res: Response) {
  const rows = await service.listMembers(req.params.orgId);
  res.json(rows.map((r) => ({ user: userDto(r.user), role: r.role })));
}

export async function invite(req: Request, res: Response) {
  const inv = await service.createInvite({
    orgId: req.params.orgId,
    email: req.body.email,
    role: req.body.role,
    invitedById: auth(req).userId,
  });
  res.status(201).json({
    id: String(inv._id),
    email: inv.email,
    role: inv.role,
    token: inv.token,
    expiresAt: inv.expiresAt.toISOString(),
  });
}

export async function listInvites(req: Request, res: Response) {
  const rows = await service.listPendingInvites(req.params.orgId);
  res.json(
    rows.map(({ invite, invitedBy }) =>
      orgInviteDto(invite, invitedBy ? { invitedBy: userDto(invitedBy) } : {}),
    ),
  );
}

export async function revokeInvite(req: Request, res: Response) {
  await service.revokeInvite(req.params.orgId, req.params.inviteId);
  res.status(204).end();
}

export async function myInvites(req: Request, res: Response) {
  const rows = await service.listInvitesForUser(auth(req).userId);
  res.json(
    rows.map(({ invite, org }) => ({
      ...orgInviteDto(invite),
      organization: orgDto(org),
    })),
  );
}

export async function acceptInvite(req: Request, res: Response) {
  let authUserId: string | undefined;
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    authUserId = verifyAccessToken(header.slice(7).trim()).userId;
  }

  const result = await service.acceptInvite(req.params.inviteToken, {
    ...(authUserId ? { authUserId } : {}),
    ...(req.body?.name ? { name: req.body.name } : {}),
    ...(req.body?.password ? { password: req.body.password } : {}),
  });

  // The new member's open tabs start hearing about the org straight away, and
  // everyone already looking at the member list sees them appear.
  joinUserToRooms(result.userId, [`org:${result.organizationId}`]);
  emitOrgMemberChanged(result.organizationId, {
    userId: result.userId,
    role: result.role,
  });

  const payload: Record<string, unknown> = {
    organizationId: result.organizationId,
    role: result.role,
  };

  if (result.createdUser) {
    payload.user = userDto(result.createdUser);
    payload.accessToken = signAccessToken(result.userId);
  }

  res.status(result.createdUser ? 201 : 200).json(payload);
}

export async function changeRole(req: Request, res: Response) {
  const m = await service.changeMemberRole(
    req.params.orgId,
    req.params.userId,
    req.body.role,
    actorRole(req),
  );
  emitOrgMemberChanged(req.params.orgId, {
    userId: String(m.userId),
    role: m.role,
  });
  res.json({ userId: String(m.userId), role: m.role });
}

export async function remove(req: Request, res: Response) {
  const { orgId, userId } = req.params;
  const { projectIds, boardIds } = await service.removeMember(
    orgId,
    userId,
    actorRole(req),
  );
  emitOrgMemberRemoved(orgId, userId);
  // Their sockets must stop hearing about anything in this organization.
  evictUserFromRooms(userId, [
    `org:${orgId}`,
    ...projectIds.map((id) => `project:${id}`),
    ...boardIds.map((id) => `board:${id}`),
  ]);
  res.status(204).end();
}

function actorRole(req: Request) {
  if (!req.org) throw AppError.forbidden();
  return req.org.role;
}
