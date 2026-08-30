import { AppError } from "../../lib/errors.js";
import { deleteProjectCascade } from "../../lib/cascade.js";
import {
  OrgMembershipModel,
  ProjectMembershipModel,
  ProjectModel,
  UserModel,
  type ProjectRole,
} from "../../models/index.js";

/** All projects in the org, tagged with the caller's project role (null = name-only). */
export async function listProjects(orgId: string, userId: string) {
  const projects = await ProjectModel.find({ organizationId: orgId })
    .sort({ createdAt: 1 })
    .lean();
  const memberships = await ProjectMembershipModel.find({
    projectId: { $in: projects.map((p) => p._id) },
    userId,
  }).lean();
  const roleByProject = new Map(
    memberships.map((m) => [String(m.projectId), m.role]),
  );

  const accessibleIds = projects
    .filter((p) => roleByProject.has(String(p._id)))
    .map((p) => p._id);
  const accessibleMembers = await ProjectMembershipModel.find({
    projectId: { $in: accessibleIds },
  }).lean();
  const users = await UserModel.find({
    _id: { $in: accessibleMembers.map((m) => m.userId) },
  }).lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));
  const membersByProject = new Map<string, typeof users>();
  for (const m of accessibleMembers) {
    const list = membersByProject.get(String(m.projectId)) ?? [];
    const u = userById.get(String(m.userId));
    if (u) list.push(u);
    membersByProject.set(String(m.projectId), list);
  }

  return projects.map((p) => {
    const role = roleByProject.get(String(p._id)) ?? null;
    if (role === null) {
      // Name-only (FR-2.3): no description, no boards/cards/members.
      return { id: String(p._id), name: p.name, role: null, members: [] as typeof users };
    }
    return {
      id: String(p._id),
      name: p.name,
      description: p.description ?? undefined,
      role,
      members: membersByProject.get(String(p._id)) ?? [],
    };
  });
}

export async function createProject(input: {
  orgId: string;
  name: string;
  description?: string;
  creatorId: string;
}) {
  const project = await ProjectModel.create({
    organizationId: input.orgId,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
  });
  await ProjectMembershipModel.create({
    projectId: project._id,
    userId: input.creatorId,
    role: "head",
  });
  return project;
}

async function findInOrg(orgId: string, projectId: string) {
  const project = await ProjectModel.findOne({
    _id: projectId,
    organizationId: orgId,
  });
  if (!project) throw AppError.notFound();
  return project;
}

/** GET /:projectId — full detail only with a ProjectMembership, else 403 (FR-2.3). */
export async function getProjectDetail(
  orgId: string,
  projectId: string,
  userId: string,
) {
  const project = await findInOrg(orgId, projectId);
  const pm = await ProjectMembershipModel.findOne({ projectId, userId }).lean();
  if (!pm) throw AppError.forbidden("You are not a member of this project");

  const members = await listProjectMembers(orgId, projectId);
  return { project, role: pm.role, members };
}

export async function updateProject(
  orgId: string,
  projectId: string,
  patch: { name?: string; description?: string | null },
) {
  const project = await findInOrg(orgId, projectId);
  if (patch.name !== undefined) project.name = patch.name;
  if (patch.description !== undefined) {
    if (patch.description === null) project.set("description", undefined);
    else project.description = patch.description;
  }
  await project.save();
  return project;
}

export async function deleteProject(orgId: string, projectId: string) {
  await findInOrg(orgId, projectId);
  await deleteProjectCascade(projectId);
}

export async function listProjectMembers(orgId: string, projectId: string) {
  await findInOrg(orgId, projectId);
  const rows = await ProjectMembershipModel.find({ projectId }).lean();
  const users = await UserModel.find({
    _id: { $in: rows.map((r) => r.userId) },
  }).lean();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return rows
    .map((r) => {
      const u = byId.get(String(r.userId));
      return u ? { user: u, role: r.role } : null;
    })
    .filter((x): x is { user: (typeof users)[number]; role: ProjectRole } => x !== null);
}

/** PUT member — grant/change a role. The user MUST already be an Org member. */
export async function setProjectMember(input: {
  orgId: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
}) {
  await findInOrg(input.orgId, input.projectId);

  const inOrg = await OrgMembershipModel.exists({
    organizationId: input.orgId,
    userId: input.userId,
  });
  if (!inOrg) {
    throw AppError.validation(
      "That user must be a member of the organization first",
    );
  }

  const doc = await ProjectMembershipModel.findOneAndUpdate(
    { projectId: input.projectId, userId: input.userId },
    { $set: { role: input.role } },
    { upsert: true, new: true },
  );
  return doc;
}

export async function removeProjectMember(
  orgId: string,
  projectId: string,
  userId: string,
) {
  await findInOrg(orgId, projectId);
  const res = await ProjectMembershipModel.deleteOne({ projectId, userId });
  if (res.deletedCount === 0) throw AppError.notFound();
}
