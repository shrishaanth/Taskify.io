import { describe, it, expect } from "vitest";
import { notificationHref } from "./notificationLink";
import type { AppNotification } from "../types/domain";

const n = (over: Partial<AppNotification>): AppNotification => ({
  id: "n1",
  type: "card_assigned",
  title: "t",
  createdAt: "2026-10-01T00:00:00Z",
  read: false,
  ...over,
});

describe("notificationHref", () => {
  it("opens the card on its board", () => {
    expect(
      notificationHref(
        n({ payload: { organizationId: "o", projectId: "p", boardId: "b", cardId: "c" } }),
      ),
    ).toBe("/orgs/o/projects/p/boards/b?card=c");
  });

  it("goes to the project for a project role change", () => {
    expect(
      notificationHref(
        n({ type: "role_changed", payload: { organizationId: "o", projectId: "p", scope: "project" } }),
      ),
    ).toBe("/orgs/o/projects/p");
  });

  it("goes to the members page when an invite was accepted", () => {
    expect(
      notificationHref(n({ type: "invite_accepted", payload: { organizationId: "o" } })),
    ).toBe("/orgs/o/members");
  });

  it("returns null for older notifications without ids", () => {
    expect(notificationHref(n({ payload: { cardId: "c" } }))).toBeNull();
    expect(notificationHref(n({}))).toBeNull();
  });
});
