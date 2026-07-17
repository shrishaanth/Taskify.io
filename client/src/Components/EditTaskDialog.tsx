import React, { useState, useEffect } from "react";
import type { TaskData } from "./CreateTaskDialog";

interface EditTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskData) => void;
  onDelete: () => void;
  task: TaskData | null;
  members?: string[];
}

export const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  isOpen, onClose, onSave, onDelete, task, members = [],
}) => {
  const [editTask, setEditTask] = useState<TaskData | null>(task);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    let enterTimeout: number;
    let exitTimeout: number;
    if (isOpen) {
      setIsRendered(true);
      setEditTask(task);
      setShowDeleteConfirm(false);
      enterTimeout = window.setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      exitTimeout = window.setTimeout(() => setIsRendered(false), 300);
    }
    return () => { clearTimeout(enterTimeout); clearTimeout(exitTimeout); };
  }, [isOpen, task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editTask) return;
    const { name, value } = e.target;
    setEditTask((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editTask) { onSave(editTask); onClose(); }
  };

  const handleDelete = () => {
    if (showDeleteConfirm) { onDelete(); onClose(); }
    else setShowDeleteConfirm(true);
  };

  if (!isRendered || !editTask) return null;

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
        <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSave} className="p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Title</label>
              <input type="text" name="title" value={editTask.title} onChange={handleChange} required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
              <textarea name="description" value={editTask.description} onChange={handleChange} rows={3}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {[
                { id: "status", label: "Status", options: statusOptions },
                { id: "priority", label: "Priority", options: priorityOptions },
                { id: "assignee", label: "Assignee", options: assigneeOptions },
              ].map((field) => (
                <div key={field.id}>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{field.label}</label>
                  <select id={field.id} name={field.id} value={(editTask as any)[field.id]} onChange={handleChange}
                    className="w-full cursor-pointer rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                    {field.options.map((opt) => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Due Date</label>
                <input type="date" name="dueDate" value={editTask.dueDate} onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-6">
            {!showDeleteConfirm ? (
              <button type="button" onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-red-200/50 hover:bg-red-700 active:scale-[0.98] transition-all">
                Delete
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  Keep
                </button>
                <button type="button" onClick={handleDelete}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.98] transition-all">
                  Confirm Delete
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
