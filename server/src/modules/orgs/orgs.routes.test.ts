import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import {
  BoardModel,
  CardModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectModel,
  UserModel,
} from "../../models/index.js";
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

describe("POST /orgs (UC-1a — any authenticated user)", () => {
  it("creates an org, makes the caller Owner, derives a unique slug", async () => {
    const u = await makeUser();
    const res = await asUser(app, u).post("/api/v1/orgs").send({ name: "Acme Studio!" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "Acme Studio!", slug: "acme-studio" });

    const m = await OrgMembershipModel.findOne({
      organizationId: res.body.id,
      userId: u._id,
    });
    expect(m?.role).toBe("owner");

    // second org with the same name → slug is de-duped
    const res2 = await asUser(app, u).post("/api/v1/orgs").send({ name: "Acme Studio!" });
    expect(res2.body.slug).toBe("acme-studio-2");
  });

  it("401s without a token; 400s on an empty name", async () => {
    expect((await request(app).post("/api/v1/orgs").send({ name: "x" })).status).toBe(401);
    const u = await makeUser();
    expect((await asUser(app, u).post("/api/v1/orgs").send({ name: "" })).status).toBe(400);
  });
});

describe("GET/PATCH /orgs/:orgId", () => {
  it("a member can read; a non-member gets 404 (cross-tenant hidden)", async () => {
    const org = await makeOrg();
    const member = await makeUser();
    const outsider = await makeUser();
    await addOrgMember(org._id, member._id, "member");

    expect((await asUser(app, member).get(`/api/v1/orgs/${org._id}`)).status).toBe(200);
    expect((await asUser(app, outsider).get(`/api/v1/orgs/${org._id}`)).status).toBe(404);
  });

  it("only Owner/Admin can PATCH the name", async () => {
    const org = await makeOrg();
    const admin = await makeUser();
    const member = await makeUser();
    await addOrgMember(org._id, admin._id, "admin");
    await addOrgMember(org._id, member._id, "member");

    expect(
      (await asUser(app, member).patch(`/api/v1/orgs/${org._id}`).send({ name: "New" }))
        .status,
    ).toBe(403);

    const ok = await asUser(app, admin)
      .patch(`/api/v1/orgs/${org._id}`)
      .send({ name: "Renamed Co" });
    expect(ok.status).toBe(200);
    expect(ok.body.name).toBe("Renamed Co");
  });
});

describe("DELETE /orgs/:orgId", () => {
  it("an Owner deletes the org and everything under it cascades", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const project = await makeProject(org._id, "Doomed Project");
    await addProjectMember(project._id, owner._id, "head");
    const board = await makeBoard(org._id, project._id);
    await makeCard(org._id, board._id);

    const res = await asUser(app, owner).delete(`/api/v1/orgs/${org._id}`);
    expect(res.status).toBe(204);

    expect(await OrganizationModel.exists({ _id: org._id })).toBeNull();
    expect(await ProjectModel.exists({ _id: project._id })).toBeNull();
    expect(await BoardModel.exists({ _id: board._id })).toBeNull();
    expect(await CardModel.countDocuments({ boardId: board._id })).toBe(0);
    expect(await OrgMembershipModel.countDocuments({ organizationId: org._id })).toBe(0);

    // the org is gone for the ex-owner too
    expect((await asUser(app, owner).get(`/api/v1/orgs/${org._id}`)).status).toBe(404);
  });

  it("an Admin cannot delete the org (403); a non-member gets 404", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const admin = await makeUser();
    const outsider = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, admin._id, "admin");

    expect((await asUser(app, admin).delete(`/api/v1/orgs/${org._id}`)).status).toBe(403);
    expect((await asUser(app, outsider).delete(`/api/v1/orgs/${org._id}`)).status).toBe(404);
    expect(await OrganizationModel.exists({ _id: org._id })).not.toBeNull();
  });
});

describe("GET /orgs/:orgId/members", () => {
  it("lists members with roles and user info, no passwordHash", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const bob = await makeUser({ name: "Bob" });
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, bob._id, "member");

    const res = await asUser(app, owner).get(`/api/v1/orgs/${org._id}/members`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(JSON.stringify(res.body)).not.toContain("passwordHash");
    expect(res.body.map((r: { role: string }) => r.role).sort()).toEqual(["member", "owner"]);
  });
});

