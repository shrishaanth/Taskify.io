import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import TaskCard from "./TaskCard";
import { type UITask } from "../Context/AppContext";

export type Status = "Todo" | "In Progress" | "Done";

interface KanbanBoardProps {
  tasks: UITask[];
  onMoveTask: (taskId: string, newStatus: string) => void;
  onTaskClick?: (task: UITask) => void;
}

const STATUSES: Status[] = ["Todo", "In Progress", "Done"];

const STATUS_COLORS: Record<Status, string> = {
  Todo:        "bg-blue-400",
  "In Progress": "bg-yellow-400",
  Done:        "bg-green-400",
};

const KanbanBoard = ({ tasks, onMoveTask, onTaskClick }: KanbanBoardProps) => {
  const [activeTask, setActiveTask] = useState<UITask | null>(null);
  // Optimistic: track in-flight moves so columns update instantly during drag
  const [optimisticTasks, setOptimisticTasks] = useState<UITask[]>(tasks);

  // Keep optimistic state in sync when external tasks change (socket updates)
  if (tasks !== optimisticTasks && !activeTask) {
    setOptimisticTasks(tasks);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = optimisticTasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeTask) return;

    const overId = over.id as string;
    let newStatus: string | undefined;

    if (STATUSES.includes(overId as Status)) {
      newStatus = overId;
    } else {
      const overTask = optimisticTasks.find((t) => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && newStatus !== activeTask.status) {
      setOptimisticTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, status: newStatus as UITask["status"] } : t
        )
      );
      setActiveTask((prev) => prev ? { ...prev, status: newStatus as UITask["status"] } : prev);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      // Dropped outside — revert
      setOptimisticTasks(tasks);
      setActiveTask(null);
      return;
    }

    const activeId = active.id as string;
    const original = tasks.find((t) => t.id === activeId);
    const current = optimisticTasks.find((t) => t.id === activeId);

    if (original && current && current.status !== original.status) {
      onMoveTask(activeId, current.status);
    }

    setActiveTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <LayoutGroup>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-6">
          {STATUSES.map((status) => {
            const columnTasks = optimisticTasks.filter((t) => t.status === status);
            return (
              <Column key={status} status={status} dotColor={STATUS_COLORS[status]} taskCount={columnTasks.length}>
                <SortableContext
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3 min-h-[40px]">
                    <AnimatePresence initial={false}>
                      {columnTasks.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          onClick={onTaskClick}
                          isDragging={activeTask?.id === task.id}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </SortableContext>
              </Column>
            );
          })}
        </div>
      </LayoutGroup>

      <DragOverlay
        dropAnimation={{
          duration: 250,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}
      >
        {activeTask ? (
          <motion.div
            initial={{ rotate: 0, scale: 1 }}
            animate={{ rotate: 2, scale: 1.04 }}
            className="opacity-95 shadow-2xl"
          >
            <TaskCard task={activeTask} />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

const Column = ({
  status,
  dotColor,
  taskCount,
  children,
}: {
  status: Status;
  dotColor: string;
  taskCount: number;
  children: React.ReactNode;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <motion.div
      ref={setNodeRef}
      layout
      animate={{
        backgroundColor: isOver ? "rgb(239 246 255)" : "rgb(249 250 251)",
        boxShadow: isOver
          ? "0 0 0 2px rgb(147 197 253)"
          : "0 0 0 0px transparent",
      }}
      transition={{ duration: 0.15 }}
      className="flex flex-col rounded-xl p-3 min-h-[500px] dark:!bg-gray-800/50 dark:border dark:border-gray-700/50"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
          {status}
        </h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
          {taskCount}
        </span>
      </div>
      {children}
    </motion.div>
  );
};

const SortableTask = ({
  task,
  onClick,
  isDragging,
}: {
  task: UITask;
  onClick?: (task: UITask) => void;
  isDragging: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      layout
      layoutId={task.id}
      style={style}
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{
        opacity: isDragging ? 0.35 : 1,
        y: 0,
        scale: isDragging ? 0.97 : 1,
      }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{
        layout: { type: "spring", stiffness: 400, damping: 30 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.15 },
        y: { duration: 0.15 },
      }}
      {...attributes}
      {...listeners}
    >
      {isDragging ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 h-24" />
      ) : (
        <TaskCard task={task} onClick={() => onClick?.(task)} />
      )}
    </motion.div>
  );
};

export default KanbanBoard;
