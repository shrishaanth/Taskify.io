import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { CardModel, RefreshTokenModel } from "../models/index.js";
import { asUser } from "../test/api.js";
import {
  addOrgMember,
  makeBoard,
  makeCard,
  makeOrg,
  makeScenario,
  makeUser,
} from "../test/factories.js";

const app = createApp();

describe("accepting an invite as a new user starts a full session", () => {
  it("issues a refresh token and cookie that can be exchanged", async () => {
    const owner = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, owner._id, "owner");
    const invite = await asUser(app, owner)
      .post(`/api/v1/orgs/${org._id}/invites`)
      .send({ email: "fresh.invitee@example.com", role: "member" })
      .expect(201);

    const accepted = await request(app)
      .post(`/api/v1/orgs/invites/${invite.body.token}/accept`)
      .send({ name: "Fresh Invitee", password: "supersecret1" })
      .expect(201);

    expect(accepted.body.accessToken).toEqual(expect.any(String));
    expect(accepted.body.refreshToken).toEqual(expect.any(String));
    expect(String(accepted.headers["set-cookie"])).toContain("taskify_refresh=");
    expect(
      await RefreshTokenModel.countDocuments({ userId: accepted.body.user.id }),
    ).toBe(1);

    await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: accepted.body.refreshToken })
      .expect(200);
  });
});

describe("removing a column never strands its cards", () => {
  async function boardWithCards() {
    const { head, project } = await makeScenario();
    const api = asUser(app, head);
    const board = (
      await api.post(`/api/v1/projects/${project._id}/boards`).send({ name: "B" })
    ).body as { id: string; columns: { id: string; name: string; order: number }[] };
    const [todo, doing, done] = board.columns;
    const mk = async (title: string, columnId: string) =>
      (await api.post(`/api/v1/boards/${board.id}/cards`).send({ title, columnId })).body;
    await mk("T1", todo!.id);
    await mk("T2", todo!.id);
    await mk("D1", doing!.id);
    const url = `/api/v1/projects/${project._id}/boards/${board.id}`;
    return { api, board, todo: todo!, doing: doing!, done: done!, url };
  }

  it("refuses with COLUMN_NOT_EMPTY and changes nothing", async () => {
    const { api, board, doing, done, url } = await boardWithCards();
    const res = await api.patch(url).send({ columns: [doing, done] }).expect(409);
    expect(res.body.details).toEqual({ code: "COLUMN_NOT_EMPTY", cards: 2 });

    const after = await api.get(url);
    expect(after.body.columns).toHaveLength(3);
    expect(await CardModel.countDocuments({ boardId: board.id })).toBe(3);
  });

  it("moves the cards to the end of the chosen column", async () => {
    const { api, board, todo, doing, done, url } = await boardWithCards();
    const res = await api
      .patch(url)
      .send({ columns: [doing, done], moveCardsTo: doing.id })
      .expect(200);
    expect(res.body.cardsChanged).toBe(true);

    const cards = (await api.get(`/api/v1/boards/${board.id}/cards`)).body as {
      title: string;
      columnId: string;
      order: number;
    }[];
    expect(cards.some((c) => c.columnId === todo.id)).toBe(false);
    const inDoing = cards
      .filter((c) => c.columnId === doing.id)
      .sort((a, b) => a.order - b.order)
      .map((c) => c.title);
    expect(inDoing).toEqual(["D1", "T1", "T2"]);
  });

  it("deletes the cards when asked to", async () => {
    const { api, board, doing, done, url } = await boardWithCards();
    await api.patch(url).send({ columns: [doing, done], deleteCards: true }).expect(200);
    expect(await CardModel.countDocuments({ boardId: board.id })).toBe(1);
  });

  it("rejects a move target that is itself being removed", async () => {
    const { api, todo, done, url } = await boardWithCards();
    await api.patch(url).send({ columns: [done], moveCardsTo: todo.id }).expect(400);
  });

  it("lets an empty column go without any extra flag", async () => {
    const { api, todo, doing, url } = await boardWithCards();
    const res = await api.patch(url).send({ columns: [todo, doing] }).expect(200);
    expect(res.body.cardsChanged).toBe(false);
  });
});

describe("card order after a delete", () => {
  it("never reuses an order number already taken in the column", async () => {
    const { head, project, org } = await makeScenario();
    const board = await makeBoard(org._id, project._id);
    await makeCard(org._id, board._id); // order 0 from the factory
    const api = asUser(app, head);
    const mk = async (title: string) =>
      (await api.post(`/api/v1/boards/${board._id}/cards`).send({ title, columnId: "c1" })).body;
    const b = await mk("B");
    await mk("C");
    await api.delete(`/api/v1/boards/${board._id}/cards/${b.id}`).expect(204);
    await mk("D");

    const orders = (
      (await api.get(`/api/v1/boards/${board._id}/cards`)).body as { order: number }[]
    ).map((c) => c.order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
