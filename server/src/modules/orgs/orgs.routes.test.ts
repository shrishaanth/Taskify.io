import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import { OrgMembershipModel, UserModel } from "../../models/index.js";
import { addOrgMember, makeOrg, makeUser } from "../../test/factories.js";

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
