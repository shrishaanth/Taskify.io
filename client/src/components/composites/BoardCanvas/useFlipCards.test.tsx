import { describe, it, expect, afterEach, vi } from "vitest";
import { useRef } from "react";
import { render } from "@testing-library/react";
import { useFlipCards } from "./useFlipCards";

afterEach(() => vi.unstubAllGlobals());

type Pos = Record<string, { left: number; top: number }>;

function Harness({ ids, pos }: { ids: string[]; pos: Pos }) {
  const ref = useRef<HTMLDivElement>(null);
  useFlipCards(ref, ids.join(",") + "@" + JSON.stringify(pos));
  return (
    <div ref={ref}>
      {ids.map((id) => (
        <div
          key={id}
          data-card-id={id}
          ref={(el) => {
            if (el) {
              el.getBoundingClientRect = () =>
                ({
                  left: pos[id].left,
                  top: pos[id].top,
                  width: 160,
                  height: 48,
                  right: pos[id].left + 160,
                  bottom: pos[id].top + 48,
                  x: pos[id].left,
                  y: pos[id].top,
                  toJSON() {},
                }) as DOMRect;
            }
          }}
        />
      ))}
    </div>
  );
}

const cards = (c: HTMLElement) =>
  [...c.querySelectorAll<HTMLElement>("[data-card-id]")];

describe("useFlipCards", () => {
  it("does not animate on first render", () => {
    const pos: Pos = { a: { left: 0, top: 0 }, b: { left: 0, top: 50 } };
    const { container } = render(<Harness ids={["a", "b"]} pos={pos} />);
    for (const el of cards(container)) expect(el.style.transform).toBe("");
  });

  it("animates EVERY moved card in one synchronous pass (Issue 1 regression)", () => {
    // a jumps columns (big −dx); b and c get pushed down (−dy)
    const p1: Pos = {
      a: { left: 0, top: 0 },
      b: { left: 300, top: 0 },
      c: { left: 300, top: 50 },
    };
    const { rerender, container } = render(
      <Harness ids={["a", "b", "c"]} pos={p1} />,
    );

    rerender(
      <Harness
        ids={["a", "b", "c"]}
        pos={{
          a: { left: 300, top: 0 },
          b: { left: 300, top: 100 },
          c: { left: 300, top: 150 },
        }}
      />,
    );

    // right after the layout change: ALL three are in the "play" state —
    // released to their new spot with a transform transition. None frozen at a
    // non-zero translate, none left with `transition: none`.
    for (const el of cards(container)) {
      expect(el.style.transform).toBe("translate(0px, 0px)");
      expect(el.style.transition).toMatch(/^transform 180ms /);
    }
  });

  it("clears its inline styles when the transition ends", () => {
    const { rerender, container } = render(
      <Harness ids={["a"]} pos={{ a: { left: 0, top: 0 } }} />,
    );
    rerender(<Harness ids={["a"]} pos={{ a: { left: 200, top: 40 } }} />);
    const el = cards(container)[0];
    expect(el.style.transition).not.toBe("");

    el.dispatchEvent(new Event("transitionend"));
    expect(el.style.transform).toBe("");
    expect(el.style.transition).toBe("");
  });

  it("skips the card currently being dragged", () => {
    const { rerender, container } = render(
      <Harness ids={["a"]} pos={{ a: { left: 0, top: 0 } }} />,
    );
    cards(container)[0].dataset.dragging = "true";
    rerender(<Harness ids={["a"]} pos={{ a: { left: 200, top: 0 } }} />);
    expect(cards(container)[0].style.transform).toBe("");
  });

  it("respects prefers-reduced-motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { rerender, container } = render(
      <Harness ids={["a"]} pos={{ a: { left: 0, top: 0 } }} />,
    );
    rerender(<Harness ids={["a"]} pos={{ a: { left: 200, top: 80 } }} />);
    expect(cards(container)[0].style.transform).toBe("");
  });
});
