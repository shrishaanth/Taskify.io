import { useEffect, useRef, type RefObject } from "react";

export interface TouchDropTarget {
  columnId: string;
  /** Card the dragged one would be placed before; null means the end. */
  beforeCardId: string | null;
}

export interface TouchDragHandlers {
  onStart: (cardId: string) => void;
  onTarget: (target: TouchDropTarget | null) => void;
  onDrop: (cardId: string, target: TouchDropTarget) => void;
  onEnd: () => void;
}

/** Long enough to tell a drag from a tap or the start of a scroll. */
const HOLD_MS = 280;
/** Finger travel during the hold that means "this is a scroll, not a drag". */
const SLOP_PX = 10;
const EDGE_PX = 56;
const SCROLL_STEP = 14;

/** Finds where a card released at this point would go, from the DOM alone. */
export function dropTargetAt(
  x: number,
  y: number,
  draggedId: string,
  doc: Document = document,
): TouchDropTarget | null {
  const under = doc.elementFromPoint(x, y);
  const column = under?.closest<HTMLElement>("[data-column-id]");
  const columnId = column?.dataset.columnId;
  if (!column || !columnId) return null;

  const cards = Array.from(
    column.querySelectorAll<HTMLElement>("[data-card-id]"),
  ).filter((el) => el.dataset.cardId !== draggedId);

  for (const el of cards) {
    const r = el.getBoundingClientRect();
    if (y < r.top + r.height / 2) {
      return { columnId, beforeCardId: el.dataset.cardId ?? null };
    }
  }
  return { columnId, beforeCardId: null };
}

/**
 * Drag and drop for touch screens: press and hold a card, then move it.
 *
 * HTML5 drag events are unreliable on touch (absent on some browsers, behind
 * a long system gesture on others), so this drives the same board state from
 * touch events instead. A quick tap still opens the card and a swipe still
 * scrolls; only a hold picks a card up.
 */
export function useTouchDrag(
  rootRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  handlers: TouchDragHandlers,
): void {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return;

    let holdTimer = 0;
    let frame = 0;
    let cardId: string | null = null;
    let cardEl: HTMLElement | null = null;
    let ghost: HTMLElement | null = null;
    let dragging = false;
    let start = { x: 0, y: 0 };
    let point = { x: 0, y: 0 };
    let grab = { x: 0, y: 0 };
    let target: TouchDropTarget | null = null;

    const sameTarget = (a: TouchDropTarget | null, b: TouchDropTarget | null) =>
      a?.columnId === b?.columnId && a?.beforeCardId === b?.beforeCardId;

    const retarget = () => {
      if (!cardId) return;
      const next = dropTargetAt(point.x, point.y, cardId);
      if (sameTarget(next, target)) return;
      target = next;
      latest.current.onTarget(next);
    };

    const placeGhost = () => {
      if (!ghost) return;
      ghost.style.transform = `translate(${point.x - grab.x}px, ${point.y - grab.y}px) rotate(2deg)`;
    };

    /** Scrolls the board sideways, or a column up and down, near an edge. */
    const autoScroll = () => {
      if (!dragging) return;
      const box = root.getBoundingClientRect();
      if (point.x < box.left + EDGE_PX) root.scrollLeft -= SCROLL_STEP;
      else if (point.x > box.right - EDGE_PX) root.scrollLeft += SCROLL_STEP;

      const list = document
        .elementFromPoint(point.x, point.y)
        ?.closest("[data-column-id]")
        ?.querySelector<HTMLElement>('[data-testid="kanban-column-list"]');
      if (list) {
        const r = list.getBoundingClientRect();
        if (point.y < r.top + EDGE_PX) list.scrollTop -= SCROLL_STEP;
        else if (point.y > r.bottom - EDGE_PX) list.scrollTop += SCROLL_STEP;
      }
      retarget();
      frame = requestAnimationFrame(autoScroll);
    };

    const begin = () => {
      if (!cardEl || !cardId) return;
      dragging = true;
      const rect = cardEl.getBoundingClientRect();
      grab = { x: start.x - rect.left, y: start.y - rect.top };

      ghost = cardEl.cloneNode(true) as HTMLElement;
      ghost.removeAttribute("data-card-id");
      ghost.setAttribute("aria-hidden", "true");
      Object.assign(ghost.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${rect.width}px`,
        margin: "0",
        zIndex: "2000",
        pointerEvents: "none",
        opacity: "0.95",
        boxShadow: "var(--shadow-dragging)",
        transition: "none",
        willChange: "transform",
      });
      document.body.appendChild(ghost);
      placeGhost();

      navigator.vibrate?.(8);
      latest.current.onStart(cardId);
      retarget();
      frame = requestAnimationFrame(autoScroll);
    };

    const swallowNextClick = () => {
      const stop = (e: Event) => {
        e.stopPropagation();
        e.preventDefault();
      };
      document.addEventListener("click", stop, { capture: true, once: true });
      window.setTimeout(
        () => document.removeEventListener("click", stop, { capture: true }),
        400,
      );
    };

    const finish = (drop: boolean) => {
      window.clearTimeout(holdTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);

      if (dragging) {
        ghost?.remove();
        // The finger lifting over the card must not also count as a tap on it.
        swallowNextClick();
        if (drop && target && cardId) latest.current.onDrop(cardId, target);
        latest.current.onEnd();
      }
      dragging = false;
      ghost = null;
      cardId = null;
      cardEl = null;
      target = null;
    };

    function onMove(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      point = { x: t.clientX, y: t.clientY };
      if (!dragging) {
        // Moved before the hold completed: the user is scrolling.
        if (Math.hypot(point.x - start.x, point.y - start.y) > SLOP_PX) finish(false);
        return;
      }
      e.preventDefault();
      placeGhost();
      retarget();
    }
    function onEnd(e: TouchEvent) {
      if (dragging) e.preventDefault();
      finish(true);
    }
    function onCancel() {
      finish(false);
    }

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1 || cardId) return;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-card-id]");
      const id = el?.dataset.cardId;
      const t = e.touches[0];
      if (!el || !id || !t) return;

      cardEl = el;
      cardId = id;
      start = point = { x: t.clientX, y: t.clientY };
      holdTimer = window.setTimeout(begin, HOLD_MS);
      // Non-passive so the page can be held still once the card is picked up.
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd, { passive: false });
      document.addEventListener("touchcancel", onCancel);
    };

    // Where the browser also offers its own long-press drag or menu, this
    // gesture has already claimed the card.
    const blockNative = (e: Event) => {
      if (cardId) e.preventDefault();
    };

    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("dragstart", blockNative, true);
    root.addEventListener("contextmenu", blockNative);

    return () => {
      finish(false);
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("dragstart", blockNative, true);
      root.removeEventListener("contextmenu", blockNative);
    };
  }, [rootRef, enabled]);
}
