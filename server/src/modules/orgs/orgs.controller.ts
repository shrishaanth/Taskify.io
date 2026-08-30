import type { Request, Response } from "express";
import { auth } from "../../lib/http.js";
import { orgDto, orgInviteDto, userDto } from "../../lib/serialize.js";
import { signAccessToken, verifyAccessToken } from "../../lib/tokens.js";
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
  // Authenticated path if a valid bearer token is present; else the
  // create-account path (UC-2 3a).
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

  const payload: Record<string, unknown> = {
    organizationId: result.organizationId,
    role: result.role,
  };

  // A brand-new account is logged straight in.
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
  );
  res.json({ userId: String(m.userId), role: m.role });
}

export async function remove(req: Request, res: Response) {
  await service.removeMember(req.params.orgId, req.params.userId);
  res.status(204).end();
}
