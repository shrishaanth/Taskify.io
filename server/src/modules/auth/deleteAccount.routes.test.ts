import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import {
  addOrgMember,
  addProjectMember,
  makeBoard,
  makeCard,
  makeOrg,
  makeProject,
  makeUser,
} from "../../test/factories.js";
import {
  BoardModel,
  CardModel,
  CommentModel,
  NotificationModel,
  OrgInviteModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectMembershipModel,
  ProjectModel,
  RefreshTokenModel,
  SubtaskModel,
  UserModel,
} from "../../models/index.js";
import { hashRefreshToken, refreshTokenExpiry } from "../../lib/tokens.js";

const PASSWORD = "supersecret1";
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp();
});

const confirm = (email: string, password = PASSWORD) => ({
  password,
  confirmEmail: email,
});

describe("DELETE /auth/me — confirmation", () => {
  it("rejects a wrong password without touching the account", async () => {
    const user = await makeUser();

    const res = await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm(user.email, "not-the-password"));

    expect(res.status).toBe(401);
    const after = await UserModel.findById(user._id).lean();
    expect(after?.deletedAt ?? null).toBeNull();
    expect(after?.email).toBe(user.email);
  });

  it("rejects an email that does not match the account", async () => {
    const user = await makeUser();

    const res = await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm("someone.else@example.com"));

    expect(res.status).toBe(400);
    const after = await UserModel.findById(user._id).lean();
    expect(after?.deletedAt ?? null).toBeNull();
  });

  it("requires both fields", async () => {
    const user = await makeUser();
    const res = await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send({ password: PASSWORD });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /auth/me — sole-owner protection", () => {
  it("409s when the caller is the only Owner of an org with other members", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const org = await makeOrg({ name: "Acme" });
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, other._id, "member");

    const res = await asUser(app, owner)
      .delete("/api/v1/auth/me")
      .send(confirm(owner.email));

    expect(res.status).toBe(409);
    expect(res.body.details.code).toBe("SOLE_OWNER_ORGS");
    expect(res.body.details.organizations).toEqual([
      expect.objectContaining({ id: String(org._id), name: "Acme", memberCount: 2 }),
    ]);

    // Nothing was destroyed by the rejected attempt.
    expect(await OrganizationModel.exists({ _id: org._id })).toBeTruthy();
    expect(await OrgMembershipModel.countDocuments({ organizationId: org._id })).toBe(2);
    const after = await UserModel.findById(owner._id).lean();
    expect(after?.deletedAt ?? null).toBeNull();
  });

  it("allows deletion when another Owner remains", async () => {
    const owner = await makeUser();
    const coOwner = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, coOwner._id, "owner");

    const res = await asUser(app, owner)
      .delete("/api/v1/auth/me")
      .send(confirm(owner.email));

    expect(res.status).toBe(204);
    // The org survives, minus the departing owner.
    expect(await OrganizationModel.exists({ _id: org._id })).toBeTruthy();
    expect(await OrgMembershipModel.countDocuments({ organizationId: org._id })).toBe(1);
  });

  it("an Admin left behind does not count as an Owner", async () => {
    const owner = await makeUser();
    const admin = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, admin._id, "admin");

    const res = await asUser(app, owner)
      .delete("/api/v1/auth/me")
      .send(confirm(owner.email));

    expect(res.status).toBe(409);
  });

  it("cascade-deletes an org the caller is the only member of", async () => {
    const owner = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, owner._id, "head");
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);

    const res = await asUser(app, owner)
      .delete("/api/v1/auth/me")
      .send(confirm(owner.email));

    expect(res.status).toBe(204);
    expect(await OrganizationModel.exists({ _id: org._id })).toBeNull();
    expect(await ProjectModel.exists({ _id: project._id })).toBeNull();
    expect(await BoardModel.exists({ _id: board._id })).toBeNull();
    expect(await CardModel.exists({ _id: card._id })).toBeNull();
  });
});

