import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User as UserIcon, Users, CheckSquare, LogOut } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useSocket } from "../Context/SocketContext";
import ThemeToggle from "./ThemeToggle";

const cls = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const isAdmin = user?.role === "admin";

  // Navigation differs by role, per the simplified two-role design:
  // Admin: Dashboard, Users, Tasks, Profile.
  // Member: Dashboard, My Tasks, Profile.
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    ...(isAdmin ? [{ icon: Users, label: "Users", path: "/users" }] : []),
    { icon: CheckSquare, label: isAdmin ? "Tasks" : "My Tasks", path: "/tasks" },
    { icon: UserIcon, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="flex h-screen w-[260px] flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 transition-colors">
      <div className="flex h-14 items-center gap-3 px-4 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white text-sm font-semibold">
          T
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Taskify</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link key={item.path} to={item.path}
              className={cls(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                active ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
              )}>
              <item.icon className="h-[18px] w-[18px] stroke-[2]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* Real-time connection status. Green = live socket, updates stream in
          instantly; gray = offline, data refreshes on reconnect. */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2">
          <span className={`relative flex h-2 w-2 ${connected ? "" : "opacity-60"}`}>
            {connected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
          </span>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {connected ? "Live — updates in real time" : "Offline — reconnecting…"}
          </span>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 p-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate capitalize">{user?.role}</p>
          </div>
          <button onClick={() => { logout(); navigate("/login"); }}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Sign out">
            <LogOut className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
