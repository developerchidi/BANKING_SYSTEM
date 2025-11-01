import { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { TierController } from '../controllers/tier.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/tier/upgrade-request - Request tier upgrade
router.post(
  '/upgrade-request',
  body('targetTier').isIn(['STANDARD', 'PREMIUM', 'VIP']).withMessage('Invalid target tier'),
  TierController.requestTierUpgrade
);

// GET /api/tier/my-requests - Get user's upgrade requests
router.get('/my-requests', TierController.getMyUpgradeRequests);

// GET /api/tier/requirements - Get tier requirements info
router.get('/requirements', TierController.getTierRequirements);

// POST /api/tier/batch-update-income - Batch update monthly income for all users (Admin only)
router.post('/batch-update-income', TierController.batchUpdateMonthlyIncome);

// GET /api/tier/income-breakdown - Get monthly income breakdown for current user
router.get('/income-breakdown', TierController.getMonthlyIncomeBreakdown);

export default router;

