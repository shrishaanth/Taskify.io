import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentComposer } from "../CommentComposer/CommentComposer";
import { CommentItem } from "../CommentItem/CommentItem";
import { CommentList } from "./CommentList";
import type { Comment } from "../../../types/domain";

const NOW = new Date("2026-08-30T12:00:00Z");
const me = { id: "u1", name: "Sarah Jones" };

const comments: Comment[] = [
  {
    id: "c1",
    author: { id: "u2", name: "Alex Rivera" },
    body: "Just uploaded the final photo cuts.",
    createdAt: "2026-08-30T10:00:00Z",
  },
  {
    id: "c2",
    author: { id: "u1", name: "Sarah Jones" },
    body: "Thanks!",
    createdAt: "2026-08-30T11:00:00Z",
  },
];

describe("CommentComposer", () => {
  it("disables submit until there is text, then submits + clears", async () => {
    const onSubmit = vi.fn();
    render(<CommentComposer currentUser={me} onSubmit={onSubmit} />);
    const btn = screen.getByRole("button", { name: "Comment" });
    expect(btn).toBeDisabled();
    const field = screen.getByLabelText("Write a comment");
    await userEvent.type(field, "  looks good  ");
    await userEvent.click(screen.getByRole("button", { name: "Comment" }));
    expect(onSubmit).toHaveBeenCalledWith("looks good");
    expect(field).toHaveValue("");
  });
});

describe("CommentItem", () => {
  it("shows author, relative time, body and a delete control when allowed", async () => {
    const onDelete = vi.fn();
    render(
      <CommentItem
        comment={comments[0]}
        canDelete
        onDelete={onDelete}
        now={NOW}
      />,
    );
    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("2 hours ago")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Delete comment" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("hides delete when not allowed", () => {
    render(<CommentItem comment={comments[0]} canDelete={false} now={NOW} />);
    expect(screen.queryByRole("button", { name: "Delete comment" })).not.toBeInTheDocument();
  });
});

describe("CommentList — permission-driven delete", () => {
  it("a plain Member can delete only their own comment", () => {
    render(
      <CommentList
        comments={comments}
        currentUser={me}
        currentUserId="u1"
        viewer={{ projectRole: "member", orgRole: "member" }}
        onSubmit={() => {}}
        onDelete={() => {}}
        now={NOW}
      />,
    );
    // one delete button — for Sarah's own comment ("Thanks!")
    expect(screen.getAllByRole("button", { name: "Delete comment" })).toHaveLength(1);
  });

  it("a Project Head can delete every comment", () => {
    render(
      <CommentList
        comments={comments}
        currentUser={me}
        currentUserId="u1"
        viewer={{ projectRole: "head", orgRole: "member" }}
        onSubmit={() => {}}
        onDelete={() => {}}
        now={NOW}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Delete comment" })).toHaveLength(2);
  });

  it("newest comment renders first", () => {
    render(
      <CommentList
        comments={comments}
        currentUser={me}
        currentUserId="u1"
        viewer={{ projectRole: "member", orgRole: "member" }}
        onSubmit={() => {}}
        now={NOW}
      />,
    );
    const bodies = screen.getAllByText(/Thanks!|final photo cuts/);
    expect(bodies[0]).toHaveTextContent("Thanks!");
  });
});
