import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders its label and defaults to type=button", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveAttribute("data-variant", "primary");
    expect(btn).toHaveAttribute("data-size", "md");
  });

  it.each(["primary", "secondary", "danger"] as const)(
    "renders the %s variant",
    (variant) => {
      render(<Button variant={variant}>b</Button>);
      expect(screen.getByRole("button")).toHaveAttribute("data-variant", variant);
    },
  );

  it.each(["sm", "md"] as const)("renders the %s size", (size) => {
    render(<Button size={size}>b</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-size", size);
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows a spinner, sets aria-busy and blocks clicks while loading", async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
    expect(screen.getByRole("status")).toBeInTheDocument();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders leading and trailing icons (hidden from a11y tree)", () => {
    render(
      <Button
        leadingIcon={<svg data-testid="lead" />}
        trailingIcon={<svg data-testid="trail" />}
      >
        New Project
      </Button>,
    );
    expect(screen.getByTestId("lead")).toBeInTheDocument();
    expect(screen.getByTestId("trail")).toBeInTheDocument();
    expect(screen.getByRole("button")).toHaveAccessibleName("New Project");
  });

  it("hides icons while loading", () => {
    render(
      <Button loading leadingIcon={<svg data-testid="lead" />}>
        x
      </Button>,
    );
    expect(screen.queryByTestId("lead")).not.toBeInTheDocument();
  });

  it("supports fullWidth", () => {
    render(<Button fullWidth>w</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-full-width", "true");
  });

  it("forwards a ref to the button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>r</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("honours an explicit type", () => {
    render(<Button type="submit">s</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
