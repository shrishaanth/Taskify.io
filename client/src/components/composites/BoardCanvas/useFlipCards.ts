import { useLayoutEffect, useRef, type RefObject } from "react";

const DURATION_MS = 180;
/** Matches the `--ease-out` design token (cubic-bezier(0, 0, 0.2, 1)). */
const EASE_OUT = "cubic-bezier(0, 0, 0.2, 1)";

/**
 * FLIP animation for the Kanban cards inside `rootRef`, done in ONE synchronous
 * pass per layout change (`signature`) — no `requestAnimationFrame`, so a
 * backgrounded / non-compositing tab can never leave a card frozen mid-move:
 *
 *  1. clear any inline styles a previous pass left, so measurements reflect the
 *     true resting layout;
 *  2. READ every `[data-card-id]` rect in one batch;
 *  3. INVERT — for every card that moved, snap it back to its old spot with
 *     `transition: none` (batched write);
 *  4. force ONE reflow so the inverted transforms are committed;
 *  5. PLAY — immediately release every moved card together over ~180ms
 *     ease-out, so they slide (down/up within a column, or across columns)
 *     into place instead of snapping.
 *
 * Because deltas are measured from the real DOM, an optimistic move followed by
 * a matching server / socket confirmation is a zero delta on the next pass →
 * the card animates exactly once.
 */
export function useFlipCards(
  rootRef: RefObject<HTMLElement | null>,
  signature: string,
): void {
  const prev = useRef(new Map<string, { left: number; top: number }>());
  // elements carrying inline FLIP styles right now → id + timer for cleanup
  const active = useRef(new Map<HTMLElement, number>());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. clean slate
    for (const [el, timer] of active.current) {
      clearTimeout(timer);
      el.style.transition = "";
      el.style.transform = "";
    }
    active.current.clear();

    const els = Array.from(
      root.querySelectorAll<HTMLElement>("[data-card-id]"),
    );

    // 2. READ
    const nextPos = new Map<string, { left: number; top: number }>();
    const rectOf = new Map<HTMLElement, DOMRect>();
    for (const el of els) {
      const r = el.getBoundingClientRect();
      rectOf.set(el, r);
      if (el.dataset.cardId) {
        nextPos.set(el.dataset.cardId, { left: r.left, top: r.top });
      }
    }

    if (!reduce) {
      // 3. INVERT (batched write)
      const moved: HTMLElement[] = [];
      for (const el of els) {
        const id = el.dataset.cardId;
        if (!id || el.dataset.dragging === "true") continue;
        const was = prev.current.get(id);
        const now = rectOf.get(el);
        if (!was || !now) continue;
        const dx = was.left - now.left;
        const dy = was.top - now.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        el.style.transition = "none";
        el.style.transform = `translate(${dx}px, ${dy}px)`;
        moved.push(el);
      }

      if (moved.length > 0) {
        // 4. commit the inverted transforms in one reflow
        void root.offsetWidth;

        // 5. PLAY — same tick, no rAF
        for (const el of moved) {
          el.style.transition = `transform ${DURATION_MS}ms ${EASE_OUT}`;
          el.style.transform = "translate(0px, 0px)";

          const finish = () => {
            const timer = active.current.get(el);
            if (timer !== undefined) clearTimeout(timer);
            active.current.delete(el);
            el.style.transition = "";
            el.style.transform = "";
            el.removeEventListener("transitionend", onEnd);
          };
          const onEnd = (ev: TransitionEvent) => {
            if (ev.propertyName && ev.propertyName !== "transform") return;
            finish();
          };
          el.addEventListener("transitionend", onEnd);
          // fallback in case transitionend never fires (interrupted / offscreen)
          const timer = window.setTimeout(finish, DURATION_MS + 80);
          active.current.set(el, timer);
        }
      }
    }

    // 6. remember positions; cards that left the board drop out of the map.
    prev.current = nextPos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  // on unmount, clear any outstanding fallback timers + inline styles
  useLayoutEffect(
    () => () => {
      for (const [el, timer] of active.current) {
        clearTimeout(timer);
        el.style.transition = "";
        el.style.transform = "";
      }
      active.current.clear();
    },
    [],
  );
}
