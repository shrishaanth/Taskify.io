import { afterEach, describe, it, expect, vi } from "vitest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import {
  BoardModel,
  CardModel,
  CommentModel,
  NotificationModel,
  ProjectMembershipModel,
  ProjectModel,
  SubtaskModel,
} from "../../models/index.js";
import * as emit from "../../realtime/emit.js";
import {
  addOrgMember,
  addProjectMember,
  makeBoard,
  makeCard,
  makeOrg,
  makeProject,
  makeUser,
} from "../../test/factories.js";

const app = createApp();
const base = (orgId: string) => `/api/v1/orgs/${orgId}/projects`;

describe("GET /orgs/:orgId/projects", () => {
  it("returns every project, name-only where the caller has no ProjectMembership (FR-2.3)", async () => {
    const org = await makeOrg();
    const user = await makeUser();
    await addOrgMember(org._id, user._id, "member");

    const mine = await makeProject(org._id, "Mine");
    await addProjectMember(mine._id, user._id, "head");
    await makeProject(org._id, "Private Audit");

    const res = await asUser(app, user).get(base(org._id.toString()));
    expect(res.status).toBe(200);

    const byName = Object.fromEntries(
      res.body.map((p: { name: string }) => [p.name, p]),
    );
    expect(byName["Mine"].role).toBe("head");
    expect(byName["Mine"].members.length).toBeGreaterThan(0);

    expect(byName["Private Audit"].role).toBeNull();
    expect(byName["Private Audit"]).not.toHaveProperty("description");
    expect(byName["Private Audit"].members).toEqual([]);
  });

  it("404s for a non-member of the org", async () => {
    const org = await makeOrg();
    const outsider = await makeUser();
    expect((await asUser(app, outsider).get(base(org._id.toString()))).status).toBe(404);
  });
});

describe("POST /orgs/:orgId/projects (UC-3)", () => {
  it("any org member can create; the creator becomes a Project Head", async () => {
    const org = await makeOrg();
    const user = await makeUser();
    await addOrgMember(org._id, user._id, "member");

    const res = await asUser(app, user)
      .post(base(org._id.toString()))
      .send({ name: "Website Revamp", description: "Q4 push" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Website Revamp", role: "head" });

    const pm = await ProjectMembershipModel.findOne({
      projectId: res.body.id,
      userId: user._id,
    });
    expect(pm?.role).toBe("head");
  });

  it("403s a user who is not in the org", async () => {
    const org = await makeOrg();
    const outsider = await makeUser();
    const res = await asUser(app, outsider)
      .post(base(org._id.toString()))
      .send({ name: "x" });
    expect(res.status).toBe(404); // org membership check hides the org
  });
});

describe("GET /orgs/:orgId/projects/:projectId", () => {
  it("full detail with a ProjectMembership; 403 without one (same-org)", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    const orgMate = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    await addOrgMember(org._id, orgMate._id, "member");
    const project = await makeProject(org._id, "Alpha");
    await addProjectMember(project._id, head._id, "head");

    const ok = await asUser(app, head).get(
      `${base(org._id.toString())}/${project._id}`,
    );
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ name: "Alpha", role: "head" });
    expect(Array.isArray(ok.body.members)).toBe(true);

    const denied = await asUser(app, orgMate).get(
      `${base(org._id.toString())}/${project._id}`,
    );
    expect(denied.status).toBe(403);
    expect(denied.body.code).toBe("FORBIDDEN");
  });

  it("404s a project id that belongs to a different org in the URL", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const user = await makeUser();
    await addOrgMember(orgA._id, user._id, "owner");
    await addOrgMember(orgB._id, user._id, "owner");
    const projInB = await makeProject(orgB._id);

    const res = await asUser(app, user).get(
      `${base(orgA._id.toString())}/${projInB._id}`,
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH / DELETE /orgs/:orgId/projects/:projectId (Head only)", () => {
  it("Head updates name/description; a Member cannot (403)", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    const member = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    await addOrgMember(org._id, member._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");
    await addProjectMember(project._id, member._id, "member");

    expect(
      (
        await asUser(app, member)
          .patch(`${base(org._id.toString())}/${project._id}`)
          .send({ name: "Nope" })
      ).status,
    ).toBe(403);

    const ok = await asUser(app, head)
      .patch(`${base(org._id.toString())}/${project._id}`)
      .send({ name: "Renamed", description: "new" });
    expect(ok.status).toBe(200);
    expect(ok.body.name).toBe("Renamed");
  });

  it("an Org Admin who is NOT a project member cannot PATCH the project (Head-only, no override)", async () => {
    const org = await makeOrg();
    const admin = await makeUser();
    await addOrgMember(org._id, admin._id, "admin");
    const project = await makeProject(org._id);

    const res = await asUser(app, admin)
      .patch(`${base(org._id.toString())}/${project._id}`)
      .send({ name: "x" });
    expect(res.status).toBe(403);
  });

  it("DELETE cascades to boards → cards → subtasks/comments (contract note)", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    await SubtaskModel.create({ cardId: card._id, title: "st" });
    await CommentModel.create({ cardId: card._id, authorId: head._id, body: "hi" });

    const res = await asUser(app, head).delete(
      `${base(org._id.toString())}/${project._id}`,
    );
    expect(res.status).toBe(204);

    expect(await ProjectModel.exists({ _id: project._id })).toBeFalsy();
    expect(await BoardModel.exists({ _id: board._id })).toBeFalsy();
    expect(await CardModel.exists({ _id: card._id })).toBeFalsy();
    expect(await SubtaskModel.countDocuments({ cardId: card._id })).toBe(0);
    expect(await CommentModel.countDocuments({ cardId: card._id })).toBe(0);
    expect(await ProjectMembershipModel.countDocuments({ projectId: project._id })).toBe(0);
  });
});

