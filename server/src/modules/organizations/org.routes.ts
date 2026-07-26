import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { requirePermission } from '../../middleware/permissions';
import { validate } from '../../middleware/validate';
import { Permissions } from '@taskify/shared';
import { createOrgSchema, updateOrgSchema } from '@taskify/shared';
import { addMemberSchema, updateMemberRoleSchema } from '@taskify/shared';
import * as orgController from './org.controller';

const router = Router();

// All org routes require auth
router.use(requireAuth);

// ── Organization CRUD ─────────────────────────────────────────
router.post('/', validate(createOrgSchema), orgController.create);
router.get('/', orgController.list);
router.get('/by-slug/:slug', orgController.getBySlug);
router.get('/:orgId', orgController.getById);
router.patch('/:orgId',
  requirePermission({ permission: Permissions.ORG_EDIT, scopes: [{ type: 'organization', param: 'orgId' }] }),
  validate(updateOrgSchema),
  orgController.update,
);
router.delete('/:orgId',
  requirePermission({ permission: Permissions.ORG_DELETE, scopes: [{ type: 'organization', param: 'orgId' }] }),
  orgController.remove,
);

// ── Members ───────────────────────────────────────────────────
router.get('/:orgId/members',
  requirePermission({ permission: Permissions.MEMBERS_VIEW, scopes: [{ type: 'organization', param: 'orgId' }] }),
  orgController.listMembers,
);
router.post('/:orgId/members',
  requirePermission({ permission: Permissions.MEMBERS_INVITE, scopes: [{ type: 'organization', param: 'orgId' }] }),
  validate(addMemberSchema),
  orgController.addMember,
);
router.patch('/:orgId/members/:userId',
  requirePermission({ permission: Permissions.MEMBERS_ROLE, scopes: [{ type: 'organization', param: 'orgId' }] }),
  validate(updateMemberRoleSchema),
  orgController.updateMemberRole,
);
router.delete('/:orgId/members/:userId',
  requirePermission({ permission: Permissions.MEMBERS_REMOVE, scopes: [{ type: 'organization', param: 'orgId' }] }),
  orgController.removeMember,
);

export default router;
