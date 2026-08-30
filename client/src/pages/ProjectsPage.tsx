import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "../components/composites/PageHeader/PageHeader";
import { ProjectTile } from "../components/composites/ProjectTile/ProjectTile";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { Button } from "../components/primitives/Button/Button";
import { CreateProjectModal } from "../components/composites/CreateModals/CreateProjectModal";
import { useMockData, EMPTY } from "../stores/mockDataStore";
import { NotFoundPage } from "./NotFoundPage";
import styles from "./pages.module.css";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { orgId = "" } = useParams();
  const [modalOpen, setModalOpen] = useState(false);

  const org = useMockData((s) => s.orgById(orgId));
  const projects = useMockData((s) => s.projects[orgId] ?? EMPTY);
  const createProject = useMockData((s) => s.createProject);

  if (!org) return <NotFoundPage />;

  const openProject = (projectId: string) =>
    navigate(`/orgs/${orgId}/projects/${projectId}`);

  return (
    <main className={styles.page}>
      <PageHeader
        title="Projects"
        subtitle="Manage your workspace projects, access team boards, and oversee progress."
        action={<Button onClick={() => setModalOpen(true)}>+ New Project</Button>}
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={<span aria-hidden="true">📋</span>}
          title="No projects yet"
          description="Create your first project to get started organizing your tasks."
          actions={<Button onClick={() => setModalOpen(true)}>+ Create Project</Button>}
        />
      ) : (
        <div className={styles.grid3}>
          {projects.map((p) => (
            <ProjectTile
              key={p.id}
              project={p}
              onOpen={() => openProject(p.id)}
            />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={({ name, description }) => {
          const id = createProject(orgId, description ? { name, description } : { name });
          setModalOpen(false);
          openProject(id);
        }}
      />
    </main>
  );
}
