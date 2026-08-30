import { formatFileSize } from "../../../lib/format";
import type { Attachment } from "../../../types/domain";
import styles from "../AttachmentList/AttachmentList.module.css";

export interface AttachmentItemProps {
  attachment: Attachment;
  canDelete: boolean;
  onDelete?: () => void;
}

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

export function AttachmentItem({
  attachment,
  canDelete,
  onDelete,
}: AttachmentItemProps) {
  return (
    <div className={styles.item}>
      <span className={styles.icon}>
        <FileIcon />
      </span>
      <span className={styles.name}>{attachment.fileName}</span>
      <span className={styles.size}>{formatFileSize(attachment.sizeBytes)}</span>
      {canDelete && (
        <button
          type="button"
          className={styles.delete}
          aria-label={`Delete ${attachment.fileName}`}
          {...(onDelete ? { onClick: onDelete } : {})}
        >
          ×
        </button>
      )}
    </div>
  );
}
