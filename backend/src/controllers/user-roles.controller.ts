import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

export class UserRolesController {
  static async getUserRoles(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { role: true },
        orderBy: { assignedAt: 'desc' },
      });
      res.json({ success: true, data: userRoles });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch user roles' });
    }
  }

  static async assignRole(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const { roleId, expiresAt } = req.body;

      if (!roleId) {
        return res.status(400).json({ success: false, message: 'Role ID is required' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      const existingUserRole = await prisma.userRole.findFirst({
        where: { userId, roleId, isActive: true },
      });
      if (existingUserRole) {
        return res.status(409).json({ success: false, message: 'User already has this role' });
      }

      const userRole = await prisma.userRole.create({
        data: {
          userId,
          roleId,
          assignedBy: req.user?.id,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
        include: { role: true },
      });

      res.status(201).json({ success: true, data: userRole });
    } catch (error) {
      console.error('Error assigning role to user:', error);
      res.status(500).json({ success: false, message: 'Failed to assign role to user' });
    }
  }

  static async removeRole(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.params;

      const userRole = await prisma.userRole.findFirst({
        where: { userId, roleId, isActive: true },
      });
      if (!userRole) {
        return res.status(404).json({ success: false, message: 'User role assignment not found' });
      }

      await prisma.userRole.update({ where: { id: userRole.id }, data: { isActive: false } });
      res.json({ success: true, message: 'Role removed from user successfully' });
    } catch (error) {
      console.error('Error removing role from user:', error);
      res.status(500).json({ success: false, message: 'Failed to remove role from user' });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const { userId, roleId } = req.params;
      const { expiresAt, isActive } = req.body;

      const userRole = await prisma.userRole.findFirst({ where: { userId, roleId } });
      if (!userRole) {
        return res.status(404).json({ success: false, message: 'User role assignment not found' });
      }

      const updatedUserRole = await prisma.userRole.update({
        where: { id: userRole.id },
        data: {
          ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
          ...(isActive !== undefined && { isActive }),
        },
        include: { role: true },
      });

      res.json({ success: true, data: updatedUserRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ success: false, message: 'Failed to update user role' });
    }
  }

  static async summary(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search = '' } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const term = String(search || '').trim();
      const whereClause: Prisma.UserWhereInput | undefined = term
        ? {
            OR: [
              { firstName: { contains: term, mode: 'insensitive' } },
              { lastName: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
            ],
          }
        : undefined;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            createdAt: true,
            userRoles: {
              where: {
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
              include: { role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where: whereClause }),
      ]);

      res.json({ success: true, data: { users, total, page: Number(page), limit: Number(limit) } });
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch users with roles' });
    }
  }
}

export default UserRolesController;