describe("PUT / DELETE /orgs/:orgId/projects/:projectId/members/:userId", () => {
  it("a Head adds a member; the target must already be in the org", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    const orgMate = await makeUser();
    const stranger = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    await addOrgMember(org._id, orgMate._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");

    const ok = await asUser(app, head)
      .put(`${base(org._id.toString())}/${project._id}/members/${orgMate._id}`)
      .send({ role: "member" });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ userId: orgMate._id.toString(), role: "member" });

    const bad = await asUser(app, head)
      .put(`${base(org._id.toString())}/${project._id}/members/${stranger._id}`)
      .send({ role: "member" });
    expect(bad.status).toBe(400); // not an org member
  });

  it("an Org Owner/Admin with no ProjectMembership CAN manage members (FR-2.7 override)", async () => {
    const org = await makeOrg();
    const admin = await makeUser();
    const target = await makeUser();
    await addOrgMember(org._id, admin._id, "admin");
    await addOrgMember(org._id, target._id, "member");
    const project = await makeProject(org._id);

    const res = await asUser(app, admin)
      .put(`${base(org._id.toString())}/${project._id}/members/${target._id}`)
      .send({ role: "head" });
    expect(res.status).toBe(200);
  });

  it("a plain Project Member cannot manage members (403)", async () => {
    const org = await makeOrg();
    const member = await makeUser();
    const target = await makeUser();
    await addOrgMember(org._id, member._id, "member");
    await addOrgMember(org._id, target._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, member._id, "member");

    const res = await asUser(app, member)
      .put(`${base(org._id.toString())}/${project._id}/members/${target._id}`)
      .send({ role: "member" });
    expect(res.status).toBe(403);
  });

  it("DELETE removes a project member (204), 404 if they weren't one", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    const gone = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    await addOrgMember(org._id, gone._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");
    await addProjectMember(project._id, gone._id, "member");

    expect(
      (
        await asUser(app, head).delete(
          `${base(org._id.toString())}/${project._id}/members/${gone._id}`,
        )
      ).status,
    ).toBe(204);
    expect(
      (
        await asUser(app, head).delete(
          `${base(org._id.toString())}/${project._id}/members/${gone._id}`,
        )
      ).status,
    ).toBe(404);
  });
});

describe("projects controller — real-time emits + notification", () => {
  afterEach(() => vi.restoreAllMocks());

  async function headAnd(orgMate = true) {
    const org = await makeOrg({ name: "Emit Co" });
    const head = await makeUser();
    const target = await makeUser({ name: "Target User" });
    await addOrgMember(org._id, head._id, "member");
    if (orgMate) await addOrgMember(org._id, target._id, "member");
    const project = await makeProject(org._id, "Emit Project");
    await addProjectMember(project._id, head._id, "head");
    return { org, head, target, project };
  }

  it("PUT emits project:memberChanged AND persists a role_changed notification", async () => {
    const spy = vi
      .spyOn(emit, "emitProjectMemberChanged")
      .mockImplementation(() => {});
    const { org, head, target, project } = await headAnd();

    const res = await asUser(app, head)
      .put(`${base(org._id.toString())}/${project._id}/members/${target._id}`)
      .send({ role: "member" });
    expect(res.status).toBe(200);

    expect(spy).toHaveBeenCalledWith(
      project._id.toString(),
      { userId: target._id.toString(), role: "member" },
    );
    const notif = await NotificationModel.findOne({
      userId: target._id,
      type: "role_changed",
    });
    expect(notif).not.toBeNull();
    expect(notif!.payload).toMatchObject({
      scope: "project",
      contextName: "Emit Project",
    });
  });

  it("DELETE emits project:memberRemoved (project id + user id)", async () => {
    const spy = vi
      .spyOn(emit, "emitProjectMemberRemoved")
      .mockImplementation(() => {});
    const { org, head, target, project } = await headAnd();
    await addProjectMember(project._id, target._id, "member");

    const res = await asUser(app, head).delete(
      `${base(org._id.toString())}/${project._id}/members/${target._id}`,
    );
    expect(res.status).toBe(204);
    expect(spy).toHaveBeenCalledWith(
      project._id.toString(),
      target._id.toString(),
    );
  });
});
