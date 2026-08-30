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
  it("renders brand, org switcher, search, bell and account", () => {
    setup();
    expect(screen.getByText("Taskify")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acme design studio/i })).toBeInTheDocument();
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Account: Alex Rivera" })).toBeInTheDocument();
  });

  it("wires search submit", async () => {
    const onSearch = vi.fn();
    setup({ onSearch });
    await userEvent.type(screen.getByRole("searchbox"), "hello{Enter}");
    expect(onSearch).toHaveBeenCalledWith("hello");
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

  it("uses a context-specific search placeholder", () => {
    setup({ searchPlaceholder: "Search boards, tasks…" });
    expect(screen.getByPlaceholderText("Search boards, tasks…")).toBeInTheDocument();
  });
});
