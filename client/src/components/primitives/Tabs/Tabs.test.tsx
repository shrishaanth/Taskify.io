import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs, type TabItem } from "./Tabs";

const TABS: TabItem[] = [
  { id: "boards", label: "Boards" },
  { id: "members", label: "Members" },
  { id: "settings", label: "Settings", disabled: true },
];

function Harness({ initial = "boards" }: { initial?: string }) {
  const [active, setActive] = useState(initial);
  return <Tabs tabs={TABS} activeId={active} onChange={setActive} aria-label="Project" />;
}

describe("Tabs", () => {
  it("renders a labelled tablist with a tab per item", () => {
    render(<Harness />);
    expect(screen.getByRole("tablist", { name: "Project" })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("marks the active tab selected with roving tabindex", () => {
    render(<Harness />);
    const [boards, members] = screen.getAllByRole("tab");
    expect(boards).toHaveAttribute("aria-selected", "true");
    expect(boards).toHaveAttribute("tabindex", "0");
    expect(members).toHaveAttribute("aria-selected", "false");
    expect(members).toHaveAttribute("tabindex", "-1");
  });

  it("changes selection on click", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("tab", { name: "Members" }));
    expect(screen.getByRole("tab", { name: "Members" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("does not select a disabled tab", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} activeId="boards" onChange={onChange} />);
    const disabled = screen.getByRole("tab", { name: "Settings" });
    expect(disabled).toBeDisabled();
    await userEvent.click(disabled);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves selection with arrow keys, skipping disabled tabs and wrapping", async () => {
    const onChange = vi.fn();
    render(<Tabs tabs={TABS} activeId="boards" onChange={onChange} />);
    const boards = screen.getByRole("tab", { name: "Boards" });
    boards.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("members");
    // from members, ArrowRight skips disabled "settings" and wraps to "boards"
    render(<Tabs tabs={TABS} activeId="members" onChange={onChange} />);
    screen.getAllByRole("tab", { name: "Members" })[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onChange).toHaveBeenLastCalledWith("boards");
  });
});
