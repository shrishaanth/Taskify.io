import { useLayoutEffect, useRef, type RefObject } from "react";

const DURATION_MS = 180;
const EASE_OUT = "cubic-bezier(0, 0, 0.2, 1)";

export function useFlipCards(
  rootRef: RefObject<HTMLElement | null>,
  signature: string,
): void {
  const prev = useRef(new Map<string, { left: number; top: number }>());
  const active = useRef(new Map<HTMLElement, number>());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const [el, timer] of active.current) {
      clearTimeout(timer);
      el.style.transition = "";
      el.style.transform = "";
    }
    active.current.clear();

    const els = Array.from(
      root.querySelectorAll<HTMLElement>("[data-card-id]"),
    );

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
        void root.offsetWidth;

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
          const timer = window.setTimeout(finish, DURATION_MS + 80);
          active.current.set(el, timer);
        }
      }
    }

    prev.current = nextPos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

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