describe("DELETE /auth/me — what it scrubs and what it keeps", () => {
  it("anonymizes the user, frees the email, and revokes every session", async () => {
    const user = await makeUser({ email: "leaving@example.com" });
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashRefreshToken("raw-token"),
      expiresAt: refreshTokenExpiry(),
    });

    const res = await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm("leaving@example.com"));
    expect(res.status).toBe(204);

    const after = await UserModel.findById(user._id).lean();
    expect(after).not.toBeNull();
    expect(after?.deletedAt).toBeInstanceOf(Date);
    expect(after?.name).toBe("Deleted user");
    expect(after?.email).not.toBe("leaving@example.com");
    expect(after?.email).toMatch(/@account\.invalid$/);

    const tokens = await RefreshTokenModel.find({ userId: user._id }).lean();
    expect(tokens.every((t) => t.revokedAt)).toBe(true);
  });

  it("frees the email for a fresh signup", async () => {
    const user = await makeUser({ email: "reuse@example.com" });
    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm("reuse@example.com"))
      .expect(204);

    const res = await request(app).post("/api/v1/auth/signup").send({
      email: "reuse@example.com",
      name: "Someone New",
      password: "brandnewpass1",
    });

    expect(res.status).toBe(201);
    expect(res.body.user.id).not.toBe(String(user._id));
  });

  it("drops memberships, notifications and invites addressed to the email", async () => {
    const user = await makeUser({ email: "gone@example.com" });
    const keeper = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, keeper._id, "owner");
    await addOrgMember(org._id, user._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, user._id, "member");
    await NotificationModel.create({
      userId: user._id,
      organizationId: org._id,
      type: "card_assigned",
      payload: {},
    });
    await OrgInviteModel.create({
      organizationId: org._id,
      email: "gone@example.com",
      role: "member",
      token: "tok-1",
      invitedById: keeper._id,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm("gone@example.com"))
      .expect(204);

    expect(await OrgMembershipModel.countDocuments({ userId: user._id })).toBe(0);
    expect(await ProjectMembershipModel.countDocuments({ userId: user._id })).toBe(0);
    expect(await NotificationModel.countDocuments({ userId: user._id })).toBe(0);
    expect(await OrgInviteModel.countDocuments({ email: "gone@example.com" })).toBe(0);
  });

  it("unassigns the user from cards and subtasks but keeps their comments", async () => {
    const user = await makeUser();
    const keeper = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, keeper._id, "owner");
    await addOrgMember(org._id, user._id, "member");
    const project = await makeProject(org._id);
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    await CardModel.updateOne(
      { _id: card._id },
      { $set: { assigneeIds: [user._id, keeper._id] } },
    );
    const subtask = await SubtaskModel.create({
      cardId: card._id,
      organizationId: org._id,
      title: "Sub",
      assigneeId: user._id,
      done: false,
    });
    const comment = await CommentModel.create({
      cardId: card._id,
      organizationId: org._id,
      authorId: user._id,
      body: "Worth keeping in the thread",
    });

    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm(user.email))
      .expect(204);

    const afterCard = await CardModel.findById(card._id).lean();
    expect(afterCard?.assigneeIds.map(String)).toEqual([String(keeper._id)]);
    const afterSubtask = await SubtaskModel.findById(subtask._id).lean();
    expect(afterSubtask?.assigneeId ?? null).toBeNull();

    // The discussion other people can see must not disappear with the account.
    const afterComment = await CommentModel.findById(comment._id).lean();
    expect(afterComment?.body).toBe("Worth keeping in the thread");
    expect(String(afterComment?.authorId)).toBe(String(user._id));
  });
});

describe("DELETE /auth/me — access after deletion", () => {
  it("rejects an access token minted before the deletion, immediately", async () => {
    const user = await makeUser();
    const api = asUser(app, user); // token captured while still active

    await api.delete("/api/v1/auth/me").send(confirm(user.email)).expect(204);

    // Same token, next request.
    await api.get("/api/v1/auth/me").expect(401);
  });

  it("refuses to log in as a deleted account", async () => {
    const user = await makeUser({ email: "bye@example.com" });
    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm("bye@example.com"))
      .expect(204);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "bye@example.com", password: PASSWORD });

    expect(res.status).toBe(401);
  });

  it("refuses to exchange a refresh token issued before the deletion", async () => {
    const user = await makeUser();
    const raw = "refresh-raw-value";
    await RefreshTokenModel.create({
      userId: user._id,
      tokenHash: hashRefreshToken(raw),
      expiresAt: refreshTokenExpiry(),
    });

    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send(confirm(user.email))
      .expect(204);

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: raw });

    expect(res.status).toBe(401);
  });

  it("cannot be deleted twice", async () => {
    const user = await makeUser();
    const api = asUser(app, user);
    await api.delete("/api/v1/auth/me").send(confirm(user.email)).expect(204);
    await api.delete("/api/v1/auth/me").send(confirm(user.email)).expect(401);
  });
});

describe("GET /auth/me/deletion-preview", () => {
  it("reports nothing to worry about for a user with no orgs", async () => {
    const user = await makeUser();
    const res = await asUser(app, user).get("/api/v1/auth/me/deletion-preview");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ blockingOrgs: [], orgsToDelete: [] });
  });

  it("separates orgs that block from orgs that get deleted", async () => {
    const user = await makeUser();
    const other = await makeUser();

    const shared = await makeOrg({ name: "Shared" });
    await addOrgMember(shared._id, user._id, "owner");
    await addOrgMember(shared._id, other._id, "member");

    const solo = await makeOrg({ name: "Solo" });
    await addOrgMember(solo._id, user._id, "owner");

    const res = await asUser(app, user).get("/api/v1/auth/me/deletion-preview");

    expect(res.body.blockingOrgs).toEqual([
      expect.objectContaining({ name: "Shared", memberCount: 2 }),
    ]);
    expect(res.body.orgsToDelete).toEqual([
      expect.objectContaining({ name: "Solo", memberCount: 1 }),
    ]);
  });

  it("does not report orgs the caller only belongs to as a member", async () => {
    const user = await makeUser();
    const owner = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, user._id, "member");

    const res = await asUser(app, user).get("/api/v1/auth/me/deletion-preview");

    expect(res.body).toEqual({ blockingOrgs: [], orgsToDelete: [] });
  });
});
