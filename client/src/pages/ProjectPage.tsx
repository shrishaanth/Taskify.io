import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ProjectHeader, type ProjectTabId } from "../components/composites/ProjectHeader/ProjectHeader";
import { BoardTile } from "../components/composites/BoardTile/BoardTile";
import { AddTile } from "../components/composites/AddTile/AddTile";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { MembersTable } from "../components/composites/MembersTable/MembersTable";
import { InviteForm } from "../components/composites/InviteForm/InviteForm";
import { CreateBoardModal } from "../components/composites/CreateModals/CreateBoardModal";
import { canWorkOnBoard, canManageProjectMembers } from "../lib/permissions";
import { useMockData, EMPTY } from "../stores/mockDataStore";
import { NotFoundPage } from "./NotFoundPage";
import { AccessDeniedPage } from "./AccessDeniedPage";
import styles from "./pages.module.css";

export function ProjectPage({ tab }: { tab: ProjectTabId }) {
  const navigate = useNavigate();
  const { orgId = "", projectId = "" } = useParams();
  const [boardModalOpen, setBoardModalOpen] = useState(false);

  const org = useMockData((s) => s.orgById(orgId));
  const project = useMockData((s) => s.projectById(orgId, projectId));
  const projectRole = useMockData((s) => s.projectRoleFor(projectId));
  const orgRole = useMockData((s) => s.orgRoleFor(orgId));
  const boards = useMockData((s) => s.boards[projectId] ?? EMPTY);
  const members = useMockData((s) => s.projectMembers[projectId] ?? EMPTY);
  const createBoard = useMockData((s) => s.createBoard);
  const setRole = useMockData((s) => s.setProjectMemberRole);
  const removeMember = useMockData((s) => s.removeProjectMember);
  const inviteMember = useMockData((s) => s.inviteProjectMember);

  if (!org || !project) return <NotFoundPage />;
  if (projectRole === null) return <AccessDeniedPage />;

  const viewer = { projectRole, orgRole };
  const canWork = canWorkOnBoard(viewer);
  const canManageMembers = canManageProjectMembers(viewer);

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
              setRole(projectId, userId, role as "head" | "member")
            }
            onRemove={(userId) => removeMember(projectId, userId)}
          />
          {canManageMembers && (
            <div className={styles.card}>
              <h3 style={{ marginTop: 0 }}>Invite Member</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
                Add team members to collaborate on {org.name} projects.
              </p>
              <InviteForm
                scope="project"
                onSubmit={(values) => inviteMember(projectId, values)}
              />
            </div>
          )}
        </div>
      )}

      <CreateBoardModal
        open={boardModalOpen}
        onClose={() => setBoardModalOpen(false)}
        onCreate={({ name, colorKey }) => {
          const id = createBoard(projectId, orgId, { name, colorKey });
          setBoardModalOpen(false);
          navigate(`/orgs/${orgId}/projects/${projectId}/boards/${id}`);
        }}
      />
    </main>
  );
}
