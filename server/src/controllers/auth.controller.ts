import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user.model";
import { JwtPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function sign(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET as jwt.Secret, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

function toPublicUser(doc: any) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    avatarUrl: doc.avatarUrl,
  };
}

/**
 * Public registration only ever creates the FIRST user, and that user is
 * always made Admin automatically. Once at least one user exists, this
 * endpoint is closed — nobody can ever again register themselves as
 * "Admin" or "Member". After that point, only an Admin can create Member
 * accounts (see user.controller.ts -> createMember).
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const userCount = await UserModel.estimatedDocumentCount();
    if (userCount > 0) {
      return res.status(403).json({
        message: "Registration is closed. Ask your Admin to create an account for you.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await UserModel.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      name,
      email: normalizedEmail,
      passwordHash,
      role: "admin", // first user only
    });

    res.status(201).json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email/password required" });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = sign({ userId: user._id.toString(), role: user.role });
    res.json({ token, user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;
    const user = await UserModel.findById(userId).select("-passwordHash").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(toPublicUser(user));
  } catch (error) {
    next(error);
  }
}

/** So the login screen can decide whether to show "Register" at all. */
export async function registrationStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userCount = await UserModel.estimatedDocumentCount();
    res.json({ open: userCount === 0 });
  } catch (error) {
    next(error);
  }
}
