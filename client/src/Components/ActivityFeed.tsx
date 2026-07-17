import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity as ActivityIcon, PlusCircle, Pencil, MoveRight, Trash2, UserPlus, UserCog, UserMinus } from "lucide-react";
import { activityApi, type ApiActivity } from "../api/activity";
import { useSocket } from "../Context/SocketContext";

const ACTION_ICONS: Record<ApiActivity["action"], React.ReactNode> = {
  "task.created": <PlusCircle className="h-3.5 w-3.5 text-green-500" />,
  "task.updated": <Pencil className="h-3.5 w-3.5 text-blue-500" />,
  "task.status": <MoveRight className="h-3.5 w-3.5 text-yellow-500" />,
  "task.deleted": <Trash2 className="h-3.5 w-3.5 text-red-500" />,
  "user.created": <UserPlus className="h-3.5 w-3.5 text-green-500" />,
  "user.updated": <UserCog className="h-3.5 w-3.5 text-blue-500" />,
  "user.deleted": <UserMinus className="h-3.5 w-3.5 text-red-500" />,
};

function describe(entry: ApiActivity): string {
  const task = entry.taskTitle ? `"${entry.taskTitle}"` : "a task";
  switch (entry.action) {
    case "task.created": return `${entry.actorName} created ${task}`;
    case "task.updated": return `${entry.actorName} ${entry.detail || "updated"} ${task}`;
    case "task.status": return `${entry.actorName} ${entry.detail || "moved"} — ${task}`;
    case "task.deleted": return `${entry.actorName} deleted ${task}`;
    default: return `${entry.actorName} ${entry.detail}`;
  }
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Live audit trail on the dashboard. Loads the recent history over REST,
 * then prepends new entries as they arrive over the socket — scoped
 * server-side, so a Member's feed only ever mentions their own tasks.
 */
const ActivityFeed = () => {
  const { socket } = useSocket();
  const [entries, setEntries] = useState<ApiActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    activityApi.list()
      .then(setEntries)
      .catch(() => { /* feed is non-critical; leave it empty on error */ })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = ({ entry }: { entry: ApiActivity }) => {
      setEntries((prev) => [entry, ...prev.filter((e) => e.id !== entry.id)].slice(0, 20));
    };
    socket.on("activity:new", onNew);
    return () => { socket.off("activity:new", onNew); };
  }, [socket]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <ActivityIcon className="h-4 w-4 text-gray-400" />
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Activity</h2>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No activity yet.</p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {entries.map((entry) => (
              <motion.li
                key={entry.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 py-1.5"
              >
                <span className="mt-1 shrink-0">{ACTION_ICONS[entry.action]}</span>
                <p className="flex-1 text-[13px] leading-snug text-gray-700 dark:text-gray-300">
                  {describe(entry)}
                </p>
                <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {timeAgo(entry.createdAt)}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};

export default ActivityFeed;
