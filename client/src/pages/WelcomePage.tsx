import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/primitives/Button/Button";
import { CreateOrganizationModal } from "../components/composites/CreateModals/CreateOrganizationModal";
import { useCreateOrg } from "../features/orgs";
import { useSession } from "../stores/sessionStore";
import styles from "./pages.module.css";

export function WelcomePage() {
  const navigate = useNavigate();
  const user = useSession((s) => s.session?.user);
  const createOrg = useCreateOrg();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className={styles.welcomeMain}>
      <h1>Welcome to Taskify! 🎉</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Let&rsquo;s get you set up to start organizing tasks, columns, and
        beautiful boards with your team. Select an option below to begin.
      </p>

      <div className={styles.welcomeChoices}>
        <div className={styles.choiceCard} data-selected="true">
          <span className={styles.choiceIcon} aria-hidden="true">
            🏢
          </span>
          <h2 style={{ fontSize: "var(--font-size-md)" }}>Create an Organization</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Set up a centralized workspace for your company or team to house
            multiple project boards.
          </p>
          <Button onClick={() => setModalOpen(true)}>Create Organization</Button>
        </div>

        <div className={styles.choiceCard} data-muted="true">
          <span className={styles.choiceIcon} aria-hidden="true">
            ✉️
          </span>
          <h2 style={{ fontSize: "var(--font-size-md)" }}>Waiting for an invite?</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>
            Ask your workspace administrator to invite your registered email:{" "}
            <strong>{user?.email}</strong>
          </p>
          <Button variant="secondary" disabled>
            Awaiting workspace approval
          </Button>
        </div>
      </div>

      <CreateOrganizationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        pending={createOrg.isPending}
        onCreate={(name) => {
          createOrg.mutate(name, {
            onSuccess: (org) => {
              setModalOpen(false);
              navigate(`/orgs/${org.id}/projects`);
            },
          });
        }}
      />
    </main>
  );
}
