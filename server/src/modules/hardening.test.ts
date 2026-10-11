import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { hashRefreshToken } from "../lib/tokens.js";
import { RefreshTokenModel } from "../models/index.js";
import { asUser } from "../test/api.js";
import { makeBoard, makeCard, makeScenario } from "../test/factories.js";

const app = createApp();

async function session() {
  const res = await request(app)
    .post("/api/v1/auth/signup")
    .send({
      email: `rot_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
      name: "Rot",
      password: "supersecret1",
    })
    .expect(201);
  return res.body as { refreshToken: string; user: { id: string } };
}
const refresh = (refreshToken: string) =>
  request(app).post("/api/v1/auth/refresh").send({ refreshToken });

describe("refresh token rotation", () => {
  it("lets only one of two simultaneous exchanges succeed", async () => {
    const { refreshToken } = await session();
    const [a, b] = await Promise.all([refresh(refreshToken), refresh(refreshToken)]);
    expect([a.status, b.status].sort()).toEqual([200, 401]);
  });

  it("a near-simultaneous second use is refused without ending the session", async () => {
    const { refreshToken } = await session();
    const first = await refresh(refreshToken).expect(200);
    await refresh(refreshToken).expect(401);
    // The winner's new token still works.
    await refresh(first.body.refreshToken).expect(200);
  });

  it("replaying a token long after it was rotated ends every session", async () => {
    const { refreshToken, user } = await session();
    const first = await refresh(refreshToken).expect(200);

    // Age the rotation past the grace window.
    await RefreshTokenModel.updateOne(
      { tokenHash: hashRefreshToken(refreshToken) },
      { $set: { revokedAt: new Date(Date.now() - 60_000) } },
    );

    await refresh(refreshToken).expect(401);
    await refresh(first.body.refreshToken).expect(401);
    expect(
      await RefreshTokenModel.countDocuments({
        userId: user.id,
        revokedAt: { $exists: false },
      }),
    ).toBe(0);
  });
});

describe("input validation", () => {
  it("refuses a subtask assignee who is not in the project", async () => {
    const { head, member, outsider, project, org } = await makeScenario();
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    const api = asUser(app, head);
    const url = `/api/v1/cards/${card._id}/subtasks`;

    await api.post(url).send({ title: "s", assigneeId: String(outsider._id) }).expect(400);
    const ok = await api
      .post(url)
      .send({ title: "s", assigneeId: String(member._id) })
      .expect(201);
    await api
      .patch(`${url}/${ok.body.id}`)
      .send({ assigneeId: String(outsider._id) })
      .expect(400);
  });

  it("only accepts http(s) attachment links", async () => {
    const { head, project, org } = await makeScenario();
    const board = await makeBoard(org._id, project._id);
    const card = await makeCard(org._id, board._id);
    const api = asUser(app, head);
    const body = (fileUrl: string) => ({
      fileName: "x",
      fileUrl,
      mimeType: "text/plain",
      sizeBytes: 1,
    });
    const url = `/api/v1/cards/${card._id}/attachments`;

    await api.post(url).send(body("javascript:alert(1)")).expect(400);
    await api.post(url).send(body("data:text/html,<script>1</script>")).expect(400);
    await api.post(url).send(body("https://example.com/file.pdf")).expect(201);
  });
});

describe("security headers", () => {
  it("sends the helmet defaults on API responses", async () => {
    const res = await request(app).get("/api/health").expect(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
