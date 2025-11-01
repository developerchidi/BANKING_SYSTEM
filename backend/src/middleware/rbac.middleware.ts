import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { getRolePermissions, hasPermission } from '../constants/roles';

const prisma = new PrismaClient();

// Extend Express Request type to include user roles
declare global {
  namespace Express {
    interface Request {
      userRoles?: string[];
      userPermissions?: string[];
    }
  }
}

// Middleware to load user roles and permissions
export const loadUserRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }
    
    // Get user roles
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: true
      }
    });
    
    // Extract role names and permissions
    const roleNames = userRoles.map(ur => ur.role.name);
    const permissions = new Set<string>();
    
    // Collect all permissions from all roles
    for (const roleName of roleNames) {
      const rolePermissions = getRolePermissions(roleName);
      rolePermissions.forEach(permission => permissions.add(permission));
    }
    
    req.userRoles = roleNames;
    req.userPermissions = Array.from(permissions);
    
    next();
  } catch (error) {
    console.error('Error loading user roles:', error);
    next();
  }
};

// Middleware to check if user has specific permission
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userPermissions) {
      return res.status(401).json({
        success: false,
        message: 'User roles not loaded'
      });
    }
    
    if (!hasPermission(req.userPermissions, permission)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission
      });
    }
    
    next();
  };
};

// Middleware to check if user has any of the specified permissions
export const requireAnyPermission = (permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userPermissions) {
      return res.status(401).json({
        success: false,
        message: 'User roles not loaded'
      });
    }
    
    const hasAnyPermission = permissions.some(permission => 
      hasPermission(req.userPermissions!, permission)
    );
    
    if (!hasAnyPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permissions
      });
    }
    
    next();
  };
};

// Middleware to check if user has specific role
export const requireRole = (roleName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRoles) {
      return res.status(401).json({
        success: false,
        message: 'User roles not loaded'
      });
    }
    
    if (!req.userRoles.includes(roleName)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role',
        required: roleName
      });
    }
    
    next();
  };
};

// Middleware to check if user has any of the specified roles
export const requireAnyRole = (roleNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRoles) {
      return res.status(401).json({
        success: false,
        message: 'User roles not loaded'
      });
    }
    
    const hasAnyRole = roleNames.some(roleName => 
      req.userRoles!.includes(roleName)
    );
    
    if (!hasAnyRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role',
        required: roleNames
      });
    }
    
    next();
  };
};

// Helper function to check permissions in controllers
export const checkPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return hasPermission(userPermissions, requiredPermission);
};

// Helper function to get user role level
export const getUserRoleLevel = async (userId: string): Promise<number> => {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      role: true
    }
  });
  
  if (userRoles.length === 0) return 0;
  
  // Return the highest role level
  return Math.max(...userRoles.map(ur => ur.role.level));
};
