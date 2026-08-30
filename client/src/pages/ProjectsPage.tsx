import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { ProjectTile } from "../components/composites/ProjectTile/ProjectTile";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { Button } from "../components/primitives/Button/Button";
import { Skeleton } from "../components/primitives/Skeleton/Skeleton";
import { CreateProjectModal } from "../components/composites/CreateModals/CreateProjectModal";
import { useCreateProject, useProjects } from "../features/projects";
import { useSession } from "../stores/sessionStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { orgId = "" } = useParams();
  const [modalOpen, setModalOpen] = useState(false);

  const org = useSession((s) => s.session?.orgs.find((o) => o.id === orgId));
  const projectsQuery = useProjects(orgId);
  const createProject = useCreateProject(orgId);

  if (!org) return <NotFoundPage />;

  const openProject = (projectId: string) =>
    navigate(`/orgs/${orgId}/projects/${projectId}`);

  const projects = projectsQuery.data ?? [];

  return (
    <main className={styles.page}>
      <PageHeader
        title="Projects"
        subtitle="Manage your workspace projects, access team boards, and oversee progress."
        action={<Button onClick={() => setModalOpen(true)}>+ New Project</Button>}
      />

      {projectsQuery.isLoading ? (
        <div className={styles.grid3}>
          <Skeleton variant="block" height={160} />
          <Skeleton variant="block" height={160} />
          <Skeleton variant="block" height={160} />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<span aria-hidden="true">📋</span>}
          title="No projects yet"
          description="Create your first project to get started organizing your tasks."
          actions={<Button onClick={() => setModalOpen(true)}>+ Create Project</Button>}
        />
      ) : (
        <div className={styles.grid3}>
          {projects.map((p) => (
            <ProjectTile key={p.id} project={p} onOpen={() => openProject(p.id)} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pending={createProject.isPending}
        onCreate={({ name, description }) => {
          createProject.mutate(
            description ? { name, description } : { name },
            {
              onSuccess: (project) => {
                setModalOpen(false);
                openProject(project.id);
              },
            },
          );
        }}
      />
    </main>
  );
}
