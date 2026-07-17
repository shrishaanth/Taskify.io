import { Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import { UserModel } from "../models/user.model";
import { emitUserChanged, emitUserDeleted, emitNotification } from "../realtime/socket";
import { recordActivity } from "../services/activity";
import { cacheDelPrefix } from "../services/redis";

async function actorName(userId: string): Promise<string> {
  const u = await UserModel.findById(userId).select("name").lean();
  return u?.name || "Someone";
}

function toPublicUser(doc: any) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
    createdAt: doc.createdAt,
  };
}

// ── Admin: user / member management ────────────────────────────────────────
// Members can never create accounts — only an Admin can, from here.

export async function listUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const users = await UserModel.find().select("-passwordHash").sort({ createdAt: 1 }).lean();
    res.json(users.map(toPublicUser));
  } catch (error) { next(error); }
}

export async function createMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, password, role = "member" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (role !== "admin" && role !== "member") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ name, email: normalizedEmail, passwordHash, role });

    emitUserChanged();
    void cacheDelPrefix("stats:");
    void recordActivity({
      action: "user.created",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      targetUserId: user._id.toString(),
      detail: `created ${role} account for ${name}`,
    });

    res.status(201).json(toPublicUser(user));
  } catch (error) { next(error); }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "User not found" });

    const { name, role, avatarUrl } = req.body;
    if (role !== undefined && role !== "admin" && role !== "member") {
      return res.status(400).json({ message: "Invalid role" });
    }

    // An admin may not demote themself if they're the only admin left —
    // otherwise nobody would be left with Admin privileges.
    if (id === req.user!.userId && role === "member") {
      const adminCount = await UserModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "You are the only Admin — promote someone else first." });
      }
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (role !== undefined) update.role = role;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const user = await UserModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    emitUserChanged(id);
    if (role !== undefined && id !== req.user!.userId) {
      emitNotification(id, `Your role was changed to ${role}`, "warning");
    }
    void recordActivity({
      action: "user.updated",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      targetUserId: id,
      detail: role !== undefined ? `updated profile / role -> ${role}` : "updated profile",
    });

    res.json(toPublicUser(user));
  } catch (error) { next(error); }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "User not found" });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.findByIdAndUpdate(id, { passwordHash }, { new: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Password reset" });
  } catch (error) { next(error); }
}

export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(404).json({ message: "User not found" });

    if (id === req.user!.userId) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const target = await UserModel.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.role === "admin") {
      const adminCount = await UserModel.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the only remaining Admin" });
      }
    }

    await UserModel.findByIdAndDelete(id);

    // Their live sessions get logged out immediately; admins refresh the
    // directory. requireAuth re-checks the DB anyway, so even a missed
    // socket event can't leave them with working API access.
    emitUserDeleted(id);
    emitUserChanged();
    void cacheDelPrefix("stats:");
    void recordActivity({
      action: "user.deleted",
      actorId: req.user!.userId,
      actorName: await actorName(req.user!.userId),
      targetUserId: null,
      detail: `deleted account of ${target.name}`,
    });

    res.status(204).end();
  } catch (error) { next(error); }
}

// ── Self-service profile (any authenticated user) ──────────────────────────

export async function updateOwnProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, avatarUrl } = req.body;
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const user = await UserModel.findByIdAndUpdate(req.user!.userId, update, { new: true, runValidators: true }).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Admins see the new name in the directory / on task cards right away.
    emitUserChanged();

    res.json(toPublicUser(user));
  } catch (error) { next(error); }
}

export async function changeOwnPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await UserModel.findById(req.user!.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Password updated" });
  } catch (error) { next(error); }
}
