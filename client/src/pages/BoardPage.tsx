import { useState } from "react";
import { useParams } from "react-router-dom";
import { BoardHeader } from "../components/composites/BoardHeader/BoardHeader";
import { BoardCanvas } from "../components/composites/BoardCanvas/BoardCanvas";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { CardDetailModal } from "../components/composites/CardDetailModal/CardDetailModal";
import { canWorkOnBoard } from "../lib/permissions";
import { useMockData, EMPTY } from "../stores/mockDataStore";
import type { CardSummary } from "../types/domain";
import { NotFoundPage } from "./NotFoundPage";
import { AccessDeniedPage } from "./AccessDeniedPage";
import styles from "./pages.module.css";

export function BoardPage() {
  const { orgId = "", projectId = "", boardId = "" } = useParams();
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const org = useMockData((s) => s.orgById(orgId));
  const project = useMockData((s) => s.projectById(orgId, projectId));
  const board = useMockData((s) => s.boardById(boardId));
  const projectRole = useMockData((s) => s.projectRoleFor(projectId));
  const orgRole = useMockData((s) => s.orgRoleFor(orgId));
  const columns = useMockData((s) => s.boardColumns[boardId] ?? EMPTY);
  const cards = useMockData((s) => s.cards[boardId] ?? EMPTY);
  const doneColumnIds = useMockData((s) => s.doneColumnIds[boardId] ?? EMPTY);
  const members = useMockData((s) => s.projectMembers[projectId] ?? EMPTY);
  const currentUser = useMockData((s) => s.users[s.currentUserId]);
  const currentUserId = useMockData((s) => s.currentUserId);

  const addCard = useMockData((s) => s.addCard);
  const addColumn = useMockData((s) => s.addColumn);
  const renameColumn = useMockData((s) => s.renameColumn);
  const deleteColumn = useMockData((s) => s.deleteColumn);
  const getCardDetail = useMockData((s) => s.getCardDetail);
  const updateCard = useMockData((s) => s.updateCard);
  const deleteCard = useMockData((s) => s.deleteCard);
  const toggleSubtask = useMockData((s) => s.toggleSubtask);
  const addSubtask = useMockData((s) => s.addSubtask);
  const addComment = useMockData((s) => s.addComment);
  const deleteComment = useMockData((s) => s.deleteComment);
  const addAttachment = useMockData((s) => s.addAttachment);
  const deleteAttachment = useMockData((s) => s.deleteAttachment);

  // 404 before we reveal anything; then 403 for a same-org project the caller
  // can't see; only then does board existence matter (UC-10 contrast).
  if (!org || !project) return <NotFoundPage />;
  if (projectRole === null) return <AccessDeniedPage />;
  if (!board) return <NotFoundPage />;

  const viewer = { projectRole, orgRole };
  const canManage = canWorkOnBoard(viewer);

  const cardsByColumn: Record<string, CardSummary[]> = {};
  for (const col of columns) {
    cardsByColumn[col.id] = cards
      .filter((c) => c.columnId === col.id)
      .sort((a, b) => a.order - b.order);
  }

  const detail = openCardId ? getCardDetail(boardId, openCardId) : undefined;

  const breadcrumbs = [
    { label: org.name, href: `/orgs/${orgId}/projects` },
    { label: project.name, href: `/orgs/${orgId}/projects/${projectId}` },
    { label: board.name },
  ];

  return (
    <div>
      <div className={styles.page} style={{ paddingBottom: 0 }}>
        <BoardHeader
          name={board.name}
          breadcrumbs={breadcrumbs}
          connection="live"
          presence={members.map((m) => m.user)}
        />
      </div>

      <BoardCanvas
        columns={columns}
        cardsByColumn={cardsByColumn}
        doneColumnIds={doneColumnIds}
        canManage={canManage}
        onAddCard={(columnId) => addCard(boardId, columnId, "Untitled card")}
        onOpenCard={(cardId) => setOpenCardId(cardId)}
        onAddColumn={() => addColumn(boardId, "New Column")}
        onRenameColumn={(columnId) => {
          const name = window.prompt("Rename column");
          if (name) renameColumn(boardId, columnId, name);
        }}
        onDeleteColumn={(columnId) => deleteColumn(boardId, columnId)}
        emptyState={
          <EmptyState
            tone="red"
            icon={<span aria-hidden="true">▦</span>}
            title="This board is empty"
            description="Start organizing your work by adding columns and tasks."
            {...(canManage
              ? {
                  actions: (
                    <button
                      type="button"
                      onClick={() => addColumn(boardId, "To Do")}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-md)",
                        background: "var(--primary)",
                        color: "var(--primary-fg)",
                        border: 0,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Add your first column
                    </button>
                  ),
                }
              : {})}
          />
        }
      />

      {detail && (
        <CardDetailModal
          open
          onClose={() => setOpenCardId(null)}
          card={detail}
          breadcrumb={`${project.name} / ${board.name}`.toUpperCase()}
          viewer={viewer}
          currentUser={currentUser}
          currentUserId={currentUserId}
          projectMembers={members.map((m) => m.user)}
          onUpdateCard={(patch) => updateCard(detail.id, patch)}
          onToggleSubtask={(id, done) => toggleSubtask(detail.id, id, done)}
          onAddSubtask={(title) => addSubtask(detail.id, title)}
          onAddComment={(body) => addComment(detail.id, body)}
          onDeleteComment={(id) => deleteComment(detail.id, id)}
          onUploadAttachment={(file) =>
            addAttachment(detail.id, {
              name: file.name,
              size: file.size,
              type: file.type,
            })
          }
          onDeleteAttachment={(id) => deleteAttachment(detail.id, id)}
          onDeleteCard={() => {
            deleteCard(boardId, detail.id);
            setOpenCardId(null);
          }}
        />
      )}
    </div>
  );
}
