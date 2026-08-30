import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubtaskItem } from "./SubtaskItem";
import type { Subtask } from "../../../types/domain";

const sub: Subtask = {
  id: "s1",
  title: "Confirm exact marketing content copy",
  done: false,
  assignee: { id: "u1", name: "Sarah Jones" },
};

describe("SubtaskItem", () => {
  it("toggles done via the checkbox", async () => {
    const onToggle = vi.fn();
    render(<SubtaskItem subtask={sub} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole("checkbox", { name: sub.title }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("marks the row done + shows the assignee avatar", () => {
    render(<SubtaskItem subtask={{ ...sub, done: true }} onToggle={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.getByRole("img", { name: "Sarah Jones" })).toBeInTheDocument();
  });

  it("commits an edited title on blur when editable", async () => {
    const onEditTitle = vi.fn();
    render(<SubtaskItem subtask={sub} onToggle={() => {}} onEditTitle={onEditTitle} />);
    const field = screen.getByLabelText(`Edit: ${sub.title}`);
    await userEvent.clear(field);
    await userEvent.type(field, "New title");
    await userEvent.tab();
    expect(onEditTitle).toHaveBeenCalledWith("New title");
  });

  it("is read-only text when onEditTitle is absent", () => {
    render(<SubtaskItem subtask={sub} onToggle={() => {}} />);
    expect(screen.queryByLabelText(/^Edit:/)).not.toBeInTheDocument();
    expect(screen.getByText(sub.title)).toBeInTheDocument();
  });

  it("fires onDelete", async () => {
    const onDelete = vi.fn();
    render(<SubtaskItem subtask={sub} onToggle={() => {}} onDelete={onDelete} />);
    await userEvent.click(
      screen.getByRole("button", { name: `Delete subtask: ${sub.title}` }),
    );
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
