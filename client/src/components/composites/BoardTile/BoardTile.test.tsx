import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BoardTile } from "./BoardTile";
import type { BoardSummary } from "../../../types/domain";

const board: BoardSummary = {
  id: "b1",
  projectId: "p1",
  name: "Sprint Backlog",
  cardCount: 12,
  colorKey: "green",
};

describe("BoardTile", () => {
  it("shows name, card count and colour", () => {
    render(<BoardTile board={board} onOpen={() => {}} />);
    const tile = screen.getByRole("button", { name: /sprint backlog/i });
    expect(tile).toHaveAttribute("data-color", "green");
    expect(tile).toHaveTextContent("12 cards");
  });

  it("singularises a single card and defaults colour to sky", () => {
    const noColor: BoardSummary = {
      id: "b2",
      projectId: "p1",
      name: "Launch Prep",
      cardCount: 1,
    };
    render(<BoardTile board={noColor} onOpen={() => {}} />);
    const tile = screen.getByRole("button");
    expect(tile).toHaveTextContent("1 card");
    expect(tile).toHaveAttribute("data-color", "sky");
  });

  it("calls onOpen when clicked", async () => {
    const onOpen = vi.fn();
    render(<BoardTile board={board} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole("button"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
