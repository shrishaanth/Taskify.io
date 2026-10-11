import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCardMutations } from "./cards";
import { qk } from "./queryClient";
import type { CardDetail, CardSummary } from "../types/domain";

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

describe("card dialog edits are optimistic", () => {
  const detailKey = qk.card(BOARD, "a");
  const seed = () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    qc.setQueryData<CardSummary[]>(qk.cards(BOARD), [
      { ...mk("a", "todo", 0), subtaskTotal: 1 },
    ]);
    qc.setQueryData<CardDetail>(detailKey, {
      ...mk("a", "todo", 0),
      subtaskTotal: 1,
      subtasks: [{ id: "s1", title: "First", done: false }],
      comments: [],
    });
    return qc;
  };
  const detail = (qc: QueryClient) => qc.getQueryData<CardDetail>(detailKey)!;
  const summary = (qc: QueryClient) =>
    qc.getQueryData<CardSummary[]>(qk.cards(BOARD))![0]!;

  it("ticks a subtask in the same tick as the click", () => {
    const qc = seed();
    const { result } = renderHook(() => useCardMutations(BOARD), { wrapper: wrapper(qc) });

    act(() => {
      result.current.toggleSubtask.mutate({ cardId: "a", subtaskId: "s1", done: true });
    });

    expect(detail(qc).subtasks[0]?.done).toBe(true);
    expect(summary(qc).subtaskDone).toBe(1);
  });

  it("shows a new priority, title and due date immediately", () => {
    const qc = seed();
    const { result } = renderHook(() => useCardMutations(BOARD), { wrapper: wrapper(qc) });

    act(() => {
      result.current.updateCard.mutate({
        cardId: "a",
        patch: { priority: "urgent", title: "Renamed", dueDate: "2026-12-01T00:00:00.000Z" },
      });
    });

    expect(detail(qc)).toMatchObject({ priority: "urgent", title: "Renamed" });
    expect(summary(qc)).toMatchObject({
      priority: "urgent",
      title: "Renamed",
      dueDate: "2026-12-01T00:00:00.000Z",
    });
  });

  it("resolves assignee ids to people from the project members", () => {
    const qc = seed();
    const members = [{ id: "u1", name: "Sarah Jones" }];
    const { result } = renderHook(() => useCardMutations(BOARD, { members }), {
      wrapper: wrapper(qc),
    });

    act(() => {
      result.current.updateCard.mutate({ cardId: "a", patch: { assigneeIds: ["u1"] } });
    });

    expect(detail(qc).assignees).toEqual([{ id: "u1", name: "Sarah Jones" }]);
  });

  it("appends a subtask and a comment before the server answers", () => {
    const qc = seed();
    const currentUser = { id: "me", name: "Me" };
    const { result } = renderHook(() => useCardMutations(BOARD, { currentUser }), {
      wrapper: wrapper(qc),
    });

    act(() => {
      result.current.addSubtask.mutate({ cardId: "a", title: "Second" });
      result.current.addComment.mutate({ cardId: "a", body: "Looks good" });
    });

    expect(detail(qc).subtasks.map((s) => s.title)).toEqual(["First", "Second"]);
    expect(detail(qc).comments[0]).toMatchObject({ body: "Looks good", author: currentUser });
    expect(summary(qc)).toMatchObject({ subtaskTotal: 2, commentCount: 1 });
  });

  it("puts everything back when the server refuses", async () => {
    const qc = seed();
    const api = await import("../api/cards");
    vi.mocked(api.updateSubtask).mockRejectedValueOnce(new Error("nope"));
    const { result } = renderHook(() => useCardMutations(BOARD), { wrapper: wrapper(qc) });

    await act(async () => {
      await result.current.toggleSubtask
        .mutateAsync({ cardId: "a", subtaskId: "s1", done: true })
        .catch(() => {});
    });

    expect(detail(qc).subtasks[0]?.done).toBe(false);
    expect(summary(qc).subtaskDone).toBe(0);
  });
});
