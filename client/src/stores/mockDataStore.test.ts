import { describe, it, expect, beforeEach } from "vitest";
import { useMockData, resetMockData } from "./mockDataStore";

const get = () => useMockData.getState();

beforeEach(() => resetMockData());

describe("mockDataStore — selectors", () => {
  it("resolves the current user and roles", () => {
    expect(get().currentUser().name).toBe("Alex Rivera");
    expect(get().orgRoleFor("org-acme")).toBe("owner");
    expect(get().projectRoleFor("prj-ecom")).toBe("head");
    expect(get().projectRoleFor("prj-audit")).toBe(null);
  });

  it("synthesises a card detail from a summary when none is stored", () => {
    const d = get().getCardDetail("brd-sprint", "card-1");
    expect(d?.title).toContain("Design system token mapping");
    expect(d?.subtasks).toEqual([]);
  });
});

describe("mockDataStore — mutations", () => {
  it("creates a project with the caller as Head", () => {
    const id = get().createProject("org-acme", { name: "New P" });
    expect(get().projects["org-acme"].some((p) => p.id === id)).toBe(true);
    expect(get().projectRoleFor(id)).toBe("head");
    expect(get().boards[id]).toEqual([]);
  });

  it("creates a board seeded with three columns", () => {
    const id = get().createBoard("prj-tokens", "org-acme", { name: "B", colorKey: "green" });
    expect(get().boardColumns[id]).toHaveLength(3);
  });

  it("adds a card into a column with the next order", () => {
    get().addCard("brd-sprint", "col-doing", "Second doing card");
    const doing = get().cards["brd-sprint"].filter((c) => c.columnId === "col-doing");
    expect(doing.at(-1)?.title).toBe("Second doing card");
    expect(doing.at(-1)?.order).toBe(1);
  });

  it("updates a card across both the summary and the detail", () => {
    get().updateCard("card-2", { priority: "urgent", labels: ["X"] });
    const summary = get().cards["brd-sprint"].find((c) => c.id === "card-2");
    expect(summary?.priority).toBe("urgent");
    expect(summary?.labels).toEqual(["X"]);
    expect(get().cardDetails["card-2"].priority).toBe("urgent");
  });

  it("clears a due date when patched with null", () => {
    get().updateCard("card-1", { dueDate: null });
    expect(get().cards["brd-sprint"].find((c) => c.id === "card-1")?.dueDate).toBeUndefined();
  });

  it("recomputes subtask progress on toggle", () => {
    get().toggleSubtask("card-2", "st-4", true);
    expect(get().cardDetails["card-2"].subtaskDone).toBe(4);
  });

  it("appends comments and bumps the count", () => {
    get().addComment("card-2", "Nice");
    const d = get().cardDetails["card-2"];
    expect(d.comments.at(-1)?.body).toBe("Nice");
    expect(d.commentCount).toBe(d.comments.length);
  });

  it("changes and removes org members", () => {
    get().setOrgMemberRole("org-acme", "u-marcus", "admin");
    expect(get().orgMembers["org-acme"].find((m) => m.user.id === "u-marcus")?.role).toBe("admin");
    get().removeOrgMember("org-acme", "u-marcus");
    expect(get().orgMembers["org-acme"].some((m) => m.user.id === "u-marcus")).toBe(false);
  });

  it("resets cleanly between runs", () => {
    get().createProject("org-acme", { name: "Temp" });
    resetMockData();
    expect(get().projects["org-acme"].some((p) => p.name === "Temp")).toBe(false);
  });
});
