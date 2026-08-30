import type { Request, Response } from "express";
import { auth } from "../../lib/http.js";
import { notifyRoleChanged } from "../../lib/notify.js";
import { projectDto, userDto } from "../../lib/serialize.js";
import { ProjectModel } from "../../models/index.js";
import {
  emitProjectMemberChanged,
  emitProjectMemberRemoved,
} from "../../realtime/emit.js";
import * as service from "./projects.service.js";

const memberRows = (rows: { user: Parameters<typeof userDto>[0]; role: string }[]) =>
  rows.map((r) => ({ user: userDto(r.user), role: r.role }));

export async function list(req: Request, res: Response) {
  const rows = await service.listProjects(req.params.orgId, auth(req).userId);
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: r.name,
      ...("description" in r && r.description ? { description: r.description } : {}),
      role: r.role,
      members: r.members.map(userDto),
    })),
  );
}

export async function create(req: Request, res: Response) {
  const project = await service.createProject({
    orgId: req.params.orgId,
    name: req.body.name,
    ...(req.body.description ? { description: req.body.description } : {}),
    creatorId: auth(req).userId,
  });
  res.status(201).json({ ...projectDto(project), role: "head" });
}

export async function detail(req: Request, res: Response) {
  const { project, role, members } = await service.getProjectDetail(
    req.params.orgId,
    req.params.projectId,
    auth(req).userId,
  );
  res.json({ ...projectDto(project), role, members: memberRows(members) });
}

export async function update(req: Request, res: Response) {
  const project = await service.updateProject(
    req.params.orgId,
    req.params.projectId,
    req.body,
  );
  res.json(projectDto(project));
}

export async function remove(req: Request, res: Response) {
  await service.deleteProject(req.params.orgId, req.params.projectId);
  res.status(204).end();
}

export async function members(req: Request, res: Response) {
  const rows = await service.listProjectMembers(
    req.params.orgId,
    req.params.projectId,
  );
  res.json(memberRows(rows));
}

export async function setMember(req: Request, res: Response) {
  const doc = await service.setProjectMember({
    orgId: req.params.orgId,
    projectId: req.params.projectId,
    userId: req.params.userId,
    role: req.body.role,
  });

  // Live to everyone viewing the project…
  emitProjectMemberChanged(req.params.projectId, {
    userId: String(doc.userId),
    role: doc.role,
  });
  // …and a persisted role-change notification for the affected user (FR-6.1).
  const project = await ProjectModel.findById(req.params.projectId)
    .select("name")
    .lean();
  await notifyRoleChanged(
    String(doc.userId),
    "project",
    project?.name ?? "the project",
  );

  res.json({ userId: String(doc.userId), role: doc.role });
}

export async function removeMember(req: Request, res: Response) {
  await service.removeProjectMember(
    req.params.orgId,
    req.params.projectId,
    req.params.userId,
  );
  emitProjectMemberRemoved(req.params.projectId, req.params.userId);
  res.status(204).end();
}
