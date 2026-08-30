import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCardMutations } from "./cards";
import { qk } from "./queryClient";
import type { CardSummary } from "../types/domain";

// isolate from the network — this test is about optimistic-update timing
vi.mock("../api/cards", () => ({
  moveCard: vi.fn().mockResolvedValue({}),
  createCard: vi.fn().mockResolvedValue({}),
  updateCard: vi.fn().mockResolvedValue({}),
  deleteCard: vi.fn().mockResolvedValue(undefined),
  addSubtask: vi.fn().mockResolvedValue({}),
  updateSubtask: vi.fn().mockResolvedValue({}),
  addComment: vi.fn().mockResolvedValue({}),
  deleteComment: vi.fn().mockResolvedValue(undefined),
}));

const BOARD = "brd-x";
const mk = (id: string, columnId: string, order: number): CardSummary => ({
  id,
  boardId: BOARD,
  columnId,
  order,
  title: id,
  labels: [],
  assignees: [],
  subtaskDone: 0,
  subtaskTotal: 0,
  commentCount: 0,
});

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function layout(qc: QueryClient) {
  const cards = qc.getQueryData<CardSummary[]>(qk.cards(BOARD)) ?? [];
  const out: Record<string, string[]> = {};
  for (const c of [...cards].sort((a, b) => a.order - b.order)) {
    (out[c.columnId] ??= []).push(c.id);
  }
  return out;
}

describe("moveCard — optimistic timing (Issue 2)", () => {
  it("moves the card in the cache synchronously on mutate() — no await", () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    qc.setQueryData<CardSummary[]>(qk.cards(BOARD), [
      mk("a", "todo", 0),
      mk("b", "todo", 1),
      mk("x", "doing", 0),
    ]);

    const { result } = renderHook(() => useCardMutations(BOARD), {
      wrapper: wrapper(qc),
    });

    act(() => {
      result.current.moveCard.mutate({
        cardId: "a",
        columnId: "doing",
        order: 0,
      });
    });

    // read the cache RIGHT NOW — before any microtask / network resolves
    expect(layout(qc)).toEqual({ todo: ["b"], doing: ["a", "x"] });
  });

  it("keeps the optimistic layout after the request resolves (no revert)", async () => {
    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    qc.setQueryData<CardSummary[]>(qk.cards(BOARD), [
      mk("a", "todo", 0),
      mk("b", "todo", 1),
    ]);
    const { result } = renderHook(() => useCardMutations(BOARD), {
      wrapper: wrapper(qc),
    });

    await act(async () => {
      await result.current.moveCard.mutateAsync({
        cardId: "b",
        columnId: "todo",
        order: 0,
      });
    });

    expect(layout(qc)).toEqual({ todo: ["b", "a"] });
  });

  it("rolls back to the previous layout if the request fails", async () => {
    const cardsApi = await import("../api/cards");
    vi.mocked(cardsApi.moveCard).mockRejectedValueOnce(new Error("boom"));

    const qc = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const before = [mk("a", "todo", 0), mk("b", "doing", 0)];
    qc.setQueryData<CardSummary[]>(qk.cards(BOARD), before);
    const { result } = renderHook(() => useCardMutations(BOARD), {
      wrapper: wrapper(qc),
    });

    await act(async () => {
      await result.current.moveCard
        .mutateAsync({ cardId: "a", columnId: "doing", order: 0 })
        .catch(() => {});
    });

    expect(layout(qc)).toEqual({ todo: ["a"], doing: ["b"] });
  });
});
