import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InviteForm } from "./InviteForm";

describe("InviteForm — org scope", () => {
  it("renders Email + Org Role (Admin/Member) and a disabled submit until valid", () => {
    render(<InviteForm scope="org" onSubmit={() => {}} />);
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Org Role")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Member" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Invite" })).toBeDisabled();
  });

  it("submits a trimmed email + selected role", async () => {
    const onSubmit = vi.fn();
    render(<InviteForm scope="org" onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText("Email Address"), "  new@acme.com  ");
    await userEvent.selectOptions(screen.getByLabelText("Org Role"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(onSubmit).toHaveBeenCalledWith({ email: "new@acme.com", role: "admin" });
  });

  it("shows an inline error for a malformed email and blocks submit", async () => {
    const onSubmit = vi.fn();
    render(<InviteForm scope="org" onSubmit={onSubmit} />);
    const field = screen.getByLabelText("Email Address");
    await userEvent.type(field, "not-an-email");
    await userEvent.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("InviteForm — project scope", () => {
  it("uses the project wording and Head/Member roles (C6)", () => {
    render(<InviteForm scope="project" onSubmit={() => {}} />);
    expect(screen.getByLabelText("Search by Email Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Assign Project Role")).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Member (Can view & edit)" }),
    ).toBeInTheDocument();
  });

  it("shows a loading state while pending", () => {
    render(<InviteForm scope="project" onSubmit={() => {}} pending />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
