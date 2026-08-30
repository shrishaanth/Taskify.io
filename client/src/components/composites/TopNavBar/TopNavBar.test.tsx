import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopNavBar } from "./TopNavBar";
import type { AppNotification, OrgSummary, UserRef } from "../../../types/domain";

const orgs: OrgSummary[] = [
  { id: "o1", name: "Acme Design Studio", slug: "acme", role: "owner" },
];
const user: UserRef = { id: "u1", name: "Alex Rivera" };
const notifications: AppNotification[] = [
  {
    id: "n1",
    type: "card_assigned",
    title: "assigned",
    createdAt: "2026-08-30T11:00:00Z",
    read: false,
  },
];

function setup(extra: Partial<Parameters<typeof TopNavBar>[0]> = {}) {
  const props = {
    orgs,
    currentOrgId: "o1",
    onSwitchOrg: vi.fn(),
    notifications,
    onMarkAllNotificationsRead: vi.fn(),
    user,
    now: new Date("2026-08-30T12:00:00Z"),
    ...extra,
  };
  render(<TopNavBar {...props} />);
  return props;
}

describe("TopNavBar", () => {
  it("renders brand, org switcher, bell and account (no search bar)", () => {
    setup();
    expect(screen.getByText("Taskify")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acme design studio/i })).toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account: Alex Rivera" })).toBeInTheDocument();
  });

  it("opens the notification panel from the bell", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
  });

  it("exposes org Members / Settings through the org switcher", async () => {
    const onOpenOrgMembers = vi.fn();
    const onOpenOrgSettings = vi.fn();
    setup({ onOpenOrgMembers, onOpenOrgSettings });
    await userEvent.click(
      screen.getByRole("button", { name: /acme design studio/i }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Members" }));
    expect(onOpenOrgMembers).toHaveBeenCalledTimes(1);
  });

  it("zero-org state: no org switcher, but logo + account menu still work", async () => {
    const onLogoClick = vi.fn();
    setup({ orgs: [], onLogoClick });

    // no org switcher at all
    expect(
      screen.queryByRole("button", { name: /acme design studio/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Select organization")).not.toBeInTheDocument();

    // logo is a working "home" link, account menu is present, nothing crashed
    const home = screen.getByRole("button", { name: "Taskify home" });
    await userEvent.click(home);
    expect(onLogoClick).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Account: Alex Rivera" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /notifications/i }),
    ).toBeInTheDocument();
  });
});
