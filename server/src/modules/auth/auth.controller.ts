import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import * as authService from './auth.service';

export async function register(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    const ip = req.ip;
    const result = await authService.register(name, email, password, ip);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const ip = req.ip;
    const result = await authService.login(email, password, ip);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.user!;
    const user = await authService.getUser(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.user!;
    const { name, avatarUrl } = req.body;
    const user = await authService.updateProfile(userId, { name, avatarUrl });
    res.json(user);
  } catch (error) {
    next(error);
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.user!;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

export async function revokeSessions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { userId } = req.user!;
    await authService.revokeAllSessions(userId);
    res.json({ message: 'All sessions revoked. Please log in again.' });
  } catch (error) {
    next(error);
  }
}
