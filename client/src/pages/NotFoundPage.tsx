import { useNavigate } from "react-router-dom";
import { EmptyState } from "../components/composites/EmptyState/EmptyState";
import { Button } from "../components/primitives/Button/Button";
import styles from "./pages.module.css";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className={styles.page}>
      <EmptyState
        tone="slate"
        icon={<span aria-hidden="true">🔍</span>}
        title="Page not found"
        description="The page you're looking for doesn't exist or may have been moved."
        actions={<Button onClick={() => navigate("/")}>Go home</Button>}
      />
    </main>
  );
}
