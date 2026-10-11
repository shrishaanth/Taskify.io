import { Outlet, useNavigate, useParams } from "react-router-dom";
import { TopNavBar } from "../components/composites/TopNavBar/TopNavBar";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../features/notifications";
import { notificationHref } from "../lib/notificationLink";
import { useAppRealtime } from "../features/realtime";
import { useSession } from "../stores/sessionStore";

export function AppShell() {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const session = useSession((s) => s.session);
  const signOut = useSession((s) => s.signOut);

  const notificationsQuery = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
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
        onNotificationClick={(id) => {
          const item = notificationsQuery.items.find((n) => n.id === id);
          if (!item) return;
          if (!item.read) markRead.mutate(id);
          const href = notificationHref(item);
          if (href) navigate(href);
        }}
        user={session.user}
        onProfile={() => navigate("/account")}
        onLogout={() => {
          void signOut().then(() => navigate("/login"));
        }}
      />
      <Outlet />
    </div>
  );
}
