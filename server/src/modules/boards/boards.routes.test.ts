import { describe, it, expect } from "vitest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import { CardModel, SubtaskModel } from "../../models/index.js";
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
const boards = (projectId: string) => `/api/v1/projects/${projectId}/boards`;

async function projectWith(role: "head" | "member") {
  const org = await makeOrg();
  const user = await makeUser();
  await addOrgMember(org._id, user._id, "member");
  const project = await makeProject(org._id);
  await addProjectMember(project._id, user._id, role);
  return { org, user, project };
}

describe("boards CRUD (FR-3.3 — Head and Member identical)", () => {
  it("POST seeds the three default columns (UC-4)", async () => {
    const { user, project } = await projectWith("member");
    const res = await asUser(app, user)
      .post(boards(project._id.toString()))
      .send({ name: "Sprint Board" });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Sprint Board");
    expect(res.body.columns.map((c: { name: string }) => c.name)).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
    expect(res.body.columns.every((c: { id: string }) => c.id.startsWith("col_"))).toBe(true);
  });

  it("GET lists boards; GET/:id returns columns", async () => {
    const { user, project, org } = await projectWith("head");
    await makeBoard(org._id, project._id, "Alpha");
    await makeBoard(org._id, project._id, "Beta");

    const list = await asUser(app, user).get(boards(project._id.toString()));
    expect(list.status).toBe(200);
    expect(list.body.map((b: { name: string }) => b.name).sort()).toEqual(["Alpha", "Beta"]);

    const one = await asUser(app, user).get(
      `${boards(project._id.toString())}/${list.body[0].id}`,
    );
    expect(one.status).toBe(200);
    expect(Array.isArray(one.body.columns)).toBe(true);
  });

  it("PATCH renames the board and rewrites columns (ids kept, order re-indexed)", async () => {
    const { user, project, org } = await projectWith("member");
    const board = await makeBoard(org._id, project._id);
    const originalId = board.columns[0].id;

    const res = await asUser(app, user)
      .patch(`${boards(project._id.toString())}/${board._id}`)
      .send({
        name: "Renamed",
        columns: [
          { id: originalId, name: "Backlog", order: 5 },
          { name: "Doing", order: 1 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
    expect(res.body.columns).toEqual([
      { id: expect.any(String), name: "Doing", order: 0 },
      { id: originalId, name: "Backlog", order: 1 },
    ]);
  });

  it("DELETE cascades to the board's cards + their children", async () => {
    const { user, project, org } = await projectWith("head");
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    await SubtaskModel.create({ cardId: card._id, title: "st" });

    const res = await asUser(app, user).delete(
      `${boards(project._id.toString())}/${board._id}`,
    );
    expect(res.status).toBe(204);
    expect(await CardModel.exists({ _id: card._id })).toBeFalsy();
    expect(await SubtaskModel.countDocuments({ cardId: card._id })).toBe(0);
  });
});

describe("boards access control", () => {
  it("403s a same-org user with no ProjectMembership", async () => {
    const org = await makeOrg();
    const orgMate = await makeUser();
    await addOrgMember(org._id, orgMate._id, "member");
    const project = await makeProject(org._id);

    const res = await asUser(app, orgMate).get(boards(project._id.toString()));
    expect(res.status).toBe(403);
  });

  it("404s a user from another tenant (UC-10)", async () => {
    const orgA = await makeOrg();
    const outsider = await makeUser();
    await addOrgMember(orgA._id, outsider._id, "owner");
    const otherOrg = await makeOrg();
    const project = await makeProject(otherOrg._id);

    const res = await asUser(app, outsider).get(boards(project._id.toString()));
    expect(res.status).toBe(404);
  });

  it("404s a board id that belongs to another project", async () => {
    const { user, project, org } = await projectWith("head");
    const otherProject = await makeProject(org._id);
    const foreignBoard = await makeBoard(org._id, otherProject._id);

    const res = await asUser(app, user).get(
      `${boards(project._id.toString())}/${foreignBoard._id}`,
    );
    expect(res.status).toBe(404);
  });

  it("401s without a token", async () => {
    const { project } = await projectWith("head");
    const supertest = (await import("supertest")).default;
    expect((await supertest(app).get(boards(project._id.toString()))).status).toBe(401);
  });
});
