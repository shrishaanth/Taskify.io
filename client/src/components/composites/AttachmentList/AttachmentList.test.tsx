import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AttachmentItem } from "../AttachmentItem/AttachmentItem";
import { AttachmentList } from "./AttachmentList";
import type { Attachment } from "../../../types/domain";

const att = (over: Partial<Attachment> = {}): Attachment => ({
  id: "a1",
  fileName: "hero_draft_v1.png",
  fileUrl: "/f/a1",
  mimeType: "image/png",
  sizeBytes: 1536,
  uploadedBy: { id: "u2", name: "Alex Rivera" },
  ...over,
});

describe("AttachmentItem", () => {
  it("shows the file name + human size", () => {
    render(<AttachmentItem attachment={att()} canDelete={false} />);
    expect(screen.getByText("hero_draft_v1.png")).toBeInTheDocument();
    expect(screen.getByText("1.5 KB")).toBeInTheDocument();
  });

  it("fires onDelete only when allowed", async () => {
    const onDelete = vi.fn();
    const { rerender } = render(
      <AttachmentItem attachment={att()} canDelete={false} onDelete={onDelete} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(<AttachmentItem attachment={att()} canDelete onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete hero_draft_v1.png" }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe("AttachmentList — permission-driven rendering", () => {
  it("a Member can delete only their own upload; uploader row is deletable", () => {
    render(
      <AttachmentList
        attachments={[att({ id: "a1" }), att({ id: "a2", uploadedBy: { id: "u1", name: "Me" } })]}
        currentUserId="u1"
        viewer={{ projectRole: "member", orgRole: "member" }}
        onUpload={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getAllByRole("button", { name: /^Delete / })).toHaveLength(1);
  });

  it("a Project Head can delete any attachment", () => {
    render(
      <AttachmentList
        attachments={[att({ id: "a1" }), att({ id: "a2" })]}
        currentUserId="u1"
        viewer={{ projectRole: "head", orgRole: "member" }}
        onUpload={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getAllByRole("button", { name: /^Delete / })).toHaveLength(2);
  });

  it("shows an upload control for anyone who can work on the board", async () => {
    const onUpload = vi.fn();
    render(
      <AttachmentList
        attachments={[]}
        currentUserId="u1"
        viewer={{ projectRole: "member", orgRole: "member" }}
        onUpload={onUpload}
      />,
    );
    const input = screen.getByLabelText("Upload file");
    await userEvent.upload(
      input,
      new File(["x"], "spec.pdf", { type: "application/pdf" }),
    );
    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUpload.mock.calls[0][0]).toBeInstanceOf(File);
  });

  it("hides upload from a viewer with no project membership", () => {
    render(
      <AttachmentList
        attachments={[]}
        currentUserId="u1"
        viewer={{ projectRole: null, orgRole: "admin" }}
        onUpload={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Upload file" })).not.toBeInTheDocument();
  });
});
