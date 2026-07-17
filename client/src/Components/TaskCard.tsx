import { Calendar } from "lucide-react";
import type { UITask } from "../Context/AppContext";

interface TaskCardProps {
  task: UITask;
  onClick?: () => void;
}

const priorityStyles: Record<string, string> = {
  Low: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400",
  Medium: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400",
  High: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
};

const TaskCard = ({ task, onClick }: TaskCardProps) => {
  const initials = task.assignee?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{task.title}</p>
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${priorityStyles[task.priority] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
      {task.assignee && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
            {initials}
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">{task.assignee.name}</span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
