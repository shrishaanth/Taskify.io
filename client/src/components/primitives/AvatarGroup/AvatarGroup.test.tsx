import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AvatarGroup } from "./AvatarGroup";

const people = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ name: `Person ${i + 1}` }));

describe("AvatarGroup", () => {
  it("renders every avatar when within `max`", () => {
    render(<AvatarGroup avatars={people(3)} max={4} />);
    expect(screen.getAllByRole("img")).toHaveLength(3);
    expect(screen.queryByTestId("avatar-overflow")).not.toBeInTheDocument();
  });

  it("caps at `max` and shows a +N overflow chip", () => {
    render(<AvatarGroup avatars={people(7)} max={4} />);
    expect(screen.getAllByRole("img")).toHaveLength(4);
    expect(screen.getByTestId("avatar-overflow")).toHaveTextContent("+3");
  });

  it("renders an add button only when onAdd is supplied", async () => {
    const onAdd = vi.fn();
    const { rerender } = render(<AvatarGroup avatars={people(2)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<AvatarGroup avatars={people(2)} onAdd={onAdd} addLabel="Add assignee" />);
    const btn = screen.getByRole("button", { name: "Add assignee" });
    await userEvent.click(btn);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("propagates size to avatars and the overflow chip", () => {
    render(<AvatarGroup avatars={people(6)} max={2} size="md" />);
    expect(screen.getAllByTestId("avatar")[0]).toHaveAttribute("data-size", "md");
    expect(screen.getByTestId("avatar-overflow")).toHaveAttribute("data-size", "md");
  });
});
