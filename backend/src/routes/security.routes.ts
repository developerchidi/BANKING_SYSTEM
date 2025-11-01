import { Router } from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { SecurityController } from '../controllers/security.controller';
import { strictRateLimiter } from '../middleware/rate-limiter.middleware';

const router = Router();

router.post('/pin/set', authMiddleware.authenticateToken, strictRateLimiter, SecurityController.setPin);
router.post('/pin/verify', authMiddleware.authenticateToken, strictRateLimiter, SecurityController.verifyPin);
router.get('/pin/exists', authMiddleware.authenticateToken, SecurityController.hasPin);

export default router;


