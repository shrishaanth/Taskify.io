import { Response, NextFunction } from 'express';
import type { Permission, RoleName, ScopeType } from '@taskify/shared';
import { getPermissionsForRole } from '@taskify/shared';
import { MembershipModel } from '../models';
import { cacheGet, cacheSet } from '../services/redis';
import type { AuthRequest } from './auth';

interface ScopeConfig {
  type: ScopeType;
  /** The express route param that holds this scope's ID */
  param: string;
}

interface PermissionOptions {
  /** The required permission string */
  permission: Permission;
  /** Ordered list of scopes to check, from most to least specific */
  scopes: ScopeConfig[];
  /** Optional: if true, only checks the most specific scope */
  exact?: boolean;
}

interface MembershipRow {
  scopeType: string;
  scopeId: string;
  role: string;
}

/**
 * Permission middleware factory.
 *
 * Example:
 *   router.post('/issues',
 *     requirePermission({
 *       permission: Permissions.ISSUES_CREATE,
 *       scopes: [
 *         { type: 'project', param: 'projectId' },
 *         { type: 'workspace', param: 'workspaceId' },
 *         { type: 'organization', param: 'orgId' },
 *       ],
 *     }),
 *     controller.create,
 *   );
 *
 * Permission resolution:
 *   1. Collect all memberships for the user across the scopes
 *   2. Sort by specificity: project > workspace > organization
 *   3. Use the most specific membership's role
 *   4. Map role -> permission set for that scope level
 *   5. If permission present -> next(), else -> 403
 */
export function requirePermission(options: PermissionOptions) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    // Collect scope IDs from route params
    const scopeIds: Record<string, string> = {};
    for (const scope of options.scopes) {
      const id = req.params[scope.param];
      if (id) scopeIds[scope.type] = id;
    }

    if (Object.keys(scopeIds).length === 0) {
      res.status(500).json({ message: 'Permission check failed: no scope resolved' });
      return;
    }

    try {
      const hasPermission = await checkUserPermission(userId, scopeIds, options);
      if (!hasPermission) {
        res.status(403).json({ message: 'Insufficient permissions' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

async function checkUserPermission(
  userId: string,
  scopeIds: Record<string, string>,
  options: PermissionOptions,
): Promise<boolean> {
  // Build cache key
  const scopeKeys = Object.entries(scopeIds)
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join('|');
  const cacheKey = `perm:${userId}:${scopeKeys}:${options.permission}`;

  // Check cache
  const cached = await cacheGet<boolean>(cacheKey);
  if (cached !== null) return cached;

  // Fetch memberships for all resolved scopes
  const scopeConditions = Object.entries(scopeIds).map(([type, id]) => ({
    scopeType: type as 'organization' | 'workspace' | 'project',
    scopeId: id,
  }));

  const memberships = await MembershipModel.find({
    userId,
    $or: scopeConditions,
  })
    .select('scopeType scopeId role')
    .lean<MembershipRow[]>()
    .exec();

  if (memberships.length === 0) {
    await cacheSet(cacheKey, false, 120);
    return false;
  }

  // Sort by specificity: project > workspace > org
  const priority: Record<string, number> = { project: 3, workspace: 2, organization: 1 };
  memberships.sort((a, b) => (priority[b.scopeType] || 0) - (priority[a.scopeType] || 0));

  // Use the most specific membership's role
  const best = memberships[0];
  if (!best) {
    await cacheSet(cacheKey, false, 120);
    return false;
  }

  const perms = getPermissionsForRole(best.role as RoleName, best.scopeType as ScopeType);
  const result = perms.includes(options.permission);

  await cacheSet(cacheKey, result, 120);
  return result;
}
