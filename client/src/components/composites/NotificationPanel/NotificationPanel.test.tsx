import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationPanel } from "./NotificationPanel";
import type { AppNotification } from "../../../types/domain";

const NOW = new Date("2026-08-30T12:00:00Z");

const list: AppNotification[] = [
  {
    id: "n1",
    type: "card_assigned",
    title: "You were assigned to a card",
    createdAt: "2026-08-30T11:58:00Z",
    read: false,
  },
  {
    id: "n2",
    type: "role_changed",
    title: "Your role was changed to Admin",
    createdAt: "2026-08-29T09:00:00Z",
    read: true,
  },
];

describe("NotificationPanel", () => {
  it("renders the header and every item", () => {
    render(
      <NotificationPanel notifications={list} onMarkAllRead={() => {}} now={NOW} />,
    );
    expect(screen.getByRole("heading", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /./ }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText("You were assigned to a card")).toBeInTheDocument();
  });

  it("enables 'Mark all as read' only when something is unread", () => {
    const { rerender } = render(
      <NotificationPanel notifications={list} onMarkAllRead={() => {}} now={NOW} />,
    );
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeEnabled();

    rerender(
      <NotificationPanel
        notifications={list.map((n) => ({ ...n, read: true }))}
        onMarkAllRead={() => {}}
        now={NOW}
      />,
    );
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeDisabled();
  });

  it("fires onMarkAllRead", async () => {
    const onMarkAllRead = vi.fn();
    render(
      <NotificationPanel notifications={list} onMarkAllRead={onMarkAllRead} now={NOW} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
  });

  it("forwards item clicks with the notification id", async () => {
    const onItemClick = vi.fn();
    render(
      <NotificationPanel
        notifications={list}
        onMarkAllRead={() => {}}
        onItemClick={onItemClick}
        now={NOW}
      />,
    );
    await userEvent.click(screen.getByText("You were assigned to a card"));
    expect(onItemClick).toHaveBeenCalledWith("n1");
  });

  it("shows the caught-up empty state when there are no notifications", () => {
    render(<NotificationPanel notifications={[]} onMarkAllRead={() => {}} />);
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark all as read" })).toBeDisabled();
  });
});
