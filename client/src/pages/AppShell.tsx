import { Outlet, useNavigate, useParams } from "react-router-dom";
import { TopNavBar } from "../components/composites/TopNavBar/TopNavBar";
import {
  useNotifications,
  useMarkAllNotificationsRead,
} from "../features/notifications";
import { useAppRealtime } from "../features/realtime";
import { useSession } from "../stores/sessionStore";

/** Authenticated layout: top nav + routed page content. */
export function AppShell() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);

  const notificationsQuery = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  useAppRealtime();

  const orgs = session?.orgs ?? [];
  const currentOrgId = orgId ?? orgs[0]?.id ?? "";

  if (!session) return null;

  return (
    <div>
      <TopNavBar
        orgs={orgs}
        currentOrgId={currentOrgId}
        onSwitchOrg={(id) => navigate(`/orgs/${id}/projects`)}
        onLogoClick={() => navigate("/")}
        onCreateOrg={() => navigate("/welcome")}
        onOpenOrgMembers={() => navigate(`/orgs/${currentOrgId}/members`)}
        onOpenOrgSettings={() => navigate(`/orgs/${currentOrgId}/settings`)}
        notifications={notificationsQuery.items}
        notificationUnreadCount={notificationsQuery.unreadCount}
        notificationsHasMore={notificationsQuery.hasNextPage}
        loadingMoreNotifications={notificationsQuery.isFetchingNextPage}
        onLoadMoreNotifications={() => void notificationsQuery.fetchNextPage()}
        onMarkAllNotificationsRead={() => markAllRead.mutate()}
        user={session.user}
        onLogout={() => {
          void signOut().then(() => navigate("/login"));
        }}
      />
      <Outlet />
    </div>
  );
}
