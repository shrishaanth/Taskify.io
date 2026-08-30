import { Outlet, useNavigate, useParams } from "react-router-dom";
import { TopNavBar } from "../components/composites/TopNavBar/TopNavBar";
import { useMockData } from "../stores/mockDataStore";
import { useSession } from "../stores/sessionStore";

/** Authenticated layout: top nav + routed page content. */
export function AppShell() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const signOut = useSession((s) => s.signOut);

  const orgs = useMockData((s) => s.orgs);
  const notifications = useMockData((s) => s.notifications);
  const markAllRead = useMockData((s) => s.markAllNotificationsRead);
  const currentUser = useMockData((s) => s.users[s.currentUserId]);

  const currentOrgId = orgId ?? orgs[0]?.id ?? "";

  return (
    <div>
      <TopNavBar
        orgs={orgs}
        currentOrgId={currentOrgId}
        onSwitchOrg={(id) => navigate(`/orgs/${id}/projects`)}
        onCreateOrg={() => navigate("/welcome")}
        notifications={notifications}
        onMarkAllNotificationsRead={markAllRead}
        user={currentUser}
        onSearch={() => {}}
        onLogout={() => {
          signOut();
          navigate("/login");
        }}
      />
      <Outlet />
    </div>
  );
}
