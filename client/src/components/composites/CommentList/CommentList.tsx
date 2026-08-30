import { cn } from "../../utils/cn";
import { CommentComposer } from "../CommentComposer/CommentComposer";
import { CommentItem } from "../CommentItem/CommentItem";
import { canDeleteComment, type ViewerContext } from "../../../lib/permissions";
import type { Comment, Id, UserRef } from "../../../types/domain";
import styles from "./CommentList.module.css";

export interface CommentListProps {
  comments: Comment[];
  currentUser: UserRef;
  currentUserId: Id;
  viewer: ViewerContext;
  onSubmit: (body: string) => void;
  onDelete?: (id: Id) => void;
  pending?: boolean;
  now?: Date;
  className?: string;
}

export function CommentList({
  comments,
  currentUser,
  currentUserId,
  viewer,
  onSubmit,
  onDelete,
  pending = false,
  now,
  className,
}: CommentListProps) {
  const ordered = [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className={cn(styles.root, className)}>
      <CommentComposer
        currentUser={currentUser}
        onSubmit={onSubmit}
        pending={pending}
      />
      <div className={styles.list}>
        {ordered.map((c) => {
          const isAuthor = c.author.id === currentUserId;
          return (
            <CommentItem
              key={c.id}
              comment={c}
              canDelete={canDeleteComment(viewer, { isAuthor })}
              {...(onDelete ? { onDelete: () => onDelete(c.id) } : {})}
              {...(now ? { now } : {})}
            />
          );
        })}
      </div>
    </div>
  );
}
