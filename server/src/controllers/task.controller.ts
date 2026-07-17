import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import { TaskModel } from "../models/task.model";
import { UserModel } from "../models/user.model";
import { emitTaskUpsert, emitTaskRemoved, emitNotification } from "../realtime/socket";
import { recordActivity } from "../services/activity";
import { cacheGet, cacheSet, cacheDelPrefix } from "../services/redis";

function toPublicTask(doc: any) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    status: doc.status,
    priority: doc.priority,
    assignedTo: doc.assignedTo ? doc.assignedTo.toString() : null,
    createdBy: doc.createdBy.toString(),
    dueDate: doc.dueDate,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function actorName(userId: string): Promise<string> {
  const u = await UserModel.findById(userId).select("name").lean();
  return u?.name || "Someone";
}

/** Any task mutation invalidates cached dashboard stats for everyone. */
function invalidateStatsCache(): void {
  void cacheDelPrefix("stats:");
}

/**
 * Admin sees every task. A Member sees ONLY tasks assigned to them — the
 * query itself is scoped by assignedTo, so there is no code path where a
 * member's request can return someone else's tasks.
 */
export async function listTasks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter = req.user!.role === "admin" ? {} : { assignedTo: req.user!.userId };
    const tasks = await TaskModel.find(filter).sort({ createdAt: -1 }).lean();
    res.json(tasks.map(toPublicTask));
  } catch (error) { next(error); }
}

export async function getTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "Task not found" });

    const task = await TaskModel.findById(id).lean();
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwnTask = task.assignedTo && task.assignedTo.toString() === req.user!.userId;
    if (req.user!.role !== "admin" && !isOwnTask) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(toPublicTask(task));
  } catch (error) { next(error); }
}

/** Only an Admin can create (and therefore assign) tasks. */
export async function createTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    if (!title) return res.status(400).json({ message: "title is required" });

    if (assignedTo) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: "Invalid assignee" });
      }
      const assignee = await UserModel.findById(assignedTo).lean();
      if (!assignee) return res.status(404).json({ message: "Assignee not found" });
    }

    const task = await TaskModel.create({
      title,
      description: description || "",
      status: status || "Todo",
      priority: priority || "Medium",
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      createdBy: req.user!.userId,
    });

    const publicTask = toPublicTask(task);
    emitTaskUpsert(publicTask);
    if (publicTask.assignedTo && publicTask.assignedTo !== req.user!.userId) {
      emitNotification(publicTask.assignedTo, `New task assigned to you: "${task.title}"`, "info");
    }
    invalidateStatsCache();
    void recordActivity({
      action: "task.created",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      taskId: publicTask.id,
      taskTitle: task.title,
      targetUserId: publicTask.assignedTo,
      detail: publicTask.assignedTo ? "created and assigned" : "created",
    });

    res.status(201).json(publicTask);
  } catch (error) { next(error); }
}

/** Full edit (title/description/priority/assignee/dueDate/status) — Admin only. */
export async function updateTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "Task not found" });

    const { title, description, status, priority, assignedTo, dueDate } = req.body;

    if (assignedTo !== undefined && assignedTo !== null) {
      if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
        return res.status(400).json({ message: "Invalid assignee" });
      }
      const assignee = await UserModel.findById(assignedTo).lean();
      if (!assignee) return res.status(404).json({ message: "Assignee not found" });
    }

    const before = await TaskModel.findById(id).lean();
    if (!before) return res.status(404).json({ message: "Task not found" });
    const previousAssignee = before.assignedTo ? before.assignedTo.toString() : null;

    const update: Record<string, unknown> = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (priority !== undefined) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (dueDate !== undefined) update.dueDate = dueDate;

    const task = await TaskModel.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const publicTask = toPublicTask(task);
    emitTaskUpsert(publicTask, previousAssignee);
    if (publicTask.assignedTo && publicTask.assignedTo !== previousAssignee && publicTask.assignedTo !== req.user!.userId) {
      emitNotification(publicTask.assignedTo, `New task assigned to you: "${task.title}"`, "info");
    }
    invalidateStatsCache();
    void recordActivity({
      action: "task.updated",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      taskId: publicTask.id,
      taskTitle: task.title,
      targetUserId: publicTask.assignedTo,
      detail: publicTask.assignedTo !== previousAssignee ? "updated and reassigned" : "updated",
    });

    res.json(publicTask);
  } catch (error) { next(error); }
}

