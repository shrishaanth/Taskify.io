import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTile } from "./AddTile";

describe("AddTile", () => {
  it("renders the label and a + affordance", () => {
    render(<AddTile label="New Board" onClick={() => {}} />);
    const btn = screen.getByRole("button", { name: /new board/i });
    expect(btn).toHaveTextContent("+");
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    render(<AddTile label="Add column" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
