import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import * as wsService from './workspace.service';
import * as membershipService from '../memberships/membership.service';

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ws = await wsService.createWorkspace(req.params.orgId, req.body, req.user!.userId);
    res.status(201).json(ws);
  } catch (error) {
    next(error);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const workspaces = await wsService.listWorkspaces(req.params.orgId);
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ws = await wsService.getWorkspace(req.params.workspaceId);
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    res.json(ws);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const ws = await wsService.updateWorkspace(req.params.workspaceId, req.body);
    if (!ws) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    res.json(ws);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const deleted = await wsService.deleteWorkspace(req.params.workspaceId);
    if (!deleted) {
      res.status(404).json({ message: 'Workspace not found' });
      return;
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

// ── Members ───────────────────────────────────────────────────

export async function listMembers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const members = await membershipService.listMembers('workspace', req.params.workspaceId);
    res.json(members);
  } catch (error) {
    next(error);
  }
}

export async function addMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const member = await membershipService.addMember(
      'workspace',
      req.params.workspaceId,
      req.body.userId,
      req.body.role || 'member',
      req.user!.userId,
    );
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
}

export async function updateMemberRole(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const member = await membershipService.updateMemberRole(
      'workspace',
      req.params.workspaceId,
      req.params.userId,
      req.body.role,
      req.user!.userId,
    );
    res.json(member);
  } catch (error) {
    next(error);
  }
}

export async function removeMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await membershipService.removeMember(
      'workspace',
      req.params.workspaceId,
      req.params.userId,
      req.user!.userId,
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
