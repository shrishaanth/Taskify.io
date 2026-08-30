import { Avatar } from "../../primitives/Avatar/Avatar";
import { formatRelativeTime } from "../../../lib/format";
import type { Comment } from "../../../types/domain";
import styles from "../CommentList/CommentList.module.css";

export interface CommentItemProps {
  comment: Comment;
  canDelete: boolean;
  onDelete?: () => void;
  now?: Date;
}

export function CommentItem({
  comment,
  canDelete,
  onDelete,
  now,
}: CommentItemProps) {
  return (
    <div className={styles.comment}>
      <Avatar
        name={comment.author.name}
        {...(comment.author.avatarUrl ? { src: comment.author.avatarUrl } : {})}
        size="sm"
      />
      <div className={styles.commentBody}>
        <div className={styles.meta}>
          <span className={styles.author}>{comment.author.name}</span>
          <span className={styles.time}>
            {formatRelativeTime(comment.createdAt, now)}
          </span>
          {canDelete && (
            <button
              type="button"
              className={styles.delete}
              aria-label="Delete comment"
              {...(onDelete ? { onClick: onDelete } : {})}
            >
              Delete
            </button>
          )}
        </div>
        <p className={styles.text}>{comment.body}</p>
      </div>
    </div>
  );
}
