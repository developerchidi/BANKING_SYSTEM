import express, { Router } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth.middleware';
import { strictRateLimiter, passwordAttemptLimiter, tokenRefreshLimiter, forgotPasswordLimiter } from '../middleware/rate-limiter.middleware';
import { AuthController } from '../controllers/auth.controller';

const router: Router = express.Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('cohort').optional().isString().withMessage('Cohort must be a string'),
  body('school').optional().isString().withMessage('School must be a string'),
  body('termsAccepted').isBoolean().withMessage('Terms acceptance is required'),
  body('termsVersion').optional().isString().withMessage('Terms version must be a string'),
];

const validateLogin = [
  body('studentId').notEmpty().withMessage('Student ID is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain at least one special character'),
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Invalid email address'),
];

const validateResetPassword = [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('New password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('New password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('New password must contain at least one special character'),
];

const validateEmailVerification = [
  body('token').notEmpty().withMessage('Verification token is required'),
];

router.post('/register', strictRateLimiter, validateRegistration, AuthController.register);

// Check if email exists
router.get('/check-email', AuthController.checkEmailExists);

// Check if phone exists
router.get('/check-phone', AuthController.checkPhoneExists);

// Check if student ID exists
router.get('/check-student-id', AuthController.checkStudentIdExists);

// Login user
router.post('/login', passwordAttemptLimiter, validateLogin, AuthController.login);

// Admin login (requires admin roles)
router.post('/admin-login', passwordAttemptLimiter, validateLogin, AuthController.adminLogin);

// Logout user
router.post('/logout', authenticateToken, AuthController.logout);

// Refresh token
router.post('/refresh', tokenRefreshLimiter, AuthController.refresh);

// Get current user profile
router.get('/me', authenticateToken, AuthController.me);

// Validate password strength
router.post('/validate-password', AuthController.validatePassword);

// Change password (requires authentication)
router.post('/change-password', authenticateToken, strictRateLimiter, validateChangePassword, AuthController.changePassword);

// Change email (requires authentication)
router.post('/change-email', authenticateToken, strictRateLimiter, [
  body('newEmail').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
], AuthController.changeEmail);

// Forgot password (send reset email)
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, AuthController.forgotPassword);

// Reset password (with token)
router.post('/reset-password', strictRateLimiter, validateResetPassword, AuthController.resetPassword);

// Verify reset code (optional step)
router.post('/verify-reset-code', strictRateLimiter, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Reset code must be 6 digits')
], AuthController.verifyResetCode);

// Verify email
router.post('/verify-email', validateEmailVerification, AuthController.verifyEmail);

// Resend email verification
router.post('/resend-verification', authenticateToken, strictRateLimiter, AuthController.resendVerification);

// 2FA Routes
const validateTwoFactorCode = [
  body('code').isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits'),
];

// Complete 2FA login
router.post('/2fa/complete-login', strictRateLimiter, validateTwoFactorCode, AuthController.completeTwoFactorLogin);

export default router; 