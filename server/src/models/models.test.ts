import { describe, it, expect, beforeAll } from "vitest";
import { Types } from "mongoose";
import {
  AttachmentModel,
  BoardModel,
  CardModel,
  CommentModel,
  NotificationModel,
  OrgMembershipModel,
  OrganizationModel,
  ProjectMembershipModel,
  ProjectModel,
  RefreshTokenModel,
  SubtaskModel,
  UserModel,
} from "./index.js";
import { makeOrg, makeUser } from "../test/factories.js";

const oid = () => new Types.ObjectId();

// Ensure every index (unique + TTL + compound) is built before assertions.
beforeAll(async () => {
  await Promise.all(
    [
      AttachmentModel,
      BoardModel,
      CardModel,
      CommentModel,
      NotificationModel,
      OrgMembershipModel,
      OrganizationModel,
      ProjectMembershipModel,
      ProjectModel,
      RefreshTokenModel,
      SubtaskModel,
      UserModel,
    ].map((m) => m.init()),
  );
});

describe("User", () => {
  it("lowercases + requires a unique email and hides passwordHash in JSON", async () => {
    const u = await UserModel.create({
      email: "  Alex@Acme.COM ",
      name: "Alex",
      passwordHash: "hash",
    });
    expect(u.email).toBe("alex@acme.com");
    expect(JSON.stringify(u)).not.toContain("passwordHash");

    await expect(
      UserModel.create({ email: "alex@acme.com", name: "Dup", passwordHash: "x" }),
    ).rejects.toThrow();
  });

  it("requires email, name and passwordHash", async () => {
    await expect(UserModel.create({ email: "x@y.com" })).rejects.toThrow();
  });
});

describe("Organization", () => {
  it("requires a unique slug", async () => {
    await OrganizationModel.create({ name: "A", slug: "acme" });
    await expect(
      OrganizationModel.create({ name: "B", slug: "acme" }),
    ).rejects.toThrow();
  });
});

describe("OrgMembership", () => {
  it("validates the role enum", async () => {
    await expect(
      OrgMembershipModel.create({ organizationId: oid(), userId: oid(), role: "boss" }),
    ).rejects.toThrow();
  });

  it("is compound-unique on (organizationId, userId)", async () => {
    const organizationId = oid();
    const userId = oid();
    await OrgMembershipModel.create({ organizationId, userId, role: "member" });
    await expect(
      OrgMembershipModel.create({ organizationId, userId, role: "admin" }),
    ).rejects.toThrow();
    // a different user in the same org is fine
    await expect(
      OrgMembershipModel.create({ organizationId, userId: oid(), role: "member" }),
    ).resolves.toBeTruthy();
  });
});

describe("ProjectMembership", () => {
  it("enum + compound unique on (projectId, userId)", async () => {
    const projectId = oid();
    const userId = oid();
    await ProjectMembershipModel.create({ projectId, userId, role: "head" });
    await expect(
      ProjectMembershipModel.create({ projectId, userId, role: "member" }),
    ).rejects.toThrow();
    await expect(
      ProjectMembershipModel.create({ projectId, userId, role: "chief" }),
    ).rejects.toThrow();
  });
});

describe("Project / Board / Card denormalize organizationId", () => {
  it("Project requires organizationId + name", async () => {
    await expect(ProjectModel.create({ name: "No org" })).rejects.toThrow();
    const p = await ProjectModel.create({ organizationId: oid(), name: "Ok" });
    expect(p.organizationId).toBeInstanceOf(Types.ObjectId);
  });

  it("Board embeds columns and carries organizationId", async () => {
    const b = await BoardModel.create({
      organizationId: oid(),
      projectId: oid(),
      name: "B",
      columns: [
        { id: "todo", name: "To Do", order: 0 },
        { id: "done", name: "Done", order: 1 },
      ],
    });
    expect(b.columns).toHaveLength(2);
    expect(b.columns[0]).not.toHaveProperty("_id");
  });

  it("Card requires organizationId/boardId/columnId/title and validates priority", async () => {
    await expect(
      CardModel.create({ boardId: oid(), columnId: "c1", title: "x" }),
    ).rejects.toThrow();
    await expect(
      CardModel.create({
        organizationId: oid(),
        boardId: oid(),
        columnId: "c1",
        order: 0,
        title: "x",
        priority: "sky-high",
      }),
    ).rejects.toThrow();
    const c = await CardModel.create({
      organizationId: oid(),
      boardId: oid(),
      columnId: "c1",
      order: 0,
      title: "x",
    });
    expect(c.labels).toEqual([]);
    expect(c.assigneeIds).toEqual([]);
  });
});

describe("Subtask / Comment / Attachment", () => {
  it("Subtask defaults done=false", async () => {
    const s = await SubtaskModel.create({ cardId: oid(), title: "st" });
    expect(s.done).toBe(false);
  });
  it("Comment requires body + author", async () => {
    await expect(CommentModel.create({ cardId: oid() })).rejects.toThrow();
  });
  it("Attachment requires the file metadata", async () => {
    await expect(
      AttachmentModel.create({ cardId: oid(), uploadedById: oid(), fileName: "a" }),
    ).rejects.toThrow();
  });
});

describe("Notification", () => {
  it("validates the type enum and defaults read=false", async () => {
    await expect(
      NotificationModel.create({ userId: oid(), type: "nope" }),
    ).rejects.toThrow();
    const nfy = await NotificationModel.create({
      userId: oid(),
      type: "card_assigned",
      payload: { cardTitle: "X" },
    });
    expect(nfy.read).toBe(false);
  });
});

describe("RefreshToken", () => {
  it("has a TTL index on expiresAt", async () => {
    const indexes = await RefreshTokenModel.collection.indexes();
    const ttl = indexes.find((i) => i.key?.expiresAt === 1);
    expect(ttl?.expireAfterSeconds).toBe(0);
  });

  it("hashes are unique", async () => {
    const userId = oid();
    await RefreshTokenModel.create({ userId, tokenHash: "abc", expiresAt: new Date(Date.now() + 1000) });
    await expect(
      RefreshTokenModel.create({ userId, tokenHash: "abc", expiresAt: new Date(Date.now() + 1000) }),
    ).rejects.toThrow();
  });
});

describe("index coverage (srs/05-data-model.md summary)", () => {
  it("declares the documented compound indexes", async () => {
    const cardIx = (await CardModel.collection.indexes()).map((i) => JSON.stringify(i.key));
    expect(cardIx).toContain(JSON.stringify({ boardId: 1, columnId: 1, order: 1 }));
    expect(cardIx).toContain(JSON.stringify({ organizationId: 1 }));

    const nIx = (await NotificationModel.collection.indexes()).map((i) => JSON.stringify(i.key));
    expect(nIx).toContain(JSON.stringify({ userId: 1, createdAt: -1 }));

    const omIx = (await OrgMembershipModel.collection.indexes()).find(
      (i) => JSON.stringify(i.key) === JSON.stringify({ organizationId: 1, userId: 1 }),
    );
    expect(omIx?.unique).toBe(true);
  });
});

describe("factories smoke", () => {
  it("build a linked user + org", async () => {
    const org = await makeOrg();
    const user = await makeUser();
    expect(org.slug).toMatch(/^org-/);
    expect(user.email).toContain("@");
  });
});
