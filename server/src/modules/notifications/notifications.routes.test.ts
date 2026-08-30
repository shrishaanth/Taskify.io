import { describe, it, expect } from "vitest";
import { createApp } from "../../app.js";
import { asUser } from "../../test/api.js";
import { NotificationModel } from "../../models/index.js";
import { makeUser } from "../../test/factories.js";

const app = createApp();

async function seed(userId: string, n: number, read = false) {
  await NotificationModel.insertMany(
    Array.from({ length: n }, (_, i) => ({
      userId,
      type: "card_assigned",
      payload: { i },
      read,
    })),
  );
}

describe("GET /notifications (self only)", () => {
  it("lists the caller's notifications, newest first, with unread count + pagination", async () => {
    const me = await makeUser();
    const other = await makeUser();
    await seed(me._id.toString(), 3, false);
    await seed(me._id.toString(), 1, true);
    await seed(other._id.toString(), 5, false);

    const res = await asUser(app, me).get("/api/v1/notifications?limit=2");
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(4);
    expect(res.body.unread).toBe(3);
    expect(res.body.page).toBe(1);

    const p2 = await asUser(app, me).get("/api/v1/notifications?page=2&limit=2");
    expect(p2.body.items).toHaveLength(2);
  });

  it("401s without a token", async () => {
    const supertest = (await import("supertest")).default;
    expect((await supertest(app).get("/api/v1/notifications")).status).toBe(401);
  });
});

describe("PATCH /notifications/:id/read", () => {
  it("marks one as read; 404 for someone else's notification", async () => {
    const me = await makeUser();
    const other = await makeUser();
    await seed(me._id.toString(), 1);
    await seed(other._id.toString(), 1);
    const mine = await NotificationModel.findOne({ userId: me._id });
    const theirs = await NotificationModel.findOne({ userId: other._id });

    expect(
      (await asUser(app, me).patch(`/api/v1/notifications/${mine!._id}/read`)).status,
    ).toBe(204);
    expect((await NotificationModel.findById(mine!._id))!.read).toBe(true);

    // another user's notification is "not found" from my perspective
    expect(
      (await asUser(app, me).patch(`/api/v1/notifications/${theirs!._id}/read`)).status,
    ).toBe(404);
  });
});

describe("PATCH /notifications/read-all", () => {
  it("marks every unread notification for the caller as read", async () => {
    const me = await makeUser();
    const other = await makeUser();
    await seed(me._id.toString(), 4, false);
    await seed(other._id.toString(), 2, false);

    expect((await asUser(app, me).patch("/api/v1/notifications/read-all")).status).toBe(204);
    expect(
      await NotificationModel.countDocuments({ userId: me._id, read: false }),
    ).toBe(0);
    // untouched for the other user
    expect(
      await NotificationModel.countDocuments({ userId: other._id, read: false }),
    ).toBe(2);
  });
});