/**
 * A Member's ONLY write privilege: moving their own assigned task between
 * statuses. Nothing else about the task (title, priority, assignee, due
 * date) can change through this endpoint, and it 403s on any task that
 * isn't assigned to the caller.
 */
export async function updateOwnTaskStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "Task not found" });
    if (!["Todo", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const task = await TaskModel.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!task.assignedTo || task.assignedTo.toString() !== req.user!.userId) {
      return res.status(403).json({ message: "You can only update tasks assigned to you" });
    }

    task.status = status;
    await task.save();

    const publicTask = toPublicTask(task);
    emitTaskUpsert(publicTask);
    invalidateStatsCache();
    void recordActivity({
      action: "task.status",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      taskId: publicTask.id,
      taskTitle: task.title,
      targetUserId: publicTask.assignedTo,
      detail: `moved to ${status}`,
    });

    res.json(publicTask);
  } catch (error) { next(error); }
}

/** Admin only — members can never delete a task. */
export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "Task not found" });
    const deleted = await TaskModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Task not found" });

    const assignedTo = deleted.assignedTo ? deleted.assignedTo.toString() : null;
    emitTaskRemoved(id, assignedTo);
    invalidateStatsCache();
    void recordActivity({
      action: "task.deleted",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      taskId: id,
      taskTitle: deleted.title,
      targetUserId: assignedTo,
      detail: "deleted",
    });

    res.status(204).end();
  } catch (error) { next(error); }
}

/**
 * Role-aware dashboard stats. Admin gets system-wide numbers; a Member
 * gets numbers about their own tasks only — never a peek at anyone else's.
 * Cached in Redis for a few seconds: the dashboard is the hottest read in
 * the app, and every mutation both invalidates the cache and pushes a
 * socket event, so staleness is bounded and invisible in practice.
 */
export async function getStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cacheKey = req.user!.role === "admin" ? "stats:admin" : `stats:member:${req.user!.userId}`;
    const cached = await cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) return res.json(cached);

    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 3);

    if (req.user!.role === "admin") {
      const [totalUsers, totalTasks, completedTasks, pendingTasks, recentTasks] = await Promise.all([
        UserModel.estimatedDocumentCount(),
        TaskModel.estimatedDocumentCount(),
        TaskModel.countDocuments({ status: "Done" }),
        TaskModel.countDocuments({ status: { $ne: "Done" } }),
        TaskModel.find().sort({ createdAt: -1 }).limit(5).lean(),
      ]);
      const payload = {
        totalUsers, totalTasks, completedTasks, pendingTasks,
        recentTasks: recentTasks.map(toPublicTask),
      };
      await cacheSet(cacheKey, payload, 10);
      return res.json(payload);
    }

    const userId = req.user!.userId;
    const [completed, pending, dueSoon] = await Promise.all([
      TaskModel.countDocuments({ assignedTo: userId, status: "Done" }),
      TaskModel.countDocuments({ assignedTo: userId, status: { $ne: "Done" } }),
      TaskModel.countDocuments({
        assignedTo: userId,
        status: { $ne: "Done" },
        dueDate: { $ne: null, $lte: inThreeDays },
      }),
    ]);
    const payload = { completed, pending, dueSoon };
    await cacheSet(cacheKey, payload, 10);
    res.json(payload);
  } catch (error) { next(error); }
}
