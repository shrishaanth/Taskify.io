import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";
import { UserModel } from "../models/user.model";

const secret = process.env.JWT_SECRET || "secret";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Verifies the JWT and re-checks the user's current role from the database
 * on every request, so a role change (or account deletion) by an admin
 * takes effect immediately instead of waiting for the token to expire. */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing token" });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    const user = await UserModel.findById(payload.userId).select('role').lean().exec();
    if (!user) return res.status(401).json({ message: "Account no longer exists" });

    req.user = { userId: payload.userId, role: user.role as JwtPayload['role'] };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

/** Gate for Admin-only endpoints (create/edit/delete users, delete tasks,
 * assign tasks to others). Must run after requireAuth. */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin role required" });
  }
  next();
}
