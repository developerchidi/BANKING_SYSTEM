import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { loadUserRoles, requirePermission } from '../middleware/rbac.middleware';
import { UserController } from '../controllers/user.controller';
import { AdminController } from '../controllers/admin.controller';
import AdminTransactionsController from '../controllers/admin-transactions.controller';

const router = Router();
const prisma = new PrismaClient();

// Apply authentication and role loading to all routes
router.use(authenticateToken, loadUserRoles);

// Dashboard Stats
router.get('/stats', requirePermission('user:read'), AdminController.getStats);

// Update user account tier
router.put('/users/:userId/tier', requirePermission('user:write'), AdminController.updateUserTier);

// Recent Activities
router.get('/activities', requirePermission('audit:read'), AdminController.getActivities);

// KYC Requests
router.get('/kyc-requests', requirePermission('user:read'), AdminController.getKycRequests);

// KYC Admin Endpoints
router.post('/kyc/:userId/approve', requirePermission('kyc:approve'), AdminController.approveKyc);

router.post('/kyc/:userId/reject', requirePermission('kyc:approve'), AdminController.rejectKyc);

router.get('/kyc/:userId/documents', requirePermission('kyc:read'), AdminController.getKycDocuments);

// System Health
router.get('/health', AdminController.getHealth);

// =============================
// Users CRUD (Admin)
// =============================

// GET /api/admin/users - paginated list with search
router.get('/users', requirePermission('user:read'), UserController.getUsers);

// GET /api/admin/users/:id
router.get('/users/:id', requirePermission('user:read'), UserController.adminGetUserById);

// POST /api/admin/users
router.post('/users', requirePermission('user:write'), UserController.adminCreateUser);

// PUT /api/admin/users/:id
router.put('/users/:id', requirePermission('user:write'), UserController.adminUpdateUser);

// PUT /api/admin/users/:id/profile (update extended profile)
router.put('/users/:id/profile', requirePermission('user:write'), UserController.adminUpdateUserProfile);

// DELETE /api/admin/users/:id (soft-delete -> deactivate)
router.delete('/users/:id', requirePermission('user:delete'), UserController.adminDeleteUser);
// Tier upgrade management routes
router.get('/tier-upgrade-requests', requirePermission('user:read'), AdminController.getTierUpgradeRequests);
router.post('/tier-upgrade-requests/:requestId/approve', requirePermission('user:write'), AdminController.approveTierUpgradeRequest);
router.post('/tier-upgrade-requests/:requestId/reject', requirePermission('user:write'), AdminController.rejectTierUpgradeRequest);

// Admin Top-up: level guard via permission 'transaction:write' or equivalent policy
router.post(
  '/transactions/topup',
  requirePermission('transaction:write'),
  AdminTransactionsController.topUp,
);

// Notifications (Admin - view all)
router.get('/notifications', requirePermission('user:read'), AdminController.getAllNotifications);

export default router;
