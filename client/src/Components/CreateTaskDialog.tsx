import React, { useState, useEffect } from "react";

export interface TaskData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
}

interface CreateTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: TaskData) => void;
  members?: string[];
}

const defaultTask = (): TaskData => ({
  title: "",
  description: "",
  status: "Todo",
  priority: "Medium",
  assignee: "Unassigned",
  dueDate: "",
});

export const CreateTaskDialog: React.FC<CreateTaskDialogProps> = ({
  isOpen, onClose, onCreate, members = [],
}) => {
  const [task, setTask] = useState<TaskData>(defaultTask());
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let enterTimeout: number;
    let exitTimeout: number;
    if (isOpen) {
      setTask(defaultTask());
      setIsRendered(true);
      enterTimeout = window.setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      exitTimeout = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => { clearTimeout(enterTimeout); clearTimeout(exitTimeout); };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(task);
    onClose();
  };

  if (!isRendered) return null;

  const statusOptions = ["Todo", "In Progress", "Done"];
  const priorityOptions = ["Low", "Medium", "High"];
  const assigneeOptions = ["Unassigned", ...members];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className={`absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div className={`relative w-full max-w-lg overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 transform transition-all duration-300 ease-out ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"}`}>
        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Task</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Fill in the details and assign it to a member.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Task Title</label>
              <input type="text" name="title" value={task.title} onChange={handleChange} required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="e.g., Design system audit" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
              <textarea name="description" value={task.description} onChange={handleChange} rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                placeholder="What needs to be done?" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {[
                { id: "status", label: "Status", options: statusOptions },
                { id: "priority", label: "Priority", options: priorityOptions },
                { id: "assignee", label: "Assignee", options: assigneeOptions },
              ].map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{field.label}</label>
                  <select id={field.id} name={field.id} value={(task as any)[field.id]} onChange={handleChange}
                    className="w-full cursor-pointer rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                    {field.options.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Due Date</label>
                <input type="date" name="dueDate" value={task.dueDate} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 pt-6">
            <button type="button" onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
