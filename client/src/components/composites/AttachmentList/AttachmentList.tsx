import { useRef } from "react";
import { cn } from "../../utils/cn";
import { AttachmentItem } from "../AttachmentItem/AttachmentItem";
import {
  canDeleteAttachment,
  canWorkOnBoard,
  type ViewerContext,
} from "../../../lib/permissions";
import type { Attachment, Id } from "../../../types/domain";
import styles from "./AttachmentList.module.css";

export interface AttachmentListProps {
  attachments: Attachment[];
  currentUserId: Id;
  viewer: ViewerContext;
  onUpload: (file: File) => void;
  onDelete?: (id: Id) => void;
  className?: string;
}

export function AttachmentList({
  attachments,
  currentUserId,
  viewer,
  onUpload,
  onDelete,
  className,
}: AttachmentListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const canUpload = canWorkOnBoard(viewer);

  return (
    <div className={cn(styles.root, className)}>
      {attachments.map((a) => (
        <AttachmentItem
          key={a.id}
          attachment={a}
          canDelete={canDeleteAttachment(viewer, {
            isUploader: a.uploadedBy.id === currentUserId,
          })}
          {...(onDelete ? { onDelete: () => onDelete(a.id) } : {})}
        />
      ))}

      {canUpload && (
        <>
          <button
            type="button"
            className={styles.upload}
            onClick={() => inputRef.current?.click()}
          >
            <span aria-hidden="true">⤒</span> Upload file
          </button>
          <input
            ref={inputRef}
            type="file"
            className={styles.hiddenInput}
            aria-label="Upload file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
}
