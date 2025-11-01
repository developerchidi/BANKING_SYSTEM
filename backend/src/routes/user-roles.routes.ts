import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { loadUserRoles, requirePermission } from '../middleware/rbac.middleware';
import { UserRolesController } from '../controllers/user-roles.controller';

const router = Router();

// Apply authentication and role loading to all routes
router.use(authenticateToken);
router.use(loadUserRoles);

router.get('/:userId/roles', requirePermission('user:read'), UserRolesController.getUserRoles);
router.post('/:userId/roles', requirePermission('user:write'), UserRolesController.assignRole);
router.delete('/:userId/roles/:roleId', requirePermission('user:write'), UserRolesController.removeRole);
router.put('/:userId/roles/:roleId', requirePermission('user:write'), UserRolesController.updateUserRole);
router.get('/roles/summary', requirePermission('user:read'), UserRolesController.summary);

export default router;
