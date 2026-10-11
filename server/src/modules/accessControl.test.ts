import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { signAccessToken } from "../lib/tokens.js";
import {
  CardModel,
  OrgMembershipModel,
  ProjectMembershipModel,
  SubtaskModel,
} from "../models/index.js";
import { initRealtime, shutdownRealtime } from "../realtime/io.js";
import { asUser } from "../test/api.js";
import {
  addOrgMember,
  addProjectMember,
  makeBoard,
  makeCard,
  makeOrg,
  makeProject,
  makeScenario,
  makeUser,
} from "../test/factories.js";

const app = createApp();

describe("Owner role is reserved for Owners", () => {
  async function orgWith() {
    const owner = await makeUser();
    const owner2 = await makeUser();
    const admin = await makeUser();
    const member = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    await addOrgMember(org._id, owner2._id, "owner");
    await addOrgMember(org._id, admin._id, "admin");
    await addOrgMember(org._id, member._id, "member");
    return { owner, owner2, admin, member, org };
  }
  const members = (orgId: unknown, userId: unknown) =>
    `/api/v1/orgs/${String(orgId)}/members/${String(userId)}`;

  it("an Admin cannot promote themselves, or anyone, to Owner", async () => {
    const { admin, member, org } = await orgWith();
    const api = asUser(app, admin);
    await api.patch(members(org._id, admin._id)).send({ role: "owner" }).expect(403);
    await api.patch(members(org._id, member._id)).send({ role: "owner" }).expect(403);
    const still = await OrgMembershipModel.findOne({
      organizationId: org._id,
      userId: admin._id,
    }).lean();
    expect(still?.role).toBe("admin");
  });

  it("an Admin cannot demote or remove an Owner", async () => {
    const { admin, owner2, org } = await orgWith();
    const api = asUser(app, admin);
    await api.patch(members(org._id, owner2._id)).send({ role: "member" }).expect(403);
    await api.delete(members(org._id, owner2._id)).expect(403);
  });

  it("an Admin can still manage Admins and Members", async () => {
    const { admin, member, org } = await orgWith();
    await asUser(app, admin)
      .patch(members(org._id, member._id))
      .send({ role: "admin" })
      .expect(200);
  });

  it("an Owner can grant and revoke Owner", async () => {
    const { owner, owner2, member, org } = await orgWith();
    const api = asUser(app, owner);
    await api.patch(members(org._id, member._id)).send({ role: "owner" }).expect(200);
    await api.patch(members(org._id, owner2._id)).send({ role: "admin" }).expect(200);
  });
});

describe("removing an org member cleans up after them", () => {
  it("drops their project roles and assignments in that org only", async () => {
    const { owner, member, project, org } = await makeScenario();
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    await CardModel.updateOne(
      { _id: card._id },
      { $set: { assigneeIds: [member._id, owner._id] } },
    );
    const subtask = await SubtaskModel.create({
      cardId: card._id,
      title: "s",
      assigneeId: member._id,
    });

    // A second org the same person belongs to must be left alone.
    const otherOrg = await makeOrg();
    await addOrgMember(otherOrg._id, member._id, "member");
    const otherProject = await makeProject(otherOrg._id);
    await addProjectMember(otherProject._id, member._id, "head");

    await asUser(app, owner)
      .delete(`/api/v1/orgs/${org._id}/members/${member._id}`)
      .expect(204);

    expect(
      await ProjectMembershipModel.countDocuments({
        projectId: project._id,
        userId: member._id,
      }),
    ).toBe(0);
    const after = await CardModel.findById(card._id).lean();
    expect(after?.assigneeIds.map(String)).toEqual([String(owner._id)]);
    expect((await SubtaskModel.findById(subtask._id).lean())?.assigneeId).toBeUndefined();

    expect(
      await ProjectMembershipModel.countDocuments({
        projectId: otherProject._id,
        userId: member._id,
      }),
    ).toBe(1);
  });
});

