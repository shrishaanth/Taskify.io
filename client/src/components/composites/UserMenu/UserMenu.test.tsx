import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";

const user = { id: "u1", name: "Alex Rivera" };

describe("UserMenu", () => {
  it("shows an avatar trigger with an accessible name", () => {
    render(<UserMenu user={user} onLogout={() => {}} />);
    expect(
      screen.getByRole("button", { name: "Account: Alex Rivera" }),
    ).toBeInTheDocument();
  });

  it("only renders the actions that are wired", async () => {
    render(<UserMenu user={user} onLogout={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /account/i }));
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Profile" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: "Log out all devices" }),
    ).not.toBeInTheDocument();
  });

  it("fires the right handler (logout-all revokes all refresh tokens)", async () => {
    const onLogout = vi.fn();
    const onLogoutAll = vi.fn();
    const onProfile = vi.fn();
    render(
      <UserMenu
        user={user}
        onProfile={onProfile}
        onLogout={onLogout}
        onLogoutAll={onLogoutAll}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /account/i }));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "Log out all devices" }),
    );
    expect(onLogoutAll).toHaveBeenCalledTimes(1);
    expect(onLogout).not.toHaveBeenCalled();
  });
});
