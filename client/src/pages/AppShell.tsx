import { Outlet, useNavigate, useParams } from "react-router-dom";
import { TopNavBar } from "../components/composites/TopNavBar/TopNavBar";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "../features/notifications";
import { useSession } from "../stores/sessionStore";

/** Authenticated layout: top nav + routed page content. */
export function AppShell() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);

  const notificationsQuery = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  const orgs = session?.orgs ?? [];
  const currentOrgId = orgId ?? orgs[0]?.id ?? "";
  const notifications = notificationsQuery.data?.items ?? [];

  if (!session) return null;

  return (
    <div>
      <TopNavBar
        orgs={orgs}
        currentOrgId={currentOrgId}
        onSwitchOrg={(id) => navigate(`/orgs/${id}/projects`)}
        onCreateOrg={() => navigate("/welcome")}
        notifications={notifications}
        onMarkAllNotificationsRead={() => markAllRead.mutate()}
        user={session.user}
        onSearch={() => {}}
        onLogout={() => {
          void signOut().then(() => navigate("/login"));
        }}
      />
      <Outlet />
    </div>
  );
}
