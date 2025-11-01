import { Router } from 'express';
import { VanityController } from '../controllers/vanity.controller';
import authMiddleware from '../middleware/auth.middleware';
import { rateLimiter, strictRateLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

// Suggest numbers (public or limited)
router.get('/suggest', rateLimiter, VanityController.suggest);

// Get price for a number
router.get('/price', rateLimiter, VanityController.price);

// Market & availability
router.get('/market', rateLimiter, VanityController.market);
router.get('/availability/:number', rateLimiter, VanityController.availability);

// Purchase/change account number (requires auth)
router.post('/purchase', authMiddleware.authenticateToken, strictRateLimiter, VanityController.purchase);

// Admin inventory management
router.post('/admin/numbers', authMiddleware.authenticateToken, strictRateLimiter, VanityController.adminAdd);
router.get('/admin/numbers', authMiddleware.authenticateToken, rateLimiter, VanityController.adminList);
router.put('/admin/numbers/:id', authMiddleware.authenticateToken, strictRateLimiter, VanityController.adminUpdate);
router.delete('/admin/numbers/:id', authMiddleware.authenticateToken, strictRateLimiter, VanityController.adminDelete);

export default router;


