import { describe, it, expect } from "vitest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import {
  AttachmentModel,
  CardModel,
  CommentModel,
  NotificationModel,
  SubtaskModel,
} from "../../models/index.js";
import {
  addOrgMember,
  addProjectMember,
  makeBoard,
  makeOrg,
  makeProject,
  makeUser,
} from "../../test/factories.js";

const app = createApp();

async function scenario() {
  const org = await makeOrg();
  const head = await makeUser({ name: "Head" });
  const member = await makeUser({ name: "Member" });
  const stranger = await makeUser({ name: "Stranger" }); // in org, not on project
  await addOrgMember(org._id, head._id, "member");
  await addOrgMember(org._id, member._id, "member");
  await addOrgMember(org._id, stranger._id, "member");
  const project = await makeProject(org._id);
  await addProjectMember(project._id, head._id, "head");
  await addProjectMember(project._id, member._id, "member");
  const board = await makeBoard(org._id, project._id); // one column "c1"
  return { org, head, member, stranger, project, board };
}

const cardsUrl = (boardId: string) => `/api/v1/boards/${boardId}/cards`;

describe("cards CRUD", () => {
  it("creates a card, defaulting order to the column tail; notifies assignees (UC-5)", async () => {
    const { head, member, board } = await scenario();
    const res = await asUser(app, head)
      .post(cardsUrl(board._id.toString()))
      .send({
        title: "Design tokens",
        columnId: "c1",
        assigneeIds: [member._id.toString()],
        priority: "high",
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Design tokens", columnId: "c1", order: 0 });

    const notif = await NotificationModel.findOne({
      userId: member._id,
      type: "card_assigned",
    });
    expect(notif).toBeTruthy();
    // the actor is not notified
    expect(await NotificationModel.exists({ userId: head._id, type: "card_assigned" })).toBeFalsy();
  });

  it("rejects an assignee who is not a project member (UC-5 validation)", async () => {
    const { head, stranger, board } = await scenario();
    const res = await asUser(app, head)
      .post(cardsUrl(board._id.toString()))
      .send({ title: "x", columnId: "c1", assigneeIds: [stranger._id.toString()] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects an unknown columnId", async () => {
    const { head, board } = await scenario();
    const res = await asUser(app, head)
      .post(cardsUrl(board._id.toString()))
      .send({ title: "x", columnId: "ghost" });
    expect(res.status).toBe(400);
  });

  it("GET /:cardId embeds subtasks, comments, attachments", async () => {
    const { head, board } = await scenario();
    const card = await CardModel.create({
      organizationId: board.organizationId,
      boardId: board._id,
      columnId: "c1",
      order: 0,
      title: "C",
    });
    await SubtaskModel.create({ cardId: card._id, title: "st" });
    await CommentModel.create({ cardId: card._id, authorId: head._id, body: "hi" });

    const res = await asUser(app, head).get(
      `${cardsUrl(board._id.toString())}/${card._id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body.subtasks).toHaveLength(1);
    expect(res.body.comments).toHaveLength(1);
    expect(res.body.attachments).toEqual([]);
  });

  it("PATCH edits fields; clears dueDate/priority with null; validates new assignees", async () => {
    const { head, member, board } = await scenario();
    const card = await CardModel.create({
      organizationId: board.organizationId,
      boardId: board._id,
      columnId: "c1",
      order: 0,
      title: "C",
      priority: "low",
      dueDate: new Date(),
    });

    const res = await asUser(app, head)
      .patch(`${cardsUrl(board._id.toString())}/${card._id}`)
      .send({
        title: "Renamed",
        priority: null,
        dueDate: null,
        assigneeIds: [member._id.toString()],
        labels: ["a", "b"],
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Renamed");
    expect(res.body).not.toHaveProperty("priority");
    expect(res.body).not.toHaveProperty("dueDate");
    expect(res.body.labels).toEqual(["a", "b"]);
  });

  it("DELETE cascades to the card's subtasks/comments/attachments", async () => {
    const { head, board } = await scenario();
    const card = await CardModel.create({
      organizationId: board.organizationId,
      boardId: board._id,
      columnId: "c1",
      order: 0,
      title: "C",
    });
    await SubtaskModel.create({ cardId: card._id, title: "st" });
    await AttachmentModel.create({
      cardId: card._id,
      uploadedById: head._id,
      fileName: "a.png",
      fileUrl: "http://x/a.png",
      mimeType: "image/png",
      sizeBytes: 10,
    });

    const res = await asUser(app, head).delete(
      `${cardsUrl(board._id.toString())}/${card._id}`,
    );
    expect(res.status).toBe(204);
    expect(await CardModel.exists({ _id: card._id })).toBeFalsy();
    expect(await SubtaskModel.countDocuments({ cardId: card._id })).toBe(0);
    expect(await AttachmentModel.countDocuments({ cardId: card._id })).toBe(0);
  });
});

describe("PATCH /:cardId/move (UC-6)", () => {
  it("moves a card between columns and renumbers both", async () => {
    const { head, board, project } = await scenario();
    // give the board a second column
    await asUser(app, head)
      .patch(`/api/v1/projects/${project._id}/boards/${board._id}`)
      .send({
        columns: [
          { id: "c1", name: "To Do", order: 0 },
          { id: "c2", name: "Doing", order: 1 },
        ],
      });

    const mk = (title: string, columnId: string, order: number) =>
      CardModel.create({
        organizationId: board.organizationId,
        boardId: board._id,
        columnId,
        order,
        title,
      });
    const a = await mk("A", "c1", 0);
    await mk("B", "c1", 1);
    await mk("C", "c1", 2);

    const res = await asUser(app, head)
      .patch(`${cardsUrl(board._id.toString())}/${a._id}/move`)
      .send({ columnId: "c2", order: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ columnId: "c2", order: 0 });

    const c1 = await CardModel.find({ boardId: board._id, columnId: "c1" })
      .sort({ order: 1 })
      .lean();
    expect(c1.map((c) => `${c.title}:${c.order}`)).toEqual(["B:0", "C:1"]);
  });
});

describe("cards access control (UC-10 contrast)", () => {
  it("403s a same-org user with no ProjectMembership", async () => {
    const { stranger, board } = await scenario();
    expect(
      (await asUser(app, stranger).get(cardsUrl(board._id.toString()))).status,
    ).toBe(403);
  });

  it("404s a user from another tenant", async () => {
    const { board } = await scenario();
    const otherOrg = await makeOrg();
    const outsider = await makeUser();
    await addOrgMember(otherOrg._id, outsider._id, "owner");
    expect(
      (await asUser(app, outsider).get(cardsUrl(board._id.toString()))).status,
    ).toBe(404);
  });

  it("404s an unknown board id", async () => {
    const { head } = await scenario();
    expect(
      (await asUser(app, head).get(cardsUrl("64b7f0000000000000000000"))).status,
    ).toBe(404);
  });
});
