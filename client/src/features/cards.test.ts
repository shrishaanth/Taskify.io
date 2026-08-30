import { describe, it, expect } from "vitest";
import { applyCardMove } from "./cards";
import type { CardSummary } from "../types/domain";

const card = (id: string, columnId: string, order: number): CardSummary => ({
  id,
  boardId: "b1",
  columnId,
  order,
  title: id,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
});

/** group -> ordered ids, for terse assertions */
function layout(cards: CardSummary[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of [...cards].sort((a, b) => a.order - b.order)) {
    (out[c.columnId] ??= []).push(c.id);
  }
  return out;
}

describe("applyCardMove (optimistic drag-and-drop)", () => {
  const base = [
    card("a", "todo", 0),
    card("b", "todo", 1),
    card("c", "todo", 2),
    card("x", "doing", 0),
  ];

  it("reorders within a column", () => {
    const next = applyCardMove(base, "c", "todo", 0);
    expect(layout(next)).toEqual({ todo: ["c", "a", "b"], doing: ["x"] });
    expect(next.find((c) => c.id === "c")!.order).toBe(0);
  });

  it("moves a card to another column at the given index", () => {
    const next = applyCardMove(base, "a", "doing", 0);
    expect(layout(next)).toEqual({ todo: ["b", "c"], doing: ["a", "x"] });
    // source column renumbered from 0
    expect(next.find((c) => c.id === "b")!.order).toBe(0);
    expect(next.find((c) => c.id === "c")!.order).toBe(1);
  });

  it("appends when order is past the end", () => {
    const next = applyCardMove(base, "a", "doing", 99);
    expect(layout(next)).toEqual({ todo: ["b", "c"], doing: ["x", "a"] });
  });

  it("is a no-op when the card id is unknown", () => {
    expect(applyCardMove(base, "nope", "doing", 0)).toBe(base);
  });

  it("landing in the same spot yields an equivalent layout (no double move)", () => {
    const moved = applyCardMove(base, "a", "doing", 0);
    const again = applyCardMove(moved, "a", "doing", 0);
    expect(layout(again)).toEqual(layout(moved));
  });
});
