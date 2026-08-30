/**
 * UC-10 — cross-tenant isolation. The single highest-priority suite.
 *
 * A fully authenticated user of Organization A must NOT be able to read, list,
 * or modify ANY resource that belongs to Organization B, through ANY endpoint.
 * Every such attempt returns **404** (never 403 — we don't confirm the
 * resource exists). The one contrast: a same-org user with no
 * ProjectMembership on an existing project gets **403** (the project's name is
 * legitimately visible in the org list — FR-2.3).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { asUser } from "../test/api.js";
import {
  AttachmentModel,
  CardModel,
  CommentModel,
  NotificationModel,
  SubtaskModel,
} from "../models/index.js";
import {
  addOrgMember,
  addProjectMember,
  makeBoard,
  makeOrg,
  makeProject,
  makeUser,
} from "../test/factories.js";

const app = createApp();

interface Tenant {
  orgId: string;
  ownerId: string;
  projectId: string;
  boardId: string;
  columnId: string;
  cardId: string;
  subtaskId: string;
  commentId: string;
  attachmentId: string;
  notificationId: string;
}

async function buildTenant(): Promise<Tenant> {
  const org = await makeOrg();
  const owner = await makeUser();
  await addOrgMember(org._id, owner._id, "owner");

  const project = await makeProject(org._id, "Secret Project");
  await addProjectMember(project._id, owner._id, "head");

  const board = await makeBoard(org._id, project._id); // seeds column "c1"
  const card = await CardModel.create({
    organizationId: org._id,
    boardId: board._id,
    columnId: "c1",
    order: 0,
    title: "Secret Card",
  });
  const subtask = await SubtaskModel.create({ cardId: card._id, title: "st" });
  const comment = await CommentModel.create({
    cardId: card._id,
    authorId: owner._id,
    body: "secret comment",
  });
  const attachment = await AttachmentModel.create({
    cardId: card._id,
    uploadedById: owner._id,
    fileName: "secret.pdf",
    fileUrl: "https://files.example.com/secret.pdf",
    mimeType: "application/pdf",
    sizeBytes: 10,
  });
  const notification = await NotificationModel.create({
    userId: owner._id,
    type: "card_assigned",
    payload: { cardId: String(card._id) },
    read: false,
  });

  return {
    orgId: org._id.toString(),
    ownerId: owner._id.toString(),
    projectId: project._id.toString(),
    boardId: board._id.toString(),
    columnId: "c1",
    cardId: card._id.toString(),
    subtaskId: subtask._id.toString(),
    commentId: comment._id.toString(),
    attachmentId: attachment._id.toString(),
    notificationId: notification._id.toString(),
  };
}

let A: { attackerId: string; orgId: string };
let B: Tenant;

beforeEach(async () => {
  const orgA = await makeOrg();
  const attacker = await makeUser({ name: "Attacker" });
  await addOrgMember(orgA._id, attacker._id, "owner"); // Owner of their OWN org
  A = { attackerId: attacker._id.toString(), orgId: orgA._id.toString() };
  B = await buildTenant();
});

/** Every request is issued by the Org-A attacker with a valid token. */
const call = () => asUser(app, A.attackerId);

