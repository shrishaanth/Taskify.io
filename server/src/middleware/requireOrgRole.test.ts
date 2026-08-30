import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth } from "./requireAuth.js";
import { requireOrgRole } from "./requireOrgRole.js";
import { errorHandler } from "./errorHandler.js";
import { signAccessToken } from "../lib/tokens.js";
import { OrgMembershipModel } from "../models/index.js";
import { makeOrg, makeUser, addOrgMember } from "../test/factories.js";

function app(...roles: ("owner" | "admin" | "member")[]) {
  const a = express();
  a.get(
    "/orgs/:orgId/thing",
    requireAuth,
    requireOrgRole(...roles),
    (req, res) => res.json(req.org),
  );
  a.use(errorHandler);
  return a;
}

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

describe("requireOrgRole", () => {
  it("404s when the caller is not a member of that org (cross-tenant hidden)", async () => {
    const user = await makeUser();
    const orgMine = await makeOrg();
    const orgOther = await makeOrg();
    await addOrgMember(orgMine._id, user._id, "owner");
    const token = signAccessToken(user._id.toString());

    const res = await request(app("owner", "admin"))
      .get(`/orgs/${orgOther._id}/thing`)
      .set(auth(token));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("403s when the member's role is not allowed", async () => {
    const user = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, user._id, "member");
    const token = signAccessToken(user._id.toString());

    const res = await request(app("owner", "admin"))
      .get(`/orgs/${org._id}/thing`)
      .set(auth(token));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("passes an allowed role and exposes req.org", async () => {
    const user = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, user._id, "admin");
    const token = signAccessToken(user._id.toString());

    const res = await request(app("owner", "admin"))
      .get(`/orgs/${org._id}/thing`)
      .set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: org._id.toString(), role: "admin" });
  });

  it("with no role list, any membership passes", async () => {
    const user = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, user._id, "member");
    const token = signAccessToken(user._id.toString());
    const res = await request(app()).get(`/orgs/${org._id}/thing`).set(auth(token));
    expect(res.status).toBe(200);
  });

  it("a demotion takes effect on the very next request (role re-read from DB)", async () => {
    const user = await makeUser();
    const org = await makeOrg();
    const membership = await addOrgMember(org._id, user._id, "owner");
    const token = signAccessToken(user._id.toString());

    const ok = await request(app("owner")).get(`/orgs/${org._id}/thing`).set(auth(token));
    expect(ok.status).toBe(200);

    await OrgMembershipModel.updateOne({ _id: membership._id }, { role: "member" });

    const denied = await request(app("owner"))
      .get(`/orgs/${org._id}/thing`)
      .set(auth(token)); // same token
    expect(denied.status).toBe(403);
  });

  it("404s on a garbage orgId", async () => {
    const user = await makeUser();
    const org = await makeOrg();
    await addOrgMember(org._id, user._id, "owner");
    const token = signAccessToken(user._id.toString());
    const res = await request(app()).get("/orgs/not-an-id/thing").set(auth(token));
    expect(res.status).toBe(404);
  });
});
