import express from 'express';
import { InterestController } from '../controllers/interest.controller';
import authMiddleware from '../middleware/auth.middleware';
import { requireAnyRole } from '../middleware/rbac.middleware';
import { rateLimiter, strictRateLimiter } from '../middleware/rate-limiter.middleware';

const router = express.Router();

// User routes - require authentication
router.get('/history', authMiddleware.authenticateToken, rateLimiter, InterestController.getInterestHistory);
router.get('/yearly', authMiddleware.authenticateToken, rateLimiter, InterestController.getYearlyInterest);
router.get('/rates', authMiddleware.authenticateToken, rateLimiter, InterestController.getCurrentRates);

// Admin routes - require admin role
router.get('/calculate/:accountId', 
  authMiddleware.authenticateToken, 
  requireAnyRole(['ADMIN', 'SUPER_ADMIN']), 
  rateLimiter, 
  InterestController.calculateAccountInterest
);

router.get('/calculate-all', 
  authMiddleware.authenticateToken, 
  requireAnyRole(['ADMIN', 'SUPER_ADMIN']), 
  strictRateLimiter, 
  InterestController.calculateAllInterest
);

router.post('/post/:accountId', 
  authMiddleware.authenticateToken, 
  requireAnyRole(['ADMIN', 'SUPER_ADMIN']), 
  strictRateLimiter, 
  InterestController.postAccountInterest
);

router.post('/initialize-rates', 
  authMiddleware.authenticateToken, 
  requireAnyRole(['ADMIN', 'SUPER_ADMIN']), 
  strictRateLimiter, 
  InterestController.initializeRates
);

export default router;
