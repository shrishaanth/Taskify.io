import { Calendar, Flag, X } from "lucide-react";
import type { UITask } from "../Context/AppContext";

interface TaskDetailDialogProps {
  task: UITask | null;
  onClose: () => void;
}

/**
 * Read-only task view for Members: they can see full details of a task
 * assigned to them, but every field here is display-only — editing,
 * reassigning, and deleting all require the Admin-only dialogs instead.
 */
const TaskDetailDialog = ({ task, onClose }: TaskDetailDialogProps) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5">
        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            {task.description && (
              <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{task.description}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-300">
              {task.status}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-300">
              <Flag className="h-3 w-3" /> {task.priority}
            </span>
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-1 font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Drag this card between columns on the board to update its status.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailDialog;
