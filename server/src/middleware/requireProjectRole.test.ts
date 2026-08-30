import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { requireAuth } from "./requireAuth.js";
import { requireProjectRole, requireProjectManage } from "./requireProjectRole.js";
import { errorHandler } from "./errorHandler.js";
import { signAccessToken } from "../lib/tokens.js";
import {
  ProjectMembershipModel,
  ProjectModel,
  OrgMembershipModel,
} from "../models/index.js";
import {
  makeOrg,
  makeUser,
  addOrgMember,
  makeProject,
  addProjectMember,
} from "../test/factories.js";

beforeAll(async () => {
  await Promise.all([ProjectModel.init(), ProjectMembershipModel.init(), OrgMembershipModel.init()]);
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

function appRole(...roles: ("head" | "member")[]) {
  const a = express();
  a.get(
    "/projects/:projectId/x",
    requireAuth,
    requireProjectRole(...roles),
    (req, res) => res.json(req.project),
  );
  a.use(errorHandler);
  return a;
}

function appManage() {
  const a = express();
  a.get(
    "/projects/:projectId/members",
    requireAuth,
    requireProjectManage(),
    (req, res) => res.json(req.project),
  );
  a.use(errorHandler);
  return a;
}

describe("requireProjectRole", () => {
  it("lets a Project Head through, exposing req.project", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");

    const res = await request(appRole("head"))
      .get(`/projects/${project._id}/x`)
      .set(auth(signAccessToken(head._id.toString())));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: project._id.toString(),
      role: "head",
      viaOrgOverride: false,
    });
  });

  it("403s a Member on a head-only route, but 200s when 'member' is allowed", async () => {
    const org = await makeOrg();
    const member = await makeUser();
    await addOrgMember(org._id, member._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, member._id, "member");
    const token = signAccessToken(member._id.toString());

    const denied = await request(appRole("head"))
      .get(`/projects/${project._id}/x`)
      .set(auth(token));
    expect(denied.status).toBe(403);

    const ok = await request(appRole("head", "member"))
      .get(`/projects/${project._id}/x`)
      .set(auth(token));
    expect(ok.status).toBe(200);
    expect(ok.body.role).toBe("member");
  });

  it("403s an org member who has no ProjectMembership (project is listed — FR-2.3)", async () => {
    const org = await makeOrg();
    const orgMemberOnly = await makeUser();
    await addOrgMember(org._id, orgMemberOnly._id, "member");
    const project = await makeProject(org._id); // no ProjectMembership row

    const res = await request(appRole("head", "member"))
      .get(`/projects/${project._id}/x`)
      .set(auth(signAccessToken(orgMemberOnly._id.toString())));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("FORBIDDEN");
  });

  it("404s a user from another org (cross-tenant — never acknowledged, UC-10)", async () => {
    const orgA = await makeOrg();
    const orgB = await makeOrg();
    const outsider = await makeUser();
    await addOrgMember(orgA._id, outsider._id, "owner");
    const projectInB = await makeProject(orgB._id);

    const res = await request(appRole("head", "member"))
      .get(`/projects/${projectInB._id}/x`)
      .set(auth(signAccessToken(outsider._id.toString())));
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("404s an unknown / malformed project id", async () => {
    const org = await makeOrg();
    const u = await makeUser();
    await addOrgMember(org._id, u._id, "owner");
    const token = signAccessToken(u._id.toString());

    expect(
      (await request(appRole()).get("/projects/nope/x").set(auth(token))).status,
    ).toBe(404);
    expect(
      (
        await request(appRole())
          .get("/projects/64b7f0000000000000000000/x")
          .set(auth(token))
      ).status,
    ).toBe(404);
  });

  it("applies a demotion (head → member) on the next request", async () => {
    const org = await makeOrg();
    const user = await makeUser();
    await addOrgMember(org._id, user._id, "member");
    const project = await makeProject(org._id);
    const pm = await addProjectMember(project._id, user._id, "head");
    const token = signAccessToken(user._id.toString());

    expect(
      (await request(appRole("head")).get(`/projects/${project._id}/x`).set(auth(token)))
        .status,
    ).toBe(200);

    await ProjectMembershipModel.updateOne({ _id: pm._id }, { role: "member" });

    expect(
      (await request(appRole("head")).get(`/projects/${project._id}/x`).set(auth(token)))
        .status,
    ).toBe(403);
  });
});

describe("requireProjectManage — Org Owner/Admin override (FR-2.7)", () => {
  it("lets an Org Owner with no ProjectMembership through, flagged viaOrgOverride", async () => {
    const org = await makeOrg();
    const owner = await makeUser();
    await addOrgMember(org._id, owner._id, "owner");
    const project = await makeProject(org._id);

    const res = await request(appManage())
      .get(`/projects/${project._id}/members`)
      .set(auth(signAccessToken(owner._id.toString())));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ role: null, viaOrgOverride: true });
  });

  it("still 403s a plain Project Member (no override for them)", async () => {
    const org = await makeOrg();
    const member = await makeUser();
    await addOrgMember(org._id, member._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, member._id, "member");

    const res = await request(appManage())
      .get(`/projects/${project._id}/members`)
      .set(auth(signAccessToken(member._id.toString())));
    expect(res.status).toBe(403);
  });

  it("a Project Head passes normally (not via override)", async () => {
    const org = await makeOrg();
    const head = await makeUser();
    await addOrgMember(org._id, head._id, "member");
    const project = await makeProject(org._id);
    await addProjectMember(project._id, head._id, "head");

    const res = await request(appManage())
      .get(`/projects/${project._id}/members`)
      .set(auth(signAccessToken(head._id.toString())));
    expect(res.status).toBe(200);
    expect(res.body.viaOrgOverride).toBe(false);
  });
});
