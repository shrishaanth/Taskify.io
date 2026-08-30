import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth } from "./requireAuth.js";
import { errorHandler } from "./errorHandler.js";
import { signAccessToken } from "../lib/tokens.js";
import { makeOrg, makeUser, addOrgMember } from "../test/factories.js";

function app() {
  const a = express();
  a.get("/me", requireAuth, (req, res) => {
    res.json(req.auth);
  });
  a.use(errorHandler);
  return a;
}

describe("requireAuth", () => {
  it("401s with no Authorization header", async () => {
    const res = await request(app()).get("/me");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: expect.any(String), code: "UNAUTHENTICATED" });
  });

  it("401s on a malformed / bad-signature token", async () => {
    const res = await request(app())
      .get("/me")
      .set("Authorization", "Bearer not.a.jwt");
    expect(res.status).toBe(401);
  });

  it("401s when the user no longer exists", async () => {
    const token = signAccessToken("64b7f0000000000000000000");
    const res = await request(app()).get("/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("resolves the caller's org memberships once, attaching req.auth", async () => {
    const user = await makeUser();
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    await addOrgMember(orgA._id, user._id, "owner");
    await addOrgMember(orgB._id, user._id, "member");

    const token = signAccessToken(user._id.toString());
    const res = await request(app()).get("/me").set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user._id.toString());
    expect(res.body.orgIds).toHaveLength(2);
    const roles = res.body.orgMemberships
      .map((m: { role: string }) => m.role)
      .sort();
    expect(roles).toEqual(["member", "owner"]);
  });
});
