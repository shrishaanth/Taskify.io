import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoleBadge } from "./RoleBadge";

describe("RoleBadge", () => {
  it("renders org roles with the right label + tone", () => {
    const { rerender } = render(<RoleBadge scope="org" role="owner" />);
    expect(screen.getByText("Owner")).toHaveAttribute("data-tone", "rose");
    rerender(<RoleBadge scope="org" role="admin" />);
    expect(screen.getByText("Admin")).toHaveAttribute("data-tone", "violet");
  });

  it("renders project roles (Head sky, Member green)", () => {
    const { rerender } = render(<RoleBadge scope="project" role="head" />);
    expect(screen.getByText("Head")).toHaveAttribute("data-tone", "sky");
    rerender(<RoleBadge scope="project" role="member" />);
    expect(screen.getByText("Member")).toHaveAttribute("data-tone", "green");
  });

  it("renders the no-access state (FR-2.3)", () => {
    render(<RoleBadge scope="project" role="no-access" />);
    expect(screen.getByText("No access")).toHaveAttribute("data-tone", "slate");
  });

  it("uppercases the label on request", () => {
    render(<RoleBadge scope="project" role="head" uppercase />);
    expect(screen.getByText("HEAD")).toBeInTheDocument();
  });

  it("is a plain badge (no button) when not editable", () => {
    render(<RoleBadge scope="org" role="member" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("editable: opens a menu of the other roles and fires onChange", async () => {
    const onChange = vi.fn();
    render(<RoleBadge scope="org" role="member" editable onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /change role/i }));
    // current role excluded from the options
    expect(screen.queryByRole("menuitem", { name: "Member" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "Admin" }));
    expect(onChange).toHaveBeenCalledWith("admin");
  });

  it("editable is ignored for no-access", () => {
    render(<RoleBadge scope="project" role="no-access" editable onChange={() => {}} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
