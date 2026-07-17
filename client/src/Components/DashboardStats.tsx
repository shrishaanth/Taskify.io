import { useEffect, useRef, useState } from "react";
import { CheckCircle, Clock, ListTodo, Users as UsersIcon, AlarmClock } from "lucide-react";
import { tasksApi, type AdminStats, type MemberStats, type ApiTask } from "../api/tasks";
import { useAuth } from "../Context/AuthContext";
import { useSocket } from "../Context/SocketContext";
import { Link } from "react-router-dom";

const StatCard = ({ icon, bg, value, label }: { icon: React.ReactNode; bg: string; value: number; label: string }) => (
  <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-colors">
    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg}`}>{icon}</div>
    <div>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </div>
);

const RecentTaskRow = ({ task }: { task: ApiTask }) => (
  <div className="flex items-center justify-between py-3 px-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div className="min-w-0">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{task.priority} priority</p>
    </div>
    <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
      {task.status}
    </span>
  </div>
);

/**
 * Role-aware dashboard. An Admin sees system-wide numbers (total users,
 * total/completed/pending tasks) plus recent activity. A Member sees ONLY
 * their own numbers (completed / pending / due soon) — never anyone else's
 * tasks, matching "Never show every user's tasks".
 */
const DashboardStats = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState<AdminStats | MemberStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    tasksApi.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  // Live numbers: any task/user event we're entitled to see means the
  // stats may have changed. Debounced so a burst of events (e.g. an admin
  // bulk-editing) causes one refetch, not one per event.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        tasksApi.stats().then(setStats).catch(() => { /* keep last numbers */ });
      }, 400);
    };
    socket.on("task:upsert", refresh);
    socket.on("task:removed", refresh);
    socket.on("user:changed", refresh);
    return () => {
      socket.off("task:upsert", refresh);
      socket.off("task:removed", refresh);
      socket.off("user:changed", refresh);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [socket]);

  if (isLoading) return <div className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard...</div>;
  if (error) return <div className="text-sm text-red-600 dark:text-red-400">{error}</div>;
  if (!stats) return null;

  if (isAdmin) {
    const s = stats as AdminStats;
    return (
      <div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
          <StatCard icon={<UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />} bg="bg-blue-100 dark:bg-blue-900/40" value={s.totalUsers} label="Total Users" />
          <StatCard icon={<ListTodo className="h-5 w-5 text-purple-600 dark:text-purple-400" />} bg="bg-purple-100 dark:bg-purple-900/40" value={s.totalTasks} label="Total Tasks" />
          <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />} bg="bg-green-100 dark:bg-green-900/40" value={s.completedTasks} label="Completed Tasks" />
          <StatCard icon={<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />} bg="bg-yellow-100 dark:bg-yellow-900/40" value={s.pendingTasks} label="Pending Tasks" />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Recent Tasks</h2>
            <Link to="/tasks" className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">View all</Link>
          </div>
          {s.recentTasks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No tasks created yet.</p>
          ) : (
            <div>{s.recentTasks.map((t) => <RecentTaskRow key={t.id} task={t} />)}</div>
          )}
        </div>
      </div>
    );
  }

  const s = stats as MemberStats;
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />} bg="bg-green-100 dark:bg-green-900/40" value={s.completed} label="Completed" />
        <StatCard icon={<Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />} bg="bg-yellow-100 dark:bg-yellow-900/40" value={s.pending} label="Pending" />
        <StatCard icon={<AlarmClock className="h-5 w-5 text-red-600 dark:text-red-400" />} bg="bg-red-100 dark:bg-red-900/40" value={s.dueSoon} label="Due Soon" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Head over to <Link to="/tasks" className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">My Tasks</Link> to see what's assigned to you.
        </p>
      </div>
    </div>
  );
};

export default DashboardStats;
