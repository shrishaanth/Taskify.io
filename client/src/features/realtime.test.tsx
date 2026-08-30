import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAppRealtime, useBoardRealtime } from "./realtime";

/** Minimal fake socket.io client — just the on/off/emit surface we use. */
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
  /** simulate the server pushing an event */
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

  it.each(["card:created", "card:updated", "card:moved", "card:deleted"])(
    "refetches the board's cards on %s",
    (event) => {
      const qc = new QueryClient();
      const spy = vi.spyOn(qc, "invalidateQueries");
      renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

      fake.server(event, { id: "c1" });

      expect(spy).toHaveBeenCalledWith({ queryKey: ["cards", "b1"] });
      expect(spy).toHaveBeenCalledWith({ queryKey: ["card", "b1"] });
    },
  );

  it("refetches only the affected card's detail on comment:new", () => {
    const qc = new QueryClient();
    const spy = vi.spyOn(qc, "invalidateQueries");
    renderHook(() => useBoardRealtime("p1", "b1"), { wrapper: wrapper(qc) });

    fake.server("comment:new", { cardId: "card-9", comment: { id: "cm1" } });

    expect(spy).toHaveBeenCalledWith({ queryKey: ["card", "b1", "card-9"] });
  });
});
