import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';
import * as orgService from './org.service';
import * as membershipService from '../memberships/membership.service';

// ── Org CRUD ──────────────────────────────────────────────────

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const org = await orgService.createOrg(req.body, req.user!.userId);
    res.status(201).json(org);
  } catch (error) {
    next(error);
  }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const orgs = await orgService.listOrgs(req.user!.userId);
    res.json(orgs);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getOrg(req.params.orgId);
    if (!org) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function getBySlug(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const org = await orgService.getOrgBySlug(req.params.slug);
    if (!org) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const org = await orgService.updateOrg(req.params.orgId, req.body);
    if (!org) {
      res.status(404).json({ message: 'Organization not found' });
      return;
    }
    res.json(org);
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const deleted = await orgService.deleteOrg(req.params.orgId);
    if (!deleted) {
      res.status(404).json({ message: 'Organization not found' });
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
    const members = await membershipService.listMembers('organization', req.params.orgId);
    res.json(members);
  } catch (error) {
    next(error);
  }
}

export async function addMember(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const member = await membershipService.addMember(
      'organization',
      req.params.orgId,
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
      'organization',
      req.params.orgId,
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
      'organization',
      req.params.orgId,
      req.params.userId,
      req.user!.userId,
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
