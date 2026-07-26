import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { Permissions, createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema, updateMemberRoleSchema } from '@taskify/shared';
import * as wsController from './workspace.controller';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// ── Workspace CRUD ────────────────────────────────────────────
router.post('/',
  requirePermission({ permission: Permissions.WORKSPACE_CREATE, scopes: [{ type: 'organization', param: 'orgId' }] }),
  validate(createWorkspaceSchema),
  wsController.create,
);
router.get('/', wsController.list);
router.get('/:workspaceId', wsController.getById);
router.patch('/:workspaceId',
  requirePermission({ permission: Permissions.WORKSPACE_EDIT, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  validate(updateWorkspaceSchema),
  wsController.update,
);
router.delete('/:workspaceId',
  requirePermission({ permission: Permissions.WORKSPACE_DELETE, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  wsController.remove,
);

// ── Members ───────────────────────────────────────────────────
router.get('/:workspaceId/members',
  requirePermission({ permission: Permissions.MEMBERS_VIEW, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  wsController.listMembers,
);
router.post('/:workspaceId/members',
  requirePermission({ permission: Permissions.MEMBERS_INVITE, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  validate(addMemberSchema),
  wsController.addMember,
);
router.patch('/:workspaceId/members/:userId',
  requirePermission({ permission: Permissions.MEMBERS_ROLE, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  validate(updateMemberRoleSchema),
  wsController.updateMemberRole,
);
router.delete('/:workspaceId/members/:userId',
  requirePermission({ permission: Permissions.MEMBERS_REMOVE, scopes: [
    { type: 'workspace', param: 'workspaceId' },
    { type: 'organization', param: 'orgId' },
  ]}),
  wsController.removeMember,
);

export default router;
