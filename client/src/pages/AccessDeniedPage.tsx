import { useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { Button } from "../components/primitives/Button/Button";
import styles from "./pages.module.css";

/** Shown when a project exists in the caller's org but they have no
 *  ProjectMembership (403 per FR-2.3 / UC-10 contrast). */
export function AccessDeniedPage() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  return (
    <main className={styles.page}>
      <EmptyState
        tone="red"
        icon={<span aria-hidden="true">🛡️</span>}
        title="You don't have access to this project"
        description="Ask a Project Head to add you as a member or request permissions to view."
        actions={
          <>
            {/* No "request access" endpoint in scope (COMPONENT_INVENTORY §4 C4). */}
            <Button title="Not available yet">Request Access</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/orgs/${orgId}/projects`)}
            >
              Back to Projects
            </Button>
          </>
        }
      />
    </main>
  );
}
