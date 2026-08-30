import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Chip, AddChip } from "./Chip";

describe("Chip", () => {
  it("renders children with default slate tone + md size", () => {
    render(<Chip>Design</Chip>);
    const el = screen.getByText("Design");
    expect(el).toHaveAttribute("data-tone", "slate");
    expect(el).toHaveAttribute("data-size", "md");
  });

  it.each(["sky", "red", "amber", "green", "violet", "purple", "pink"] as const)(
    "supports the %s tone",
    (tone) => {
      render(<Chip tone={tone}>{tone}</Chip>);
      expect(screen.getByText(tone)).toHaveAttribute("data-tone", tone);
    },
  );

  it("has no remove control unless removable", () => {
    render(<Chip>Bug</Chip>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a remove control and fires onRemove", async () => {
    const onRemove = vi.fn();
    render(
      <Chip removable onRemove={onRemove}>
        Marketing
      </Chip>,
    );
    const remove = screen.getByRole("button", { name: "Remove Marketing" });
    await userEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("accepts an explicit removeLabel for non-text children", () => {
    render(
      <Chip removable removeLabel="Remove priority label">
        <span>High</span>
      </Chip>,
    );
    expect(
      screen.getByRole("button", { name: "Remove priority label" }),
    ).toBeInTheDocument();
  });
});

describe("AddChip", () => {
  it("renders a + affordance and fires onClick", async () => {
    const onClick = vi.fn();
    render(<AddChip label="Add label" onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /add label/i });
    expect(btn).toHaveTextContent("+");
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("works icon-only", () => {
    render(<AddChip aria-label="Add" />);
    expect(screen.getByRole("button", { name: "Add" })).toHaveTextContent("+");
  });
});
