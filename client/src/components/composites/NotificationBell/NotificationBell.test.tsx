import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "./NotificationBell";
import type { AppNotification } from "../../../types/domain";

const NOW = new Date("2026-08-30T12:00:00Z");
const mk = (id: string, read: boolean): AppNotification => ({
  id,
  type: "card_assigned",
  title: `n${id}`,
  createdAt: "2026-08-30T11:00:00Z",
  read,
});

describe("NotificationBell", () => {
  it("shows the unread count and an informative label", () => {
    render(
      <NotificationBell
        notifications={[mk("1", false), mk("2", false), mk("3", true)]}
        onMarkAllRead={() => {}}
        now={NOW}
      />,
    );
    expect(screen.getByTestId("bell-count")).toHaveTextContent("2");
    expect(
      screen.getByRole("button", { name: "Notifications, 2 unread" }),
    ).toBeInTheDocument();
  });

  it("hides the badge when nothing is unread", () => {
    render(
      <NotificationBell notifications={[mk("1", true)]} onMarkAllRead={() => {}} now={NOW} />,
    );
    expect(screen.queryByTestId("bell-count")).not.toBeInTheDocument();
  });

  it("caps the badge at 9+", () => {
    const many = Array.from({ length: 12 }, (_, i) => mk(String(i), false));
    render(<NotificationBell notifications={many} onMarkAllRead={() => {}} now={NOW} />);
    expect(screen.getByTestId("bell-count")).toHaveTextContent("9+");
  });

  it("opens the panel on click", async () => {
    render(
      <NotificationBell
        notifications={[mk("1", false)]}
        onMarkAllRead={() => {}}
        now={NOW}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("dialog", { name: "Notifications" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
  });
});
