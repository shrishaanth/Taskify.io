import { useEffect, useRef, useState } from "react";
import { Modal } from "../../primitives/Modal/Modal";
import { IconButton } from "../../primitives/IconButton/IconButton";
import { Menu, type MenuItem } from "../../primitives/Menu/Menu";
import { Input } from "../../primitives/Input/Input";
import { Textarea } from "../../primitives/Textarea/Textarea";
import { Select } from "../../primitives/Select/Select";
import { SubtaskChecklist } from "../SubtaskChecklist/SubtaskChecklist";
import { CommentList } from "../CommentList/CommentList";
import { AssigneePicker } from "../AssigneePicker/AssigneePicker";
import { LabelPicker } from "../LabelPicker/LabelPicker";
import { DateField } from "../DateField/DateField";
import { PriorityBadge } from "../PriorityBadge/PriorityBadge";
import { canWorkOnBoard, type ViewerContext } from "../../../lib/permissions";
import type {
  CardDetail,
  CardPatch,
  Id,
  Priority,
  UserRef,
} from "../../../types/domain";
import styles from "./CardDetailModal.module.css";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];

export interface CardDetailModalProps {
  open: boolean;
  onClose: () => void;
  card: CardDetail;
  /** e.g. "E-Commerce Redesign / Sprint Backlog". */
  breadcrumb: string;
  viewer: ViewerContext;
  currentUser: UserRef;
  currentUserId: Id;
  projectMembers: UserRef[];
  onUpdateCard: (patch: CardPatch) => void;
  onToggleSubtask: (id: Id, done: boolean) => void;
  onAddSubtask: (title: string) => void;
  onEditSubtaskTitle?: (id: Id, title: string) => void;
  onDeleteSubtask?: (id: Id) => void;
  onAddComment: (body: string) => void;
  onDeleteComment?: (id: Id) => void;
  onDeleteCard?: () => void;
  now?: Date;
}

export function CardDetailModal({
  open,
  onClose,
  card,
  breadcrumb,
  viewer,
  currentUser,
  currentUserId,
  projectMembers,
  onUpdateCard,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtaskTitle,
  onDeleteSubtask,
  onAddComment,
  onDeleteComment,
  onDeleteCard,
  now,
}: CardDetailModalProps) {
  const canEdit = canWorkOnBoard(viewer);
  const [desc, setDesc] = useState(card.description ?? "");

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(card.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitleDraft(card.title);
  }, [card.title]);
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.select();
  }, [editingTitle]);

  const commitTitle = () => {
    const next = titleDraft.trim();
    setEditingTitle(false);
    if (next && next !== card.title) onUpdateCard({ title: next });
    else setTitleDraft(card.title);
  };

  const menuItems: MenuItem[] = [];
  if (canEdit && onDeleteCard)
    menuItems.push({
      id: "delete",
      label: "Delete card",
      tone: "danger",
      onSelect: onDeleteCard,
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      aria-label={card.title}
      headerSlot={
        <>
          <div className={styles.header}>
            <div className={styles.headerMain}>
              <span className={styles.eyebrow}>{breadcrumb}</span>
              <h2 className={styles.title}>
                {editingTitle ? (
                  <Input
                    ref={titleInputRef}
                    className={styles.titleInput}
                    aria-label="Card title"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitTitle();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        setTitleDraft(card.title);
                        setEditingTitle(false);
                      }
                    }}
                  />
                ) : canEdit ? (
                  <button
                    type="button"
                    className={styles.titleButton}
                    onClick={() => setEditingTitle(true)}
                    title="Click to rename"
                  >
                    {card.title}
                  </button>
                ) : (
                  card.title
                )}
              </h2>
            </div>
            <div className={styles.headerActions}>
              {menuItems.length > 0 && (
                <Menu
                  menuLabel="Card actions"
                  placement="bottom-end"
                  trigger={
                    <IconButton
                      label="Card actions"
                      size="sm"
                      icon={<span aria-hidden="true">⋯</span>}
                    />
                  }
                  items={menuItems}
                />
              )}
              <IconButton
                label="Close"
                variant="circle"
                size="sm"
                onClick={onClose}
                icon={<span aria-hidden="true">×</span>}
              />
            </div>
          </div>
          <div className={styles.divider} />
        </>
      }
    >
      <div className={styles.grid}>
        <div>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Description</h3>
            {canEdit ? (
              <Textarea
                className={styles.descEdit}
                aria-label="Card description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => {
                  if (desc !== (card.description ?? ""))
                    onUpdateCard({ description: desc });
                }}
              />
            ) : (
              <p className={styles.descText}>{card.description}</p>
            )}
          </div>

          <div className={styles.section}>
            <SubtaskChecklist
              subtasks={card.subtasks}
              canEdit={canEdit}
              onToggle={onToggleSubtask}
              onAdd={onAddSubtask}
              {...(onEditSubtaskTitle ? { onEditTitle: onEditSubtaskTitle } : {})}
              {...(onDeleteSubtask ? { onDelete: onDeleteSubtask } : {})}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Activity Comments</h3>
            <CommentList
              comments={card.comments}
              currentUser={currentUser}
              currentUserId={currentUserId}
              viewer={viewer}
              onSubmit={onAddComment}
              {...(onDeleteComment ? { onDelete: onDeleteComment } : {})}
              {...(now ? { now } : {})}
            />
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Assignees</span>
            <AssigneePicker
              assignees={card.assignees}
              candidates={projectMembers}
              canEdit={canEdit}
              onChange={(assigneeIds) => onUpdateCard({ assigneeIds })}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Labels</span>
            <LabelPicker
              labels={card.labels}
              canEdit={canEdit}
              onChange={(labels) => onUpdateCard({ labels })}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Due date</span>
            <DateField
              {...(card.dueDate ? { value: card.dueDate } : {})}
              disabled={!canEdit}
              onChange={(v) => onUpdateCard({ dueDate: v })}
            />
          </div>

          <div className={styles.field}>
            <span className={styles.fieldLabel}>Priority</span>
            {canEdit ? (
              <Select
                aria-label="Priority"
                value={card.priority ?? "medium"}
                options={PRIORITIES.map((p) => ({ label: p, value: p }))}
                onChange={(e) =>
                  onUpdateCard({ priority: e.target.value as Priority })
                }
              />
            ) : card.priority ? (
              <PriorityBadge priority={card.priority} />
            ) : null}
          </div>
        </aside>
      </div>
    </Modal>
  );
}
