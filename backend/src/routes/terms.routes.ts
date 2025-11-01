import express, { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { rateLimiter } from '../middleware/rate-limiter.middleware';
import { TermsController } from '../controllers/terms.controller';

const router: Router = express.Router();

// Get user's terms acceptance history (authenticated users)
router.get('/history', authenticateToken, rateLimiter, TermsController.getUserTermsHistory);

// Check if user has accepted latest terms (authenticated users)
router.get('/check', authenticateToken, rateLimiter, TermsController.checkTermsAcceptance);

// Get terms acceptance statistics (Admin only)
router.get('/stats', authenticateToken, rateLimiter, TermsController.getTermsStats);

// Get all terms acceptances (Admin only)
router.get('/all', authenticateToken, rateLimiter, TermsController.getAllTermsAcceptances);

export default router;
