import { createRef, useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("renders a textbox with placeholder and default md size", () => {
    render(<Input placeholder="you@example.com" />);
    const field = screen.getByPlaceholderText("you@example.com");
    expect(field.tagName).toBe("INPUT");
    expect(field.parentElement).toHaveAttribute("data-size", "md");
  });

  it("calls onChange as the user types", async () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} aria-label="name" />);
    await userEvent.type(screen.getByRole("textbox"), "abc");
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("works as a controlled field", async () => {
    function Wrapper() {
      const [v, setV] = useState("");
      return (
        <Input aria-label="ctl" value={v} onChange={(e) => setV(e.target.value)} />
      );
    }
    render(<Wrapper />);
    const field = screen.getByRole("textbox");
    await userEvent.type(field, "hello");
    expect(field).toHaveValue("hello");
  });

  it("renders a leading icon and a trailing slot", () => {
    render(
      <Input
        aria-label="pw"
        leadingIcon={<svg data-testid="mail" />}
        trailingSlot={<button type="button">show</button>}
      />,
    );
    expect(screen.getByTestId("mail")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "show" })).toBeInTheDocument();
  });

  it("reflects the invalid state", () => {
    render(<Input aria-label="x" invalid />);
    const field = screen.getByRole("textbox");
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(field.parentElement).toHaveAttribute("data-invalid", "true");
  });

  it("can be disabled", async () => {
    const onChange = vi.fn();
    render(<Input aria-label="x" disabled onChange={onChange} />);
    const field = screen.getByRole("textbox");
    expect(field).toBeDisabled();
    await userEvent.type(field, "x");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("forwards a ref and native attributes to the input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} name="email" id="email" aria-label="e" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toHaveAttribute("name", "email");
    expect(ref.current).toHaveAttribute("id", "email");
  });
});