describe("a project keeps at least one Head", () => {
  it("refuses to demote or remove the only Head", async () => {
    const { head, project, org } = await makeScenario();
    const api = asUser(app, head);
    const url = `/api/v1/orgs/${org._id}/projects/${project._id}/members/${head._id}`;
    await api.put(url).send({ role: "member" }).expect(409);
    await api.delete(url).expect(409);
  });

  it("allows it once a second Head exists", async () => {
    const { head, member, project, org } = await makeScenario();
    const api = asUser(app, head);
    const base = `/api/v1/orgs/${org._id}/projects/${project._id}/members`;
    await api.put(`${base}/${member._id}`).send({ role: "head" }).expect(200);
    await api.put(`${base}/${head._id}`).send({ role: "member" }).expect(200);
  });
});

describe("socket rooms follow access", () => {
  let httpServer: HttpServer;
  let port: number;
  const clients: ClientSocket[] = [];

  beforeAll(async () => {
    httpServer = createServer(app);
    initRealtime(httpServer);
    await new Promise<void>((resolve) =>
      httpServer.listen(0, () => {
        port = (httpServer.address() as AddressInfo).port;
        resolve();
      }),
    );
  });
  afterAll(async () => {
    for (const c of clients) c.disconnect();
    await shutdownRealtime();
    if (httpServer.listening) {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    }
  });

  const connect = (userId: unknown) =>
    new Promise<ClientSocket>((resolve, reject) => {
      const s = ioc(`http://localhost:${port}`, {
        path: "/socket.io",
        transports: ["websocket"],
        reconnection: false,
        auth: { token: signAccessToken(String(userId)) },
      });
      clients.push(s);
      s.on("connect", () => resolve(s));
      s.on("connect_error", reject);
    });
  const settle = () => new Promise((r) => setTimeout(r, 200));
  const heard = (s: ClientSocket, event: string, ms = 1000) =>
    new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), ms);
      s.once(event, () => {
        clearTimeout(t);
        resolve(true);
      });
    });

  it("a member removed from a project stops receiving its events", async () => {
    const { head, member, project, org } = await makeScenario();
    // A second Head so the scenario's Head is free to act on the member.
    const board = await makeBoard(org._id, project._id);
    const s = await connect(member._id);
    s.emit("subscribe:board", String(board._id));
    await settle();

    const api = asUser(app, head);
    await api
      .delete(`/api/v1/orgs/${org._id}/projects/${project._id}/members/${member._id}`)
      .expect(204);
    await settle();

    const card = heard(s, "card:created");
    const newBoard = heard(s, "board:created");
    await api.post(`/api/v1/boards/${board._id}/cards`).send({ title: "x", columnId: "c1" });
    await api.post(`/api/v1/projects/${project._id}/boards`).send({ name: "b" });

    expect(await card).toBe(false);
    expect(await newBoard).toBe(false);
  });

  it("a member removed from the org is told, then hears nothing more", async () => {
    const { owner, head, member, project, org } = await makeScenario();
    const s = await connect(member._id);
    await settle();

    const told = heard(s, "org:memberRemoved");
    await asUser(app, owner)
      .delete(`/api/v1/orgs/${org._id}/members/${member._id}`)
      .expect(204);
    expect(await told).toBe(true);
    await settle();

    const later = heard(s, "board:created");
    await asUser(app, head)
      .post(`/api/v1/projects/${project._id}/boards`)
      .send({ name: "after removal" });
    expect(await later).toBe(false);
  });

  it("someone added to a project mid-session starts receiving its events", async () => {
    const { head, project, org } = await makeScenario();
    const late = await makeUser();
    await addOrgMember(org._id, late._id, "member");
    const s = await connect(late._id);
    await settle();

    const api = asUser(app, head);
    await api
      .put(`/api/v1/orgs/${org._id}/projects/${project._id}/members/${late._id}`)
      .send({ role: "member" })
      .expect(200);
    await settle();

    const evt = heard(s, "board:created");
    await api.post(`/api/v1/projects/${project._id}/boards`).send({ name: "b" });
    expect(await evt).toBe(true);
  });

  it("deleting an account disconnects its sockets", async () => {
    const user = await makeUser();
    const s = await connect(user._id);
    await settle();
    const dropped = new Promise<boolean>((resolve) => {
      const t = setTimeout(() => resolve(false), 1500);
      s.once("disconnect", () => {
        clearTimeout(t);
        resolve(true);
      });
    });
    await asUser(app, user)
      .delete("/api/v1/auth/me")
      .send({ password: "supersecret1", confirmEmail: user.email })
      .expect(204);
    expect(await dropped).toBe(true);
  });
});
