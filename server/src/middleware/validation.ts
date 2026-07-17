import { Request, Response, NextFunction } from "express";
import { TaskStatus, TaskPriority } from "../types";

const VALID_TASK_STATUSES: TaskStatus[] = ["Todo", "In Progress", "Done"];
const VALID_TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High"];

export function validateTaskBody(req: Request, res: Response, next: NextFunction) {
  const { title, status, priority } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ message: "Title is required and must be a string" });
  }
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority" });
  }
  next();
}

export function validateAuthBody(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
}
