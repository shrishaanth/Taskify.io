import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Surface } from "./Surface";

describe("Surface", () => {
  it("renders children in a div by default", () => {
    render(<Surface>hello</Surface>);
    expect(screen.getByText("hello").tagName).toBe("DIV");
  });

  it("renders a custom element via `as`", () => {
    render(<Surface as="section">sec</Surface>);
    expect(screen.getByText("sec").tagName).toBe("SECTION");
  });

  it("defaults to md padding", () => {
    render(<Surface>p</Surface>);
    expect(screen.getByText("p")).toHaveAttribute("data-padding", "md");
  });

  it.each(["none", "sm", "md", "lg"] as const)("supports %s padding", (p) => {
    render(<Surface padding={p}>c</Surface>);
    expect(screen.getByText("c")).toHaveAttribute("data-padding", p);
  });

  it("marks itself interactive and forwards clicks", async () => {
    const onClick = vi.fn();
    render(
      <Surface interactive onClick={onClick}>
        card
      </Surface>,
    );
    const el = screen.getByText("card");
    expect(el).toHaveAttribute("data-interactive", "true");
    await userEvent.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("muted wins over interactive", () => {
    render(
      <Surface interactive muted>
        locked
      </Surface>,
    );
    const el = screen.getByText("locked");
    expect(el).toHaveAttribute("data-muted", "true");
    expect(el).toHaveAttribute("data-interactive", "false");
  });

  it("can be elevated", () => {
    render(<Surface elevated>e</Surface>);
    expect(screen.getByText("e")).toHaveAttribute("data-elevated", "true");
  });
});
