import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BoardHeader } from "../components/composites/BoardHeader/BoardHeader";
import { BoardCanvas } from "../components/composites/BoardCanvas/BoardCanvas";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { CardDetailModal } from "../components/composites/CardDetailModal/CardDetailModal";
import { Skeleton } from "../components/primitives/Skeleton/Skeleton";
import { ApiError } from "../api/http";
import { useBoard, useUpdateBoard } from "../features/boards";
import { useProject } from "../features/projects";
import { useCardMutations, useCards, useCardDetail } from "../features/cards";
import { canWorkOnBoard } from "../lib/permissions";
import { useSession } from "../stores/sessionStore";
import type { CardSummary } from "../types/domain";
import { NotFoundPage } from "./NotFoundPage";
import { AccessDeniedPage } from "./AccessDeniedPage";
import styles from "./pages.module.css";

export function BoardPage() {
  const { orgId = "", projectId = "", boardId = "" } = useParams();
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const currentUser = useSession((s) => s.session?.user);
  const projectQuery = useProject(orgId, projectId);
  const boardQuery = useBoard(projectId, boardId);
  const cardsQuery = useCards(boardId);

  const project = projectQuery.data;
  const members = useMemo(() => project?.members ?? [], [project]);
  const cardDetailQuery = useCardDetail(boardId, openCardId, members);
  const m = useCardMutations(boardId, openCardId);
  const updateBoard = useUpdateBoard(projectId, boardId);
  const updateBoardColumns = (
    columns: { id?: string; name: string; order: number }[],
  ) =>
    updateBoard.mutate({
      columns: columns.map((c, i) => ({
        ...(c.id ? { id: c.id } : {}),
        name: c.name,
        order: i,
      })),
    });

  if (!org) return <NotFoundPage />;

  if (projectQuery.isError) {
    const status = (projectQuery.error as ApiError)?.status;
    return status === 403 ? <AccessDeniedPage /> : <NotFoundPage />;
  }
  if (boardQuery.isError) {
    const status = (boardQuery.error as ApiError)?.status;
    return status === 403 ? <AccessDeniedPage /> : <NotFoundPage />;
  }
  if (
    projectQuery.isLoading ||
    boardQuery.isLoading ||
    !project ||
    !boardQuery.data ||
    !currentUser
  ) {
    return (
      <main className={styles.page}>
        <Skeleton variant="line" width={260} />
        <Skeleton variant="block" height={280} />
      </main>
    );
  }

  const board = boardQuery.data;
  const viewer = { projectRole: project.role, orgRole: org.role };
  const canManage = canWorkOnBoard(viewer);
  const cards = cardsQuery.data ?? [];

  const doneColumnIds = board.columns
    .filter((c) => /done|complete/i.test(c.name))
    .map((c) => c.id);

  const cardsByColumn: Record<string, CardSummary[]> = {};
  for (const col of board.columns) {
    cardsByColumn[col.id] = cards
      .filter((c) => c.columnId === col.id)
      .sort((a, b) => a.order - b.order);
  }

  const handleMoveCard = (
    cardId: string,
    toColumnId: string,
    beforeCardId: string | null,
  ) => {
    const target = (cardsByColumn[toColumnId] ?? []).filter(
      (c) => c.id !== cardId,
    );
    const idx = beforeCardId
      ? target.findIndex((c) => c.id === beforeCardId)
      : -1;
    const order = idx === -1 ? target.length : idx;
    const current = cards.find((c) => c.id === cardId);
    if (current && current.columnId === toColumnId && current.order === order) {
      return;
    }
    m.moveCard.mutate({ cardId, columnId: toColumnId, order });
  };

  const breadcrumbs = [
    { label: org.name, href: `/orgs/${orgId}/projects` },
    { label: project.name, href: `/orgs/${orgId}/projects/${projectId}` },
    { label: board.name },
  ];

  const detail = openCardId ? cardDetailQuery.data : undefined;

  return (
    <div>
      <div className={styles.page} style={{ paddingBottom: 0 }}>
        <BoardHeader
          name={board.name}
          breadcrumbs={breadcrumbs}
          connection="live"
          presence={members}
        />
      </div>

      <BoardCanvas
        columns={board.columns}
        cardsByColumn={cardsByColumn}
        doneColumnIds={doneColumnIds}
        canManage={canManage}
        onMoveCard={handleMoveCard}
        onAddCard={(columnId) =>
          m.createCard.mutate({ title: "Untitled card", columnId })
        }
        onOpenCard={(cardId) => setOpenCardId(cardId)}
        onAddColumn={() =>
          updateBoardColumns([
            ...board.columns,
            { name: "New Column", order: board.columns.length },
          ])
        }
        onRenameColumn={(columnId) => {
          const next = window.prompt("Rename column");
          if (next) {
            updateBoardColumns(
              board.columns.map((c) =>
                c.id === columnId ? { ...c, name: next } : c,
              ),
            );
          }
        }}
        onDeleteColumn={(columnId) =>
          updateBoardColumns(board.columns.filter((c) => c.id !== columnId))
        }
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
                      className={styles.primaryPill}
                      onClick={() =>
                        updateBoardColumns([{ name: "To Do", order: 0 }])
                      }
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
          currentUserId={currentUser.id}
          projectMembers={members}
          onUpdateCard={(patch) =>
            m.updateCard.mutate({ cardId: detail.id, patch })
          }
          onToggleSubtask={(id, done) =>
            m.toggleSubtask.mutate({ cardId: detail.id, subtaskId: id, done })
          }
          onAddSubtask={(title) =>
            m.addSubtask.mutate({ cardId: detail.id, title })
          }
          onAddComment={(body) =>
            m.addComment.mutate({ cardId: detail.id, body })
          }
          onDeleteComment={(id) =>
            m.deleteComment.mutate({ cardId: detail.id, commentId: id })
          }
          onDeleteCard={() =>
            m.deleteCard.mutate(detail.id, {
              onSuccess: () => setOpenCardId(null),
            })
          }
        />
      )}
    </div>
  );
}
