import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ProjectHeader,
  type ProjectTabId,
} from "../components/composites/ProjectHeader/ProjectHeader";
import { BoardTile } from "../components/composites/BoardTile/BoardTile";
import { AddTile } from "../components/composites/AddTile/AddTile";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { MembersTable } from "../components/composites/MembersTable/MembersTable";
import { InviteForm } from "../components/composites/InviteForm/InviteForm";
import { Skeleton } from "../components/primitives/Skeleton/Skeleton";
import { CreateBoardModal } from "../components/composites/CreateModals/CreateBoardModal";
import { useToast } from "../components/primitives/Toast/useToast";
import { ApiError } from "../api/http";
import {
  useProject,
  useProjectMembers,
  useRemoveProjectMember,
  useSetProjectMember,
} from "../features/projects";
import { useOrgMembers } from "../features/orgs";
import { useBoards, useCreateBoard } from "../features/boards";
import { canManageProjectMembers, canWorkOnBoard } from "../lib/permissions";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import { AccessDeniedPage } from "./AccessDeniedPage";
import styles from "./pages.module.css";

export function ProjectPage({ tab }: { tab: ProjectTabId }) {
  const navigate = useNavigate();
  const { orgId = "", projectId = "" } = useParams();
  const [boardModalOpen, setBoardModalOpen] = useState(false);

  const toast = useToast();
  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const projectQuery = useProject(orgId, projectId);
  const boardsQuery = useBoards(projectId);
  const membersQuery = useProjectMembers(orgId, projectId);
  const orgMembersQuery = useOrgMembers(orgId);
  const createBoard = useCreateBoard(projectId);
  const setRole = useSetProjectMember(orgId, projectId);
  const removeMember = useRemoveProjectMember(orgId, projectId);

  if (!org) return <NotFoundPage />;

  if (projectQuery.isError) {
    const status = (projectQuery.error as ApiError)?.status;
    if (status === 403) return <AccessDeniedPage />;
    return <NotFoundPage />;
  }
  if (projectQuery.isLoading || !projectQuery.data) {
    return (
      <main className={styles.page}>
        <Skeleton variant="line" width={280} />
        <Skeleton variant="block" height={200} />
      </main>
    );
  }

  const project = projectQuery.data;
  const viewer = { projectRole: project.role, orgRole: org.role };
  const canWork = canWorkOnBoard(viewer);
  const canManageMembers = canManageProjectMembers(viewer);
  const boards = boardsQuery.data ?? [];
  const members = membersQuery.data ?? project.memberRows;

  const breadcrumbs = [
    { label: org.name, href: `/orgs/${orgId}/projects` },
    { label: project.name },
  ];

  return (
    <main className={styles.page}>
      <ProjectHeader
        name={project.name}
        {...(project.description ? { description: project.description } : {})}
        breadcrumbs={breadcrumbs}
        activeTab={tab}
        onTabChange={(next) =>
          navigate(
            next === "members"
              ? `/orgs/${orgId}/projects/${projectId}/members`
              : `/orgs/${orgId}/projects/${projectId}`,
          )
        }
      />

      {tab === "boards" ? (
        boards.length === 0 && !canWork ? (
          <EmptyState
            icon={<span aria-hidden="true">▦</span>}
            title="No boards yet"
            description="A Project Head or Member can create the first board."
          />
        ) : boards.length === 0 ? (
          <EmptyState
            icon={<span aria-hidden="true">▦</span>}
            tone="red"
            title="This project has no boards"
            description="Start organizing your work by creating a board."
            actions={
              <button
                type="button"
                onClick={() => setBoardModalOpen(true)}
                className={styles.primaryPill}
              >
                + New Board
              </button>
            }
          />
        ) : (
          <div className={styles.grid3}>
            {boards.map((b) => (
              <BoardTile
                key={b.id}
                board={b}
                onOpen={() =>
                  navigate(`/orgs/${orgId}/projects/${projectId}/boards/${b.id}`)
                }
              />
            ))}
            {canWork && (
              <AddTile label="New Board" onClick={() => setBoardModalOpen(true)} />
            )}
          </div>
        )
      ) : (
        <div className={styles.sidebarLayout}>
          <MembersTable
            scope="project"
            members={members}
            viewer={viewer}
            onChangeRole={(userId, role) =>
              setRole.mutate({ userId, role: role as "head" | "member" })
            }
            onRemove={(userId) => removeMember.mutate(userId)}
          />
          {canManageMembers && (
            <div className={styles.card}>
              <h3 style={{ marginTop: 0 }}>Invite Member</h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "var(--font-size-sm)",
                }}
              >
                Add team members to collaborate on {org.name} projects.
              </p>
              <InviteForm
                scope="project"
                onSubmit={(values) => {
                  const role = values.role === "head" ? "head" : "member";
                  // C6: a project invite grants a role to an existing ORG member.
                  const target = (orgMembersQuery.data ?? []).find(
                    (m) => m.user.email === values.email,
                  );
                  if (!target) {
                    toast.show({
                      tone: "error",
                      title: "Not an organization member",
                      description: "Invite them to the organization first.",
                    });
                    return;
                  }
                  setRole.mutate(
                    { userId: target.user.id, role },
                    {
                      onSuccess: () =>
                        toast.show({ tone: "success", title: "Member added" }),
                    },
                  );
                }}
              />
            </div>
          )}
        </div>
      )}

      <CreateBoardModal
        open={boardModalOpen}
        onClose={() => setBoardModalOpen(false)}
        pending={createBoard.isPending}
        onCreate={({ name }) => {
          createBoard.mutate(
            { name },
            {
              onSuccess: (board) => {
                setBoardModalOpen(false);
                navigate(
                  `/orgs/${orgId}/projects/${projectId}/boards/${board.id}`,
                );
              },
            },
          );
        }}
      />
    </main>
  );
}
