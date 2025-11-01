import { Request, Response } from 'express';
import { prisma } from '../config/database';

export class RolesController {
  static async list(req: Request, res: Response) {
    try {
      const roles = await prisma.role.findMany({ orderBy: { level: 'desc' } });
      const rolesWithParsedPermissions = roles.map((role) => ({
        ...role,
        permissions: role.permissions ? JSON.parse(role.permissions) : [],
      }));
      res.json({ success: true, data: rolesWithParsedPermissions });
    } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch roles' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          userRoles: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      if (!role) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      res.json({
        success: true,
        data: { ...role, permissions: role.permissions ? JSON.parse(role.permissions) : [] },
      });
    } catch (error) {
      console.error('Error fetching role:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch role' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, displayName, description, permissions, level } = req.body;
      if (!name || !displayName) {
        return res.status(400).json({ success: false, message: 'Name and displayName are required' });
      }

      const existingRole = await prisma.role.findUnique({ where: { name } });
      if (existingRole) {
        return res.status(409).json({ success: false, message: 'Role with this name already exists' });
      }

      const role = await prisma.role.create({
        data: {
          name,
          displayName,
          description,
          permissions: permissions ? JSON.stringify(permissions) : null,
          level: level || 0,
        },
      });

      res.status(201).json({
        success: true,
        data: { ...role, permissions: role.permissions ? JSON.parse(role.permissions) : [] },
      });
    } catch (error) {
      console.error('Error creating role:', error);
      res.status(500).json({ success: false, message: 'Failed to create role' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, displayName, description, permissions, level, isActive } = req.body;

      const existingRole = await prisma.role.findUnique({ where: { id } });
      if (!existingRole) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }

      if (name && name !== existingRole.name) {
        const nameConflict = await prisma.role.findUnique({ where: { name } });
        if (nameConflict) {
          return res.status(409).json({ success: false, message: 'Role with this name already exists' });
        }
      }

      const role = await prisma.role.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(displayName && { displayName }),
          ...(description !== undefined && { description }),
          ...(permissions && { permissions: JSON.stringify(permissions) }),
          ...(level !== undefined && { level }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      res.json({ success: true, data: { ...role, permissions: role.permissions ? JSON.parse(role.permissions) : [] } });
    } catch (error) {
      console.error('Error updating role:', error);
      res.status(500).json({ success: false, message: 'Failed to update role' });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const existingRole = await prisma.role.findUnique({ where: { id }, include: { userRoles: true } });
      if (!existingRole) {
        return res.status(404).json({ success: false, message: 'Role not found' });
      }
      if (existingRole.userRoles.length > 0) {
        return res.status(409).json({ success: false, message: 'Cannot delete role that is assigned to users' });
      }
      await prisma.role.delete({ where: { id } });
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      console.error('Error deleting role:', error);
      res.status(500).json({ success: false, message: 'Failed to delete role' });
    }
  }

  static async users(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userRoles = await prisma.userRole.findMany({
        where: {
          roleId: id,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true, createdAt: true } } },
        orderBy: { assignedAt: 'desc' },
      });
      res.json({ success: true, data: userRoles });
    } catch (error) {
      console.error('Error fetching role users:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch role users' });
    }
  }
}

export default RolesController;

