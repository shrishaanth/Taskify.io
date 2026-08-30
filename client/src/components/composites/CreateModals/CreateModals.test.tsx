import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateOrganizationModal } from "./CreateOrganizationModal";
import { CreateProjectModal } from "./CreateProjectModal";
import { CreateBoardModal } from "./CreateBoardModal";
import { InviteMemberModal } from "./InviteMemberModal";

describe("CreateOrganizationModal", () => {
  it("submits the trimmed name, disabled until non-empty", async () => {
    const onCreate = vi.fn();
    render(
      <CreateOrganizationModal open onClose={() => {}} onCreate={onCreate} />,
    );
    const create = screen.getByRole("button", { name: "Create Workspace" });
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Organization Name"), "  Acme  ");
    await userEvent.click(create);
    expect(onCreate).toHaveBeenCalledWith("Acme");
  });

  it("Cancel closes without creating", async () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();
    render(
      <CreateOrganizationModal open onClose={onClose} onCreate={onCreate} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onCreate).not.toHaveBeenCalled();
  });
});

describe("CreateProjectModal", () => {
  it("submits name + optional description; omits description when blank", async () => {
    const onCreate = vi.fn();
    render(<CreateProjectModal open onClose={() => {}} onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Project Name"), "Mobile App Redesign");
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onCreate).toHaveBeenCalledWith({ name: "Mobile App Redesign" });

    onCreate.mockClear();
    await userEvent.type(
      screen.getByLabelText("Project Description (Optional)"),
      "Objectives",
    );
    await userEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(onCreate).toHaveBeenCalledWith({
      name: "Mobile App Redesign",
      description: "Objectives",
    });
  });
});

describe("CreateBoardModal", () => {
  it("submits just the board name (colour is auto-assigned)", async () => {
    const onCreate = vi.fn();
    render(<CreateBoardModal open onClose={() => {}} onCreate={onCreate} />);
    await userEvent.type(screen.getByLabelText("Board Name"), "Content Strategy");
    expect(
      screen.queryByRole("radiogroup", { name: /background color/i }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Create Board" }));
    expect(onCreate).toHaveBeenCalledWith({ name: "Content Strategy" });
  });
});

describe("InviteMemberModal", () => {
  it("drives the invite form's submit from the footer button", async () => {
    const onInvite = vi.fn();
    render(<InviteMemberModal open onClose={() => {}} onInvite={onInvite} />);
    await userEvent.type(
      screen.getByLabelText("Email Address"),
      "new@acme.com",
    );
    await userEvent.selectOptions(screen.getByLabelText("Org Role"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(onInvite).toHaveBeenCalledWith({ email: "new@acme.com", role: "admin" });
  });

  it("shows a validation error from the footer submit on a bad email", async () => {
    const onInvite = vi.fn();
    render(<InviteMemberModal open onClose={() => {}} onInvite={onInvite} />);
    await userEvent.type(screen.getByLabelText("Email Address"), "bad");
    await userEvent.click(screen.getByRole("button", { name: "Send Invite" }));
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(onInvite).not.toHaveBeenCalled();
  });
});
