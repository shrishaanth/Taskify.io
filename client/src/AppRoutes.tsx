import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./pages/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { WelcomePage } from "./pages/WelcomePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectPage } from "./pages/ProjectPage";
import { BoardPage } from "./pages/BoardPage";
import { OrgMembersPage } from "./pages/OrgMembersPage";
import { OrgSettingsPage } from "./pages/OrgSettingsPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Spinner } from "./components/primitives/Spinner/Spinner";
import { useSession } from "./stores/sessionStore";

function FullPageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Spinner size="lg" label="Loading Taskify" />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const status = useSession((s) => s.status);
  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const status = useSession((s) => s.status);
  const session = useSession((s) => s.session);
  if (status === "loading") return <FullPageLoader />;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  const firstOrg = session?.orgs[0];
  return (
    <Navigate to={firstOrg ? `/orgs/${firstOrg.id}/projects` : "/welcome"} replace />
  );
}

export function AppRoutes() {
  const bootstrap = useSession((s) => s.bootstrap);
  const status = useSession((s) => s.status);

  useEffect(() => {
    if (status === "loading") void bootstrap();
  }, [status, bootstrap]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/invite/:token" element={<AcceptInvitePage />} />
      <Route
        path="/welcome"
        element={
          <RequireAuth>
            <WelcomePage />
          </RequireAuth>
        }
      />
      <Route path="/" element={<RootRedirect />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/orgs/:orgId" element={<Navigate to="projects" replace />} />
        <Route path="/orgs/:orgId/projects" element={<ProjectsPage />} />
        <Route path="/orgs/:orgId/members" element={<OrgMembersPage />} />
        <Route path="/orgs/:orgId/settings" element={<OrgSettingsPage />} />
        <Route
          path="/orgs/:orgId/projects/:projectId"
          element={<ProjectPage tab="boards" />}
        />
        <Route
          path="/orgs/:orgId/projects/:projectId/members"
          element={<ProjectPage tab="members" />}
        />
        <Route
          path="/orgs/:orgId/projects/:projectId/boards/:boardId"
          element={<BoardPage />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