describe("UC-10 — reads across tenants return 404", () => {
  const cases = () => [
    ["GET org", () => call().get(`/api/v1/orgs/${B.orgId}`)],
    ["GET org members", () => call().get(`/api/v1/orgs/${B.orgId}/members`)],
    ["GET projects list", () => call().get(`/api/v1/orgs/${B.orgId}/projects`)],
    ["GET project detail", () =>
      call().get(`/api/v1/orgs/${B.orgId}/projects/${B.projectId}`)],
    ["GET project members", () =>
      call().get(`/api/v1/orgs/${B.orgId}/projects/${B.projectId}/members`)],
    ["GET boards list", () =>
      call().get(`/api/v1/projects/${B.projectId}/boards`)],
    ["GET board detail", () =>
      call().get(`/api/v1/projects/${B.projectId}/boards/${B.boardId}`)],
    ["GET cards list", () => call().get(`/api/v1/boards/${B.boardId}/cards`)],
    ["GET card detail", () =>
      call().get(`/api/v1/boards/${B.boardId}/cards/${B.cardId}`)],
    ["GET subtasks", () => call().get(`/api/v1/cards/${B.cardId}/subtasks`)],
    ["GET comments", () => call().get(`/api/v1/cards/${B.cardId}/comments`)],
    ["GET attachments", () => call().get(`/api/v1/cards/${B.cardId}/attachments`)],
  ];

  it.each(cases().map(([n]) => n))("%s → 404", async (name) => {
    const run = cases().find(([n]) => n === name)![1] as () => Promise<{
      status: number;
      body: { code?: string };
    }>;
    const res = await run();
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});

describe("UC-10 — writes across tenants return 404", () => {
  const cases = () => [
    [
      "PATCH org",
      () => call().patch(`/api/v1/orgs/${B.orgId}`).send({ name: "pwned" }),
    ],
    [
      "invite to org",
      () =>
        call()
          .post(`/api/v1/orgs/${B.orgId}/invites`)
          .send({ email: "x@x.com", role: "admin" }),
    ],
    [
      "change org member role",
      () =>
        call()
          .patch(`/api/v1/orgs/${B.orgId}/members/${B.ownerId}`)
          .send({ role: "member" }),
    ],
    [
      "remove org member",
      () => call().delete(`/api/v1/orgs/${B.orgId}/members/${B.ownerId}`),
    ],
    [
      "create project in B",
      () =>
        call().post(`/api/v1/orgs/${B.orgId}/projects`).send({ name: "mine now" }),
    ],
    [
      "PATCH project",
      () =>
        call()
          .patch(`/api/v1/orgs/${B.orgId}/projects/${B.projectId}`)
          .send({ name: "pwned" }),
    ],
    [
      "DELETE project",
      () => call().delete(`/api/v1/orgs/${B.orgId}/projects/${B.projectId}`),
    ],
    [
      "PUT project member",
      () =>
        call()
          .put(
            `/api/v1/orgs/${B.orgId}/projects/${B.projectId}/members/${A.attackerId}`,
          )
          .send({ role: "head" }),
    ],
    [
      "create board",
      () =>
        call()
          .post(`/api/v1/projects/${B.projectId}/boards`)
          .send({ name: "b" }),
    ],
    [
      "PATCH board",
      () =>
        call()
          .patch(`/api/v1/projects/${B.projectId}/boards/${B.boardId}`)
          .send({ name: "x" }),
    ],
    [
      "DELETE board",
      () => call().delete(`/api/v1/projects/${B.projectId}/boards/${B.boardId}`),
    ],
    [
      "create card",
      () =>
        call()
          .post(`/api/v1/boards/${B.boardId}/cards`)
          .send({ title: "t", columnId: B.columnId }),
    ],
    [
      "PATCH card",
      () =>
        call()
          .patch(`/api/v1/boards/${B.boardId}/cards/${B.cardId}`)
          .send({ title: "x" }),
    ],
    [
      "MOVE card",
      () =>
        call()
          .patch(`/api/v1/boards/${B.boardId}/cards/${B.cardId}/move`)
          .send({ columnId: B.columnId, order: 0 }),
    ],
    [
      "DELETE card",
      () => call().delete(`/api/v1/boards/${B.boardId}/cards/${B.cardId}`),
    ],
    [
      "add subtask",
      () =>
        call().post(`/api/v1/cards/${B.cardId}/subtasks`).send({ title: "st" }),
    ],
    [
      "PATCH subtask",
      () =>
        call()
          .patch(`/api/v1/cards/${B.cardId}/subtasks/${B.subtaskId}`)
          .send({ done: true }),
    ],
    [
      "DELETE subtask",
      () =>
        call().delete(`/api/v1/cards/${B.cardId}/subtasks/${B.subtaskId}`),
    ],
    [
      "add comment",
      () =>
        call().post(`/api/v1/cards/${B.cardId}/comments`).send({ body: "hi" }),
    ],
    [
      "DELETE comment",
      () =>
        call().delete(`/api/v1/cards/${B.cardId}/comments/${B.commentId}`),
    ],
    [
      "add attachment",
      () =>
        call().post(`/api/v1/cards/${B.cardId}/attachments`).send({
          fileName: "a",
          fileUrl: "https://x/a",
          mimeType: "x",
          sizeBytes: 1,
        }),
    ],
    [
      "DELETE attachment",
      () =>
        call().delete(
          `/api/v1/cards/${B.cardId}/attachments/${B.attachmentId}`,
        ),
    ],
    [
      "mark B's notification read",
      () =>
        call().patch(`/api/v1/notifications/${B.notificationId}/read`),
    ],
  ];

  it.each(cases().map(([n]) => n))("%s → 404", async (name) => {
    const run = cases().find(([n]) => n === name)![1] as () => Promise<{
      status: number;
    }>;
    const res = await run();
    expect(res.status).toBe(404);
  });
});

describe("UC-10 — the resource is not even acknowledged", () => {
  it("nothing in Org B is mutated by any of the attacker's attempts", async () => {
    await call().patch(`/api/v1/orgs/${B.orgId}/projects/${B.projectId}`).send({ name: "x" });
    await call().delete(`/api/v1/boards/${B.boardId}/cards/${B.cardId}`);
    await call().post(`/api/v1/cards/${B.cardId}/comments`).send({ body: "leak" });

    expect(await CardModel.exists({ _id: B.cardId })).toBeTruthy();
    expect(await CommentModel.countDocuments({ cardId: B.cardId })).toBe(1);
  });

  it("GET /notifications never returns another tenant's rows", async () => {
    const res = await call().get("/api/v1/notifications");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it("the projects list for Org A never leaks Org B's projects", async () => {
    const res = await call().get(`/api/v1/orgs/${A.orgId}/projects`);
    expect(res.status).toBe(200);
    expect(res.body.every((p: { name: string }) => p.name !== "Secret Project")).toBe(true);
  });
});

describe("UC-10 contrast — same-org, no ProjectMembership is 403 (not 404)", () => {
  it("an Org member with no ProjectMembership gets 403 on the project + its resources", async () => {
    const org = await makeOrg();
    const insider = await makeUser();
    await addOrgMember(org._id, insider._id, "member");
    const project = await makeProject(org._id, "Listed Project");
    const board = await makeBoard(org._id, project._id);

    const client = asUser(app, insider._id.toString());

    // The name IS visible in the org's project list…
    const list = await client.get(`/api/v1/orgs/${org._id}/projects`);
    expect(list.status).toBe(200);
    expect(list.body.find((p: { name: string }) => p.name === "Listed Project")).toBeTruthy();

    // …but opening it, or its boards, is 403 — not 404.
    expect(
      (await client.get(`/api/v1/orgs/${org._id}/projects/${project._id}`)).status,
    ).toBe(403);
    expect(
      (await client.get(`/api/v1/projects/${project._id}/boards`)).status,
    ).toBe(403);
    expect(
      (await client.get(`/api/v1/projects/${project._id}/boards/${board._id}`)).status,
    ).toBe(403);
  });
});
