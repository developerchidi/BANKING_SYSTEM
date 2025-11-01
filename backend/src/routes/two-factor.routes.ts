import express from 'express';
import authMiddleware from '../middleware/auth.middleware';
import { rateLimiter, strictRateLimiter } from '../middleware/rate-limiter.middleware';
import { TwoFactorController } from '../controllers/two-factor.controller';

const router = express.Router();

/**
 * @route POST /api/2fa/send-code
 * @desc Send 2FA code to user's email
 * @access Private (requires valid user session)
 */
router.post('/send-code', authMiddleware.authenticateTemporaryToken, strictRateLimiter, TwoFactorController.sendCode);

/**
 * @route POST /api/2fa/verify-code
 * @desc Verify 2FA code
 * @access Private (requires valid user session)
 */
router.post('/verify-code', authMiddleware.authenticateTemporaryToken, strictRateLimiter, TwoFactorController.verifyCode);

/**
 * @route POST /api/2fa/enable
 * @desc Enable 2FA for user account
 * @access Private (requires valid user session)
 */
router.post('/enable', authMiddleware.authenticateToken, TwoFactorController.enable);

/**
 * @route POST /api/2fa/disable
 * @desc Disable 2FA for user account
 * @access Private (requires valid user session)
 */
router.post('/disable', authMiddleware.authenticateToken, TwoFactorController.disable);

/**
 * @route GET /api/2fa/status
 * @desc Get 2FA status for user
 * @access Private (requires valid user session)
 */
router.get('/status', authMiddleware.authenticateToken, rateLimiter, TwoFactorController.status);

/**
 * @route POST /api/2fa/send-code-login
 * @desc Send 2FA code to user's email (for users who just logged in, no auth required)
 * @access Public (for login flow)
 */
router.post('/send-code-login', strictRateLimiter, TwoFactorController.sendCodeLogin);

export default router; 