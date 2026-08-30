import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardDetailModal, type CardDetailModalProps } from "./CardDetailModal";
import type { CardDetail, UserRef } from "../../../types/domain";

const NOW = new Date("2026-08-30T12:00:00Z");

const members: UserRef[] = [
  { id: "u1", name: "Sarah Jones" },
  { id: "u2", name: "Alex Rivera" },
  { id: "u3", name: "Mia Brooks" },
];

const card: CardDetail = {
  id: "c1",
  boardId: "b1",
  columnId: "col1",
  order: 0,
  title: "Update homepage hero banner graphics",
  labels: ["Marketing", "Design"],
  assignees: [members[0], members[1]],
  dueDate: "2026-10-24T00:00:00.000Z",
  priority: "high",
  subtaskDone: 1,
  subtaskTotal: 2,
  commentCount: 1,
  description: "We need to refresh the current hero graphic.",
  subtasks: [
    { id: "s1", title: "Confirm copy", done: true },
    { id: "s2", title: "Gather feedback", done: false },
  ],
  comments: [
    {
      id: "cm1",
      author: { id: "u2", name: "Alex Rivera" },
      body: "Just uploaded the final photo cuts.",
      createdAt: "2026-08-30T10:00:00Z",
    },
  ],
  attachments: [
    {
      id: "a1",
      fileName: "hero_draft_v1.png",
      fileUrl: "/f/a1",
      mimeType: "image/png",
      sizeBytes: 2048,
      uploadedBy: { id: "u2", name: "Alex Rivera" },
    },
  ],
};

function setup(over: Partial<CardDetailModalProps> = {}) {
  const props: CardDetailModalProps = {
    open: true,
    onClose: vi.fn(),
    card,
    breadcrumb: "E-Commerce Redesign / Sprint Backlog",
    viewer: { projectRole: "member", orgRole: "member" },
    currentUser: members[0],
    currentUserId: "u1",
    projectMembers: members,
    onUpdateCard: vi.fn(),
    onToggleSubtask: vi.fn(),
    onAddSubtask: vi.fn(),
    onAddComment: vi.fn(),
    onUploadAttachment: vi.fn(),
    now: NOW,
    ...over,
  };
  render(<CardDetailModal {...props} />);
  return props;
}

describe("CardDetailModal — layout", () => {
  it("shows breadcrumb eyebrow, title, description, subtasks, comments and sidebar fields", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: card.title });
    expect(within(dialog).getByText("E-Commerce Redesign / Sprint Backlog")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: card.title })).toBeInTheDocument();
    expect(within(dialog).getByText("1/2 completed")).toBeInTheDocument();
    expect(within(dialog).getByText("Alex Rivera")).toBeInTheDocument();
    expect(within(dialog).getByText("Marketing")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Due date")).toHaveValue("2026-10-24");
    expect(within(dialog).getByText("hero_draft_v1.png")).toBeInTheDocument();
  });

  it("closes via the close button", async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CardDetailModal — permission-driven rendering", () => {
  it("a Head/Member sees editing affordances and a Delete card action", async () => {
    const { onDeleteCard } = { onDeleteCard: vi.fn() };
    setup({ viewer: { projectRole: "member", orgRole: "member" }, onDeleteCard });
    expect(screen.getByLabelText("Card description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add assignee" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Add checklist subtask" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Card actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete card" }));
    expect(onDeleteCard).toHaveBeenCalledTimes(1);
  });

  it("a viewer with no project role sees a read-only card (no editors, no delete)", () => {
    setup({
      viewer: { projectRole: null, orgRole: "admin" },
      onDeleteCard: vi.fn(),
    });
    expect(screen.queryByLabelText("Card description")).not.toBeInTheDocument();
    expect(screen.getByText("We need to refresh the current hero graphic.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add assignee" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ Add checklist subtask" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Card actions" })).not.toBeInTheDocument();
    // priority shows as a static badge instead of a select
    expect(screen.getByText("High Priority")).toBeInTheDocument();
    expect(screen.queryByLabelText("Priority")).not.toBeInTheDocument();
  });
});

describe("CardDetailModal — interactions", () => {
  it("toggles a subtask and adds a comment through the callbacks", async () => {
    const { onToggleSubtask, onAddComment } = setup();
    await userEvent.click(screen.getByRole("checkbox", { name: "Gather feedback" }));
    expect(onToggleSubtask).toHaveBeenCalledWith("s2", true);

    await userEvent.type(screen.getByLabelText("Write a comment"), "Looks good");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));
    expect(onAddComment).toHaveBeenCalledWith("Looks good");
  });

  it("commits a description edit on blur", async () => {
    const { onUpdateCard } = setup();
    const ta = screen.getByLabelText("Card description");
    await userEvent.clear(ta);
    await userEvent.type(ta, "New description");
    await userEvent.tab();
    expect(onUpdateCard).toHaveBeenCalledWith({ description: "New description" });
  });
});
