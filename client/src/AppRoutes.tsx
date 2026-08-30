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
import { NotFoundPage } from "./pages/NotFoundPage";
import { useSession } from "./stores/sessionStore";
import { useMockData } from "./stores/mockDataStore";

function RootRedirect() {
  const firstOrg = useMockData((s) => s.orgs[0]);
  return <Navigate to={firstOrg ? `/orgs/${firstOrg.id}/projects` : "/welcome"} replace />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSession((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
