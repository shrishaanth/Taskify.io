import { useState } from "react";
import KanbanBoard from "./KanbanBoard";
import { Plus } from "lucide-react";
import { useAppState, type UITask } from "../Context/AppContext";
import { useAuth } from "../Context/AuthContext";
import { CreateTaskDialog, type TaskData } from "./CreateTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import TaskDetailDialog from "./TaskDetailDialog";

/**
 * The task board. An Admin sees every task with full create/edit/assign/
 * delete controls. A Member sees only tasks assigned to them (the server
 * already filters the list) and can only drag cards between columns to
 * update status, or open a read-only detail view — never edit, delete, or
 * reassign, matching "Member: view assigned tasks, update status only".
 */
const TaskBoard = () => {
  const { user } = useAuth();
  const { tasks, members, addTask, updateTask, deleteTask, moveTask, isLoading } = useAppState();
  const isAdmin = user?.role === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState<UITask | null>(null);
  const [viewTask, setViewTask] = useState<UITask | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm">Loading tasks...</div>
      </div>
    );
  }

  const handleCreate = async (data: TaskData) => {
    const member = members.find((m) => m.name === data.assignee);
    await addTask({
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedTo: member?.id || null,
      dueDate: data.dueDate || null,
    });
  };

  const handleSave = async (data: TaskData) => {
    if (!editTask) return;
    const member = members.find((m) => m.name === data.assignee);
    await updateTask(editTask.id, {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedTo: member?.id || null,
      dueDate: data.dueDate || null,
    });
    setEditTask(null);
  };

  const handleDelete = async () => {
    if (!editTask) return;
    await deleteTask(editTask.id);
    setEditTask(null);
  };

  const taskToDialogData = (task: UITask): TaskData => ({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee?.name || "Unassigned",
    dueDate: task.dueDate || "",
  });

  return (
    <div>
      {isAdmin && (
        <div className="flex justify-end mb-2">
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Task
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          {isAdmin ? "No tasks yet — create one to get started." : "No tasks have been assigned to you yet."}
        </div>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onMoveTask={moveTask}
          onTaskClick={(t) => (isAdmin ? setEditTask(t) : setViewTask(t))}
        />
      )}

      {isAdmin && (
        <>
          <CreateTaskDialog
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            onCreate={handleCreate}
            members={members.map((m) => m.name)}
          />

          <EditTaskDialog
            isOpen={!!editTask}
            onClose={() => setEditTask(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            task={editTask ? taskToDialogData(editTask) : null}
            members={members.map((m) => m.name)}
          />
        </>
      )}

      {!isAdmin && <TaskDetailDialog task={viewTask} onClose={() => setViewTask(null)} />}
    </div>
  );
};

export default TaskBoard;
