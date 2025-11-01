import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
// import { requireAdmin } from '../middleware/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

// User APIs
router.get('/profile', authenticateToken, UserController.getProfile);
router.put('/profile', authenticateToken, UserController.updateProfile);
router.post('/kyc', authenticateToken, UserController.submitKyc);
router.post('/documents', authenticateToken, upload.single('file'), UserController.uploadDocument);
router.get('/preferences', authenticateToken, UserController.getPreferences);
router.put('/preferences', authenticateToken, UserController.updatePreferences);
router.post('/link-account', authenticateToken, UserController.linkAccount);
router.post('/deactivate', authenticateToken, UserController.deactivateAccount);
router.post('/change-password', authenticateToken, UserController.changePassword);
router.get('/kyc-status', authenticateToken, UserController.getKycStatus);
router.put('/display-currency', authenticateToken, UserController.updateDisplayCurrency);

// Admin APIs
router.put('/admin/users/:userId/role', /* requireAdmin, */ UserController.updateUserRole);
router.get('/admin/users', /* requireAdmin, */ UserController.searchUsers);
router.get('/admin/users/analytics', /* requireAdmin, */ UserController.userAnalytics);
router.get('/admin/users/:id', /* requireAdmin, */ UserController.adminGetUserById);
router.put('/admin/users/:id/profile', /* requireAdmin, */ UserController.adminUpdateUserProfile);

// Users list for admin panel
router.get('/users', authenticateToken, UserController.getUsers);
router.put('/users/:userId/status', authenticateToken, UserController.updateUserStatus);

// KYC requests for admin panel
router.get('/kyc', authenticateToken, UserController.getKycRequests);

export default router; 