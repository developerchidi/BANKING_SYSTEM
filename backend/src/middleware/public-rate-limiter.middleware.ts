import rateLimit from 'express-rate-limit';

// Public API rate limits
export const publicApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication rate limits
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 login attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Please try again in 15 minutes',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
});

// Banking operations rate limits
export const bankingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 banking operations per hour
  message: {
    error: 'Banking operation limit exceeded',
    message: 'Too many banking operations. Please try again later.',
    retryAfter: '1 hour'
  },
});

// Transfer specific rate limits
export const transferLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 transfers per hour
  message: {
    error: 'Transfer limit exceeded',
    message: 'Too many transfers. Please try again later.',
    retryAfter: '1 hour'
  },
});
