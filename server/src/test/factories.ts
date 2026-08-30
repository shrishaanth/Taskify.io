import { Types } from "mongoose";
import {
  BoardModel,
  CardModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectMembershipModel,
  ProjectModel,
  UserModel,
  type OrgRole,
  type ProjectRole,
} from "../models/index.js";
import { hashPassword } from "../lib/tokens.js";

let n = 0;
const uniq = () => `${Date.now().toString(36)}${(n++).toString(36)}`;

export async function makeUser(overrides: Partial<{ email: string; name: string; password: string }> = {}) {
  const suffix = uniq();
  return UserModel.create({
    email: overrides.email ?? `user_${suffix}@example.com`,
    name: overrides.name ?? `User ${suffix}`,
    passwordHash: await hashPassword(overrides.password ?? "supersecret1"),
  });
}

export async function makeOrg(overrides: Partial<{ name: string; slug: string }> = {}) {
  const suffix = uniq();
  return OrganizationModel.create({
    name: overrides.name ?? `Org ${suffix}`,
    slug: overrides.slug ?? `org-${suffix}`,
  });
}

export function addOrgMember(
  organizationId: Types.ObjectId,
  userId: Types.ObjectId,
  role: OrgRole,
) {
  return OrgMembershipModel.create({ organizationId, userId, role });
}

export function makeProject(organizationId: Types.ObjectId, name = "Project X") {
  return ProjectModel.create({ organizationId, name });
}

export function addProjectMember(
  projectId: Types.ObjectId,
  userId: Types.ObjectId,
  role: ProjectRole,
) {
  return ProjectMembershipModel.create({ projectId, userId, role });
}

export function makeBoard(
  organizationId: Types.ObjectId,
  projectId: Types.ObjectId,
  name = "Board X",
) {
  return BoardModel.create({
    organizationId,
    projectId,
    name,
    columns: [{ id: "c1", name: "To Do", order: 0 }],
  });
}

export function makeCard(
  organizationId: Types.ObjectId,
  boardId: Types.ObjectId,
  overrides: Partial<{ title: string; columnId: string }> = {},
) {
  return CardModel.create({
    organizationId,
    boardId,
    columnId: overrides.columnId ?? "c1",
    order: 0,
    title: overrides.title ?? "Card X",
  });
}

/** A full tenant: org + owner + head + member + one project with memberships. */
export async function makeScenario() {
  const org = await makeOrg();
  const owner = await makeUser();
  const head = await makeUser();
  const member = await makeUser();
  const outsider = await makeUser();

  await addOrgMember(org._id, owner._id, "owner");
  await addOrgMember(org._id, head._id, "member");
  await addOrgMember(org._id, member._id, "member");

  const project = await makeProject(org._id, "Alpha");
  await addProjectMember(project._id, head._id, "head");
  await addProjectMember(project._id, member._id, "member");

  return { org, owner, head, member, outsider, project };
}
