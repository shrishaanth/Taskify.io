import { TaskModel } from "../models/task.model";
import { emitNotification } from "../realtime/socket";
import { acquireJobLock } from "../services/redis";

const INTERVAL_MS = 60 * 60 * 1000; // hourly
const LOCK_TTL_S = 55 * 60; // slightly under the interval

/**
 * Hourly sweep that nudges assignees about tasks due within 24 hours.
 * In a multi-instance deployment every instance wakes up, but the Redis
 * lock ensures only ONE of them actually runs the sweep per hour — the
 * classic "scheduled jobs vs horizontal scaling" problem.
 *
 * Notifications are best-effort pushes to whoever is online; the dashboard
 * "due soon" stat remains the durable source of truth.
 */
async function sweep(): Promise<void> {
  const gotLock = await acquireJobLock("due-soon-sweep", LOCK_TTL_S);
  if (!gotLock) return;

  const now = new Date();
  const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await TaskModel.find({
    status: { $ne: "Done" },
    assignedTo: { $ne: null },
    dueDate: { $gte: now, $lte: inOneDay },
  })
    .select("title assignedTo dueDate")
    .lean();

  for (const task of tasks) {
    emitNotification(
      task.assignedTo!.toString(),
      `"${task.title}" is due within 24 hours`,
      "warning"
    );
  }
  if (tasks.length) console.log(`Due-soon sweep: notified ${tasks.length} task(s)`);
}

export function startDueSoonJob(): NodeJS.Timeout {
  // First run shortly after boot so a fresh deployment still reminds people.
  setTimeout(() => void sweep().catch((e) => console.error("Due-soon sweep failed:", e)), 30_000);
  return setInterval(
    () => void sweep().catch((e) => console.error("Due-soon sweep failed:", e)),
    INTERVAL_MS
  );
}
