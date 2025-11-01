import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { loadUserRoles, requirePermission } from '../middleware/rbac.middleware';
import { RolesController } from '../controllers/roles.controller';

const router = Router();

// Apply authentication and role loading to all routes
router.use(authenticateToken);
router.use(loadUserRoles);

router.get('/', requirePermission('role:manage'), RolesController.list);
router.get('/:id', requirePermission('role:manage'), RolesController.getById);
router.post('/', requirePermission('role:manage'), RolesController.create);
router.put('/:id', requirePermission('role:manage'), RolesController.update);
router.delete('/:id', requirePermission('role:manage'), RolesController.remove);
router.get('/:id/users', requirePermission('user:read'), RolesController.users);

export default router;
