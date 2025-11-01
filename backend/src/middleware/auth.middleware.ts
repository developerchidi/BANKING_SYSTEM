import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { prisma, withTimeout } from '../config/database';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        tokenType?: 'regular' | '2fa-temp';
      };
    }
  }
}

// Authentication middleware
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
      // Verify token and check blacklist
      const decoded = await AuthService.verifyToken(token);
      
      // Add user info to request (skip database check for performance)
      req.user = { 
        id: decoded.userId, 
        userId: decoded.userId, 
        tokenType: 'regular' 
      };
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Temporary token authentication for 2FA
export const authenticateTemporaryToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
      // Verify temporary token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      // Check if it's a temporary token for 2FA
      if (decoded.type !== '2fa-temp') {
        return res.status(401).json({ message: 'Invalid token type for 2FA' });
      }

      // Check if user exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          isActive: true,
          isLocked: true,
          lockedUntil: true,
          twoFactorEnabled: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(401).json({ message: 'Account is locked' });
      }

      if (!user.twoFactorEnabled) {
        return res.status(401).json({ message: '2FA not enabled for this account' });
      }

      // Add user info to request
      req.user = { 
        id: decoded.userId, 
        userId: decoded.userId, 
        tokenType: '2fa-temp' 
      };
      next();
    } catch (error) {
      console.error('Temporary token verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired temporary token' });
    }
  } catch (error) {
    console.error('Temporary authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Role-based authorization middleware
export const authorizeRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          id: true,
          isActive: true,
          isLocked: true,
          lockedUntil: true,
          kycStatus: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(401).json({ message: 'Account is locked' });
      }

      // Check if user has required role
      if (roles.includes('KYC_VERIFIED') && user.kycStatus !== 'APPROVED') {
        return res.status(403).json({ message: 'KYC verification required' });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({ message: 'Authorization failed' });
    }
  };
};

// Audit logging middleware
export const auditLog = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Create audit log entry
      if (req.user?.userId) {
        DatabaseService.createAuditLog({
          action,
          tableName: 'users',
          recordId: req.user.userId,
          userId: req.user.userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        }).catch(console.error);
      }

      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      next(); // Continue even if audit logging fails
    }
  };
};

// Export middleware
export default {
  authenticateToken,
  authenticateTemporaryToken,
  authorizeRole,
  auditLog,
}; 