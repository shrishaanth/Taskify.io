import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppRealtime, useBoardRealtime } from "./realtime";

class FakeSocket {
  private handlers = new Map<string, Set<(p: unknown) => void>>();
  emitted: { event: string; payload: unknown }[] = [];
  on(event: string, cb: (p: unknown) => void) {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(cb);
  }
  off(event: string, cb: (p: unknown) => void) {
    this.handlers.get(event)?.delete(cb);
  }
  emit(event: string, payload?: unknown) {
    this.emitted.push({ event, payload });
  }
  server(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((cb) => cb(payload));
  }
}

const state = vi.hoisted(() => ({ socket: null as unknown }));
vi.mock("../api/socket", () => ({ getSocket: () => state.socket }));

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

let fake: FakeSocket;
beforeEach(() => {
  fake = new FakeSocket();
  state.socket = fake;
});

describe("useAppRealtime", () => {
  it("invalidates the notifications query on notification:new", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useAppRealtime(), { wrapper: wrapper(qc) });

    fake.server("notification:new", { id: "n1" });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["notifications"] });
  });

  it.each(["board:created", "board:updated", "board:deleted"])(
    "refetches the boards list on %s",
    (event) => {
      const qc = new QueryClient();
      const spy = vi.spyOn(qc, "invalidateQueries");
      renderHook(() => useAppRealtime(), { wrapper: wrapper(qc) });

      fake.server(event, { id: "b1", projectId: "p1" });

      expect(spy).toHaveBeenCalledWith({ queryKey: ["boards"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["board"] });
    },
  );

  it.each(["project:memberChanged", "project:memberRemoved"])(
    "refetches project members on %s",
    (event) => {
      const qc = new QueryClient();
      const spy = vi.spyOn(qc, "invalidateQueries");
      renderHook(() => useAppRealtime(), { wrapper: wrapper(qc) });

      fake.server(event, { userId: "u1", role: "member" });

      expect(spy).toHaveBeenCalledWith({ queryKey: ["project"] });
    },
  );

  it("refetches org members on org:memberChanged", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useAppRealtime(), { wrapper: wrapper(qc) });

    fake.server("org:memberChanged", { userId: "u1", role: "admin" });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["orgs"] });
  });

  it("removes its listeners on unmount", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    const { unmount } = renderHook(() => useAppRealtime(), {
      wrapper: wrapper(qc),
    });
    unmount();
    spy.mockClear();
    fake.server("board:created", { id: "b1" });
    fake.server("org:memberChanged", { userId: "u1", role: "admin" });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("useBoardRealtime", () => {
  it("subscribes to the board room on mount and unsubscribes on unmount", () => {
    const qc = new QueryClient();
    const { unmount } = renderHook(() => useBoardRealtime("p1", "b1"), {
      wrapper: wrapper(qc),
    });
    expect(fake.emitted).toContainEqual({ event: "subscribe:board", payload: "b1" });
    unmount();
    expect(fake.emitted).toContainEqual({
      event: "unsubscribe:board",
      payload: "b1",
    });
  });

  const rawCard = (over: Record<string, unknown> = {}) => ({
    id: "c1",
    boardId: "b1",
    columnId: "col-1",
    order: 0,
    title: "Ship it",
    labels: [],
    assigneeIds: [],
    assignees: [],
    subtaskDone: 0,
    subtaskTotal: 0,
    commentCount: 0,
    ...over,
  });

  const seed = (qc: QueryClient, cards: unknown[]) =>
    qc.setQueryData(["cards", "b1"], cards);

  it("adds a new card to the cached list without refetching on card:created", () => {
    const qc = new QueryClient();
    seed(qc, []);
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("card:created", rawCard());

    expect(qc.getQueryData(["cards", "b1"])).toEqual([
      expect.objectContaining({ id: "c1", title: "Ship it" }),
    ]);
    expect(spy).not.toHaveBeenCalledWith({ queryKey: ["cards", "b1"] });
  });

  it("replaces the cached card in place on card:updated", () => {
    const qc = new QueryClient();
    seed(qc, [{ id: "c1", title: "Old", columnId: "col-1", order: 0 }]);
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("card:updated", rawCard({ title: "New" }));

    const cards = qc.getQueryData(["cards", "b1"]) as { title: string }[];
    expect(cards).toHaveLength(1);
    expect(cards[0]?.title).toBe("New");
  });

  it("applies the new column and order on card:moved", () => {
    const qc = new QueryClient();
    seed(qc, [{ id: "c1", title: "A", columnId: "col-1", order: 0 }]);
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("card:moved", { id: "c1", columnId: "col-2", order: 3 });

    expect(qc.getQueryData(["cards", "b1"])).toEqual([
      expect.objectContaining({ id: "c1", columnId: "col-2", order: 3 }),
    ]);
  });

  it("drops the card from the cache on card:deleted", () => {
    const qc = new QueryClient();
    seed(qc, [
      { id: "c1", title: "A", columnId: "col-1", order: 0 },
      { id: "c2", title: "B", columnId: "col-1", order: 1 },
    ]);
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("card:deleted", { id: "c1" });

    expect(qc.getQueryData(["cards", "b1"])).toEqual([
      expect.objectContaining({ id: "c2" }),
    ]);
  });

  it("falls back to a refetch when a payload cannot be applied", () => {
    const qc = new QueryClient();
    seed(qc, []);
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("card:moved", { id: "c1" }); // no columnId/order

    expect(spy).toHaveBeenCalledWith({ queryKey: ["cards", "b1"] });
  });

  it("refetches only the affected card's detail on comment:new", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("comment:new", { cardId: "card-9", comment: { id: "cm1" } });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["card", "b1", "card-9"] });
  });
});
