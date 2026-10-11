import { describe, it, expect } from "vitest";
import { NO_FILTERS, applyCardFilters, isFiltering, toggle } from "./cardFilters";
import type { CardSummary } from "../types/domain";

const now = new Date(2026, 9, 18, 10, 0, 0);
const card = (id: string, over: Partial<CardSummary> = {}): CardSummary => ({
  id,
  boardId: "b",
  columnId: "c",
  order: 0,
  title: `Card ${id}`,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
  ...over,
});
const ann = { id: "ann", name: "Ann" };
const bo = { id: "bo", name: "Bo" };

const cards = [
  card("1", {
    title: "Fix checkout",
    priority: "urgent",
    assignees: [ann],
    labels: ["Bug"],
    dueDate: "2026-10-15T00:00:00.000Z",
  }),
  card("2", {
    title: "Homepage hero",
    priority: "high",
    assignees: [bo],
    labels: ["Design"],
    dueDate: "2026-10-19T00:00:00.000Z",
  }),
  card("3", {
    title: "Write docs",
    priority: "low",
    assignees: [ann, bo],
    dueDate: "2026-10-24T00:00:00.000Z",
  }),
  card("4", { title: "Tidy backlog" }),
];
const ids = (f: Partial<typeof NO_FILTERS>) =>
  applyCardFilters(cards, { ...NO_FILTERS, ...f }, now).map((c) => c.id);

describe("applyCardFilters", () => {
  it("returns everything when nothing is set", () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
    expect(applyCardFilters(cards, NO_FILTERS, now)).toBe(cards);
  });

  it("searches titles and labels, ignoring case", () => {
    expect(ids({ query: "CHECK" })).toEqual(["1"]);
    expect(ids({ query: "design" })).toEqual(["2"]);
    expect(ids({ query: "   " })).toEqual(["1", "2", "3", "4"]);
  });

  it("widens within one kind of filter", () => {
    expect(ids({ assigneeIds: ["ann"] })).toEqual(["1", "3"]);
    expect(ids({ priorities: ["high", "urgent"] })).toEqual(["1", "2"]);
    expect(ids({ labels: ["Bug", "Design"] })).toEqual(["1", "2"]);
  });

  it("narrows across different kinds", () => {
    expect(ids({ assigneeIds: ["ann"], priorities: ["low"] })).toEqual(["3"]);
    expect(ids({ assigneeIds: ["bo"], query: "checkout" })).toEqual([]);
  });

  it("filters by due date", () => {
    expect(ids({ due: "overdue" })).toEqual(["1"]);
    expect(ids({ due: "soon" })).toEqual(["2"]);
    expect(ids({ due: "week" })).toEqual(["2", "3"]);
    expect(ids({ due: "none" })).toEqual(["4"]);
  });
});

describe("toggle", () => {
  it("adds a missing value and removes a present one", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});
