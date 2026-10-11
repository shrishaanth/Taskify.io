import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useRef } from "react";
import { dropTargetAt, useTouchDrag, type TouchDragHandlers } from "./useTouchDrag";

/** Two columns of 40px cards, laid out by hand since jsdom has no layout. */
function Board({ handlers, onOpen }: { handlers: TouchDragHandlers; onOpen: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useTouchDrag(ref, true, handlers);
  return (
    <div ref={ref} data-testid="board">
      <section data-column-id="todo">
        <button data-card-id="a" onClick={onOpen}>
          A
        </button>
        <button data-card-id="b">B</button>
      </section>
      <section data-column-id="done">
        <button data-card-id="c">C</button>
      </section>
    </div>
  );
}

const rects: Record<string, [number, number]> = { a: [0, 0], b: [0, 40], c: [300, 0] };
function layout() {
  for (const el of document.querySelectorAll<HTMLElement>("[data-card-id]")) {
    const [left, top] = rects[el.dataset.cardId as string] as [number, number];
    el.getBoundingClientRect = () =>
      ({
        left,
        top,
        width: 200,
        height: 40,
        right: left + 200,
        bottom: top + 40,
        x: left,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect;
  }
  document.elementFromPoint = (x: number) =>
    document.querySelector(
      x >= 300 ? '[data-column-id="done"]' : '[data-column-id="todo"]',
    );
}
const touch = (x: number, y: number) => ({ touches: [{ clientX: x, clientY: y }] });
const handlers = () => ({
  onStart: vi.fn(),
  onTarget: vi.fn(),
  onDrop: vi.fn(),
  onEnd: vi.fn(),
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  // Lets the short-lived "ignore the click that ends a drag" guard expire, as
  // it would between two real gestures.
  vi.advanceTimersByTime(1000);
  vi.useRealTimers();
});

describe("dropTargetAt", () => {
  it("places before the first card whose middle is below the finger, else at the end", () => {
    render(<Board handlers={handlers()} onOpen={() => {}} />);
    layout();
    expect(dropTargetAt(10, 5, "x")).toEqual({ columnId: "todo", beforeCardId: "a" });
    expect(dropTargetAt(10, 30, "x")).toEqual({ columnId: "todo", beforeCardId: "b" });
    expect(dropTargetAt(10, 200, "x")).toEqual({ columnId: "todo", beforeCardId: null });
    expect(dropTargetAt(350, 100, "x")).toEqual({ columnId: "done", beforeCardId: null });
  });

  it("ignores the dragged card itself", () => {
    render(<Board handlers={handlers()} onOpen={() => {}} />);
    layout();
    expect(dropTargetAt(10, 5, "a")).toEqual({ columnId: "todo", beforeCardId: "b" });
  });
});

describe("useTouchDrag", () => {
  it("picks a card up after a hold and drops it where the finger is", () => {
    const h = handlers();
    render(<Board handlers={h} onOpen={() => {}} />);
    layout();
    const a = screen.getByText("A");

    fireEvent.touchStart(a, touch(10, 10));
    expect(h.onStart).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(h.onStart).toHaveBeenCalledWith("a");

    fireEvent.touchMove(document, touch(350, 10));
    expect(h.onTarget).toHaveBeenLastCalledWith({ columnId: "done", beforeCardId: "c" });

    fireEvent.touchEnd(document, { touches: [] });
    expect(h.onDrop).toHaveBeenCalledWith("a", { columnId: "done", beforeCardId: "c" });
    expect(h.onEnd).toHaveBeenCalledTimes(1);
    // The floating copy is gone.
    expect(document.body.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it("treats movement during the hold as a scroll, not a drag", () => {
    const h = handlers();
    render(<Board handlers={h} onOpen={() => {}} />);
    layout();

    fireEvent.touchStart(screen.getByText("A"), touch(10, 10));
    fireEvent.touchMove(document, touch(10, 60));
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(h.onStart).not.toHaveBeenCalled();
    expect(h.onDrop).not.toHaveBeenCalled();
  });

  it("leaves a quick tap alone so it still opens the card", () => {
    const h = handlers();
    const onOpen = vi.fn();
    render(<Board handlers={h} onOpen={onOpen} />);
    layout();
    const a = screen.getByText("A");

    fireEvent.touchStart(a, touch(10, 10));
    fireEvent.touchEnd(document, { touches: [] });
    fireEvent.click(a);

    expect(h.onStart).not.toHaveBeenCalled();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not open the card when a drag ends on top of it", () => {
    const h = handlers();
    const onOpen = vi.fn();
    render(<Board handlers={h} onOpen={onOpen} />);
    layout();
    const a = screen.getByText("A");

    fireEvent.touchStart(a, touch(10, 10));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.touchEnd(document, { touches: [] });
    fireEvent.click(a);

    expect(onOpen).not.toHaveBeenCalled();
  });
});
