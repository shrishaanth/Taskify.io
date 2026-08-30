import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../app.js";
import { RefreshTokenModel, UserModel } from "../../models/index.js";
import { verifyAccessToken } from "../../lib/tokens.js";

const app = createApp();
const V1 = "/api/v1/auth";

const signup = (over: Record<string, unknown> = {}) =>
  request(app)
    .post(`${V1}/signup`)
    .send({ email: "new@acme.com", name: "New User", password: "supersecret1", ...over });

describe("POST /auth/signup (UC-1)", () => {
  it("creates a User with NO organization and returns tokens", async () => {
    const res = await signup();
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: "new@acme.com", name: "New User" });
    expect(res.body.user).not.toHaveProperty("passwordHash");
    expect(verifyAccessToken(res.body.accessToken).userId).toBe(res.body.user.id);
    expect(res.body.refreshToken).toEqual(expect.any(String));

    const me = await request(app)
      .get(`${V1}/me`)
      .set("Authorization", `Bearer ${res.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.memberships).toEqual([]);
  });

  it("rejects a duplicate email with 409", async () => {
    await signup();
    const res = await signup({ name: "Dupe" });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe("CONFLICT");
  });

  it("rejects a weak password with 400 VALIDATION_ERROR", async () => {
    const res = await signup({ password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });

  it("rejects a malformed email", async () => {
    expect((await signup({ email: "nope" })).status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  it("returns fresh tokens for valid credentials", async () => {
    await signup();
    const res = await request(app)
      .post(`${V1}/login`)
      .send({ email: "new@acme.com", password: "supersecret1" });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it("401s on a wrong password without leaking which field was wrong", async () => {
    await signup();
    const res = await request(app)
      .post(`${V1}/login`)
      .send({ email: "new@acme.com", password: "WRONGWRONG" });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it("401s for an unknown account", async () => {
    const res = await request(app)
      .post(`${V1}/login`)
      .send({ email: "ghost@acme.com", password: "whatever1" });
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refresh (rotation)", () => {
  it("issues a new access token and rotates (revokes) the old refresh token", async () => {
    const { body } = await signup();
    const first = body.refreshToken;

    const r1 = await request(app).post(`${V1}/refresh`).send({ refreshToken: first });
    expect(r1.status).toBe(200);
    expect(r1.body.accessToken).toEqual(expect.any(String));
    expect(r1.body.refreshToken).not.toBe(first);

    // the old token no longer works
    const reuse = await request(app).post(`${V1}/refresh`).send({ refreshToken: first });
    expect(reuse.status).toBe(401);

    // the new one does
    const r2 = await request(app)
      .post(`${V1}/refresh`)
      .send({ refreshToken: r1.body.refreshToken });
    expect(r2.status).toBe(200);
  });

  it("401s on an unknown refresh token", async () => {
    const res = await request(app).post(`${V1}/refresh`).send({ refreshToken: "nope" });
    expect(res.status).toBe(401);
  });
});

describe("POST /auth/logout and /logout-all", () => {
  it("logout revokes the presented refresh token", async () => {
    const { body } = await signup();
    const out = await request(app)
      .post(`${V1}/logout`)
      .send({ refreshToken: body.refreshToken });
    expect(out.status).toBe(204);
    expect(
      (await request(app).post(`${V1}/refresh`).send({ refreshToken: body.refreshToken }))
        .status,
    ).toBe(401);
  });

  it("logout-all revokes every refresh token for the user (spec §5.3)", async () => {
    const s1 = await signup();
    const login2 = await request(app)
      .post(`${V1}/login`)
      .send({ email: "new@acme.com", password: "supersecret1" });

    const res = await request(app)
      .post(`${V1}/logout-all`)
      .set("Authorization", `Bearer ${s1.body.accessToken}`);
    expect(res.status).toBe(204);

    const user = await UserModel.findOne({ email: "new@acme.com" });
    const live = await RefreshTokenModel.countDocuments({
      userId: user!._id,
      revokedAt: { $exists: false },
    });
    expect(live).toBe(0);
    expect(
      (
        await request(app)
          .post(`${V1}/refresh`)
          .send({ refreshToken: login2.body.refreshToken })
      ).status,
    ).toBe(401);
  });

  it("logout-all requires authentication", async () => {
    expect((await request(app).post(`${V1}/logout-all`)).status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("401s without a token, 200 with the user + memberships list", async () => {
    expect((await request(app).get(`${V1}/me`)).status).toBe(401);
    const { body } = await signup();
    const res = await request(app)
      .get(`${V1}/me`)
      .set("Authorization", `Bearer ${body.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("new@acme.com");
    expect(Array.isArray(res.body.memberships)).toBe(true);
  });
});