describe("invites (UC-2)", () => {
  it("Owner/Admin invites by email + role; a Member cannot (403)", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const plain = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, plain._id, "member");

    expect(
      (
        await asUser(app, plain)
          .post(`/api/v1/orgs/${org._id}/invites`)
          .send({ email: "x@acme.com", role: "member" })
      ).status,
    ).toBe(403);

    const res = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "New.Person@Acme.com", role: "admin" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: "new.person@acme.com", role: "admin" });
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects role=owner at the schema level", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const res = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "x@acme.com", role: "owner" });
    expect(res.status).toBe(400);
  });

  it("an existing logged-in user accepts an invite → OrgMembership added", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const invitee = await makeUser({ email: "invitee@acme.com" });

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "invitee@acme.com", role: "member" });

    const accept = await asUser(app, invitee)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send();
    expect(accept.status).toBe(200);
    expect(accept.body).toMatchObject({
      organizationId: org._id.toString(),
      role: "member",
    });
    expect(
      await OrgMembershipModel.exists({ organizationId: org._id, userId: invitee._id }),
    ).toBeTruthy();
  });

  it("a brand-new invitee accepts with name+password → account created + logged in (UC-2 3a)", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "fresh@acme.com", role: "member" });

    const accept = await request(app)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send({ name: "Fresh Face", password: "supersecret1" });

    expect(accept.status).toBe(201);
    expect(accept.body.user.email).toBe("fresh@acme.com");
    expect(accept.body.accessToken).toEqual(expect.any(String));
    const user = await UserModel.findOne({ email: "fresh@acme.com" });
    expect(
      await OrgMembershipModel.exists({ organizationId: org._id, userId: user!._id }),
    ).toBeTruthy();
  });

  it("rejects an accept whose logged-in email differs from the invite (403)", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const other = await makeUser({ email: "other@acme.com" });

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "target@acme.com", role: "member" });

    const res = await asUser(app, other)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send();
    expect(res.status).toBe(403);
  });

  it("lists pending invites for Owner/Admin; a Member is 403", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const plain = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, plain._id, "member");

    await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "pending@acme.com", role: "member" });

    const list = await asUser(app, owner).get(`/api/v1/orgs/${org._id}/invites`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({
      email: "pending@acme.com",
      role: "member",
    });
    expect(list.body[0].token).toEqual(expect.any(String));
    expect(list.body[0].invitedBy.id).toBe(owner._id.toString());

    expect(
      (await asUser(app, plain).get(`/api/v1/orgs/${org._id}/invites`)).status,
    ).toBe(403);
  });

  it("an accepted invite drops out of the pending list", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const invitee = await makeUser({ email: "joiner@acme.com" });

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "joiner@acme.com", role: "member" });
    await asUser(app, invitee)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send();

    const list = await asUser(app, owner).get(`/api/v1/orgs/${org._id}/invites`);
    expect(list.body).toHaveLength(0);
  });

  it("GET /orgs/invites/mine returns my pending invites with org info", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const invitee = await makeUser({ email: "wants-in@acme.com" });
    const other = await makeUser({ email: "not-me@acme.com" });

    await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "wants-in@acme.com", role: "member" });
    await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "not-me@acme.com", role: "admin" });

    const mine = await asUser(app, invitee).get("/api/v1/orgs/invites/mine");
    expect(mine.status).toBe(200);
    expect(mine.body).toHaveLength(1);
    expect(mine.body[0]).toMatchObject({
      email: "wants-in@acme.com",
      role: "member",
      organization: { id: org._id.toString(), name: org.name },
    });
    expect(mine.body[0].token).toEqual(expect.any(String));

    // the other invitee only sees their own
    const theirs = await asUser(app, other).get("/api/v1/orgs/invites/mine");
    expect(theirs.body.map((i: { role: string }) => i.role)).toEqual(["admin"]);
  });

  it("GET /orgs/invites/mine omits accepted invites", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const invitee = await makeUser({ email: "joining@acme.com" });

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "joining@acme.com", role: "member" });
    await asUser(app, invitee)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send();

    const mine = await asUser(app, invitee).get("/api/v1/orgs/invites/mine");
    expect(mine.body).toHaveLength(0);
  });

  it("Owner/Admin revokes a pending invite (then it cannot be accepted)", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");

    const inv = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "revoke-me@acme.com", role: "member" });

    const del = await asUser(app, owner).delete(
      `/api/v1/orgs/${org._id}/invites/${inv.body.id}`,
    );
    expect(del.status).toBe(204);

    expect(
      (await asUser(app, owner).get(`/api/v1/orgs/${org._id}/invites`)).body,
    ).toHaveLength(0);

    const accept = await request(app)
      .post(`/api/v1/orgs/invites/${inv.body.token}/accept`)
      .send({ name: "Too Late", password: "supersecret1" });
    expect(accept.status).toBe(404);
  });
});

describe("PATCH/DELETE /orgs/:orgId/members/:userId", () => {
  it("Owner/Admin changes a member's role", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const bob = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, bob._id, "member");

    const res = await asUser(app, owner)
      .patch(`/api/v1/orgs/${org._id}/members/${bob._id}`)
      .send({ role: "admin" });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe("admin");
  });

  it("blocks demoting or removing the last Owner (FR-1.6)", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");

    const demote = await asUser(app, owner)
      .patch(`/api/v1/orgs/${org._id}/members/${owner._id}`)
      .send({ role: "member" });
    expect(demote.status).toBe(409);

    const remove = await asUser(app, owner).delete(
      `/api/v1/orgs/${org._id}/members/${owner._id}`,
    );
    expect(remove.status).toBe(409);
  });

  it("removes a non-last member with 204", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    const bob = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, bob._id, "member");

    const res = await asUser(app, owner).delete(
      `/api/v1/orgs/${org._id}/members/${bob._id}`,
    );
    expect(res.status).toBe(204);
    expect(await OrgMembershipModel.exists({ organizationId: org._id, userId: bob._id })).toBeFalsy();
  });
});
