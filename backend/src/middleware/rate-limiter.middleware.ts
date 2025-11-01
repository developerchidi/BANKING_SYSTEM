import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Create a rate limiter middleware (reduced for development)
export const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
  max: 20, // Limit each IP to 20 requests per windowMs (increased from 5)
  message: {
    message: 'Too many requests from this IP, please try again after 1 minute',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Create a stricter rate limiter for sensitive operations (reduced for development)
export const strictRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
  max: 10, // Limit each IP to 10 requests per windowMs (increased from 3)
  message: {
    message: 'Too many sensitive operations from this IP, please try again after 1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a rate limiter for password attempts (reduced for development)
export const passwordAttemptLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (reduced from 1 hour)
  max: 15, // Limit each IP to 15 password attempts per 5 minutes (increased from 5)
  message: {
    message: 'Too many password attempts, please try again after 5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a rate limiter for token refresh (reduced for development)
export const tokenRefreshLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
  max: 30, // Limit each IP to 30 token refreshes per windowMs (increased from 10)
  message: {
    message: 'Too many token refresh attempts, please try again after 1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a rate limiter for forgot password (less restrictive for development)
export const forgotPasswordLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (reduced from 15 minutes)
  max: 20, // Limit each IP to 20 forgot password requests per windowMs (increased from 10)
  message: {
    message: 'Too many password reset requests, please try again after 1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Banking operations rate limiter (very strict)
export const bankingOperationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // 3 requests per minute
  message: 'Too many banking operations. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  }
});

// Transfer rate limiter (relaxed for development; tighten for production!)
export const transferLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (was 5 minutes)
  max: 10, // 10 transfers per minute (was 2 per 5 minutes)
  message: 'Too many transfer attempts. Please wait before trying again.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    return req.user?.userId || req.ip || 'unknown';
  }
}); 