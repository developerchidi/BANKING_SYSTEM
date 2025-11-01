import { Request, Response } from 'express';
import { prisma } from '../config/database';

export const UserController = {
  // Get user profile
  getProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profilePicture: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isKycVerified: true,
          kycStatus: true,
          twoFactorEnabled: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
          displayCurrency: true,
          userProfile: true,
        },
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get profile', error: error instanceof Error ? error.message : error });
    }
  },

  // Update user profile
  updateProfile: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { firstName, lastName, phone, profilePicture, displayCurrency, dateOfBirth, studentId, cohort, school } = req.body;
      // Validate input
      if (!firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'First name and last name are required' });
      }
      // Optional: validate phone format
      if (phone && !/^\+?\d{8,15}$/.test(phone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number format' });
      }
      // Update user and upsert userProfile
      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone,
          profilePicture,
          ...(displayCurrency && { displayCurrency }),
          userProfile: dateOfBirth !== undefined || studentId !== undefined || cohort !== undefined || school !== undefined ? {
            upsert: {
              update: {
                ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
                ...(studentId !== undefined && { studentId }),
                ...(cohort !== undefined && { cohort }),
                ...(school !== undefined && { school }),
              },
              create: {
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                studentId: studentId || null,
                cohort: cohort || null,
                school: school || null,
              }
            }
          } : undefined,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profilePicture: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isKycVerified: true,
          kycStatus: true,
          twoFactorEnabled: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
          displayCurrency: true,
          userProfile: true,
        },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update profile', error: error instanceof Error ? error.message : error });
    }
  },

  // Submit KYC
  submitKyc: async (req: Request, res: Response) => {
    // TODO: Lưu thông tin KYC, cập nhật trạng thái
    res.json({ success: true, message: 'KYC submitted (TODO)' });
  },

  // Upload KYC document (CCCD/Passport)
  uploadDocument: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { docType } = req.body; // 'ID_CARD' | 'PASSPORT'
      if (!docType || !['ID_CARD', 'PASSPORT'].includes(docType)) {
        return res.status(400).json({ success: false, message: 'Invalid document type' });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Invalid file type' });
      }
      // OCR: extract info from image
      const Tesseract = require('tesseract.js');
      const path = require('path');
      const fs = require('fs');
      const filePath = req.file.path;
      const ocrResult = await Tesseract.recognize(filePath, 'vie');
      const text = ocrResult.data.text;
      // Simple extract: tìm số giấy tờ (CCCD: 9-12 số, Passport: 8-9 ký tự)
      let idNumber = '';
      if (docType === 'ID_CARD') {
        const match = text.match(/\b\d{9,12}\b/);
        if (match) idNumber = match[0];
      } else if (docType === 'PASSPORT') {
        const match = text.match(/\b[A-Z0-9]{8,9}\b/);
        if (match) idNumber = match[0];
      }
      if (!idNumber) {
        return res.status(400).json({ success: false, message: 'Could not extract ID number from document' });
      }
      // Check trùng số giấy tờ với user khác
      const existed = await prisma.userDocument.findFirst({
        where: { documentType: docType, idNumber, userId: { not: userId } },
      });
      if (existed) {
        return res.status(400).json({ success: false, message: 'This document has already been used by another user' });
      }
      // Lưu metadata vào DB
      const saved = await prisma.userDocument.create({
        data: {
          userId,
          documentType: docType,
          documentUrl: filePath,
          documentName: req.file.originalname,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          verificationStatus: 'PENDING',
          idNumber,
        },
      });
      // Cập nhật trạng thái KYC user
      await prisma.user.update({ where: { id: userId }, data: { kycStatus: 'PENDING' } });
      res.json({ success: true, data: { ocrText: text, idNumber, document: saved } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to upload document', error: error instanceof Error ? error.message : error });
    }
  },

  // Get user preferences
  getPreferences: async (req: Request, res: Response) => {
    // TODO: Lấy preferences từ DB
    res.json({ success: true, data: { language: 'vi', theme: 'light', notifications: true } });
  },

  // Update user preferences
  updatePreferences: async (req: Request, res: Response) => {
    // TODO: Validate input, update DB
    res.json({ success: true, message: 'Preferences updated (TODO)' });
  },

  // Link external account
  linkAccount: async (req: Request, res: Response) => {
    // TODO: Xử lý liên kết tài khoản ngoài
    res.json({ success: true, message: 'Account linked (TODO)' });
  },

  // Deactivate user account
  deactivateAccount: async (req: Request, res: Response) => {
    // TODO: Đánh dấu user là deactivated
    res.json({ success: true, message: 'Account deactivated (TODO)' });
  },

  // Admin: Update user role
  updateUserRole: async (req: Request, res: Response) => {
    // TODO: Kiểm tra quyền, cập nhật role user
    res.json({ success: true, message: 'User role updated (TODO)' });
  },

  // Admin: Get users with pagination
  getUsers: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const skip = (page - 1) * limit;

      // Build where clause for search
      const whereClause: any = {
        // Only include users who have submitted KYC requests (tracked by kycStatus)
        kycStatus: { in: ['PENDING', 'APPROVED', 'REJECTED'] }
      };
      if (search) {
        whereClause.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get users with pagination
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            isEmailVerified: true,
            isKycVerified: true,
            kycStatus: true,
            createdAt: true,
            userRoles: {
              where: { isActive: true },
              select: {
                role: {
                  select: {
                    name: true,
                    displayName: true,
                    level: true,
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
        error: error instanceof Error ? error.message : error
      });
    }
  },

  // Admin: Get single user by id
  adminGetUserById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          phone: true,
          isActive: true,
          isEmailVerified: true,
          isKycVerified: true,
          kycStatus: true,
          createdAt: true,
          userProfile: {
            select: {
              id: true,
              studentId: true,
              cohort: true,
              school: true,
            }
          },
          userRoles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  displayName: true,
                  level: true,
                }
              }
            }
          },
          accounts: {
            select: {
              id: true,
              accountNumber: true,
              accountName: true,
              accountType: true,
              currency: true,
              balance: true,
              availableBalance: true,
              createdAt: true,
            }
          }
        },
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, data: user });
    } catch (error) {
      console.error('Error getting user by id:', error);
      res.status(500).json({ success: false, message: 'Failed to get user', error: error instanceof Error ? error.message : error });
    }
  },

  // Admin: Create user
  adminCreateUser: async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phone } = req.body || {};
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const exists = await prisma.user.findUnique({ where: { email } });
      if (exists) {
        return res.status(409).json({ success: false, message: 'Email already exists' });
      }

      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);

      const created = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          firstName,
          lastName,
          phone,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          isEmailVerified: true,
          isKycVerified: true,
          kycStatus: true,
          createdAt: true,
        },
      });

      res.status(201).json({ success: true, data: created });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: 'Failed to create user', error: error instanceof Error ? error.message : error });
    }
  },

  // Admin: Update user
  adminUpdateUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, isActive } = req.body || {};

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(isActive !== undefined && { isActive }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          isEmailVerified: true,
          isKycVerified: true,
          kycStatus: true,
          createdAt: true,
        },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ success: false, message: 'Failed to update user', error: error instanceof Error ? error.message : error });
    }
  },

  // Admin: Update user profile (extended fields)
  adminUpdateUserProfile: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { dateOfBirth, studentId, cohort, school } = req.body || {};

      // Normalize inputs: empty string -> null
      const normalized = {
        dateOfBirth: typeof dateOfBirth === 'string' && dateOfBirth.trim() !== ''
          ? new Date(dateOfBirth)
          : null,
        studentId: studentId?.toString().trim() || null,
        cohort: cohort?.toString().trim() || null,
        school: school?.toString().trim() || null,
      };

      const profileData: any = {
        studentId: normalized.studentId,
        cohort: normalized.cohort,
        school: normalized.school,
      };

      const updated = await prisma.user.update({
        where: { id },
        data: {
          ...(normalized.dateOfBirth !== undefined && { dateOfBirth: normalized.dateOfBirth }),
          userProfile: {
            upsert: {
              update: profileData,
              create: profileData,
            },
          },
        },
        select: {
          id: true,
          userProfile: true,
        },
      });

      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error admin updating user profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update user profile', error: error instanceof Error ? error.message : error });
    }
  },

  // Admin: Delete user (soft delete -> deactivate)
  adminDeleteUser: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = await prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ success: false, message: 'Failed to delete user', error: error instanceof Error ? error.message : error });
    }
  },

  // Admin: Search users
  searchUsers: async (req: Request, res: Response) => {
    // TODO: Tìm kiếm user theo query
    res.json({ success: true, data: [{ id: 'user123', email: 'user@example.com' }] });
  },

  // Admin: User analytics
  userAnalytics: async (req: Request, res: Response) => {
    // TODO: Thống kê số lượng user, trạng thái, KYC, hoạt động...
    res.json({ success: true, data: { total: 100, active: 90, kycPending: 10 } });
  },

  // Admin: Get KYC requests with pagination
  getKycRequests: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string || '';
      const skip = (page - 1) * limit;

      // Build where clause for search
      const whereClause: any = {};
      if (search) {
        whereClause.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get users with KYC info
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            isActive: true,
            isEmailVerified: true,
            isKycVerified: true,
            kycStatus: true,
            createdAt: true,
            userRoles: {
              where: { isActive: true },
              select: {
                role: {
                  select: {
                    name: true,
                    displayName: true,
                    level: true,
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          users,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting KYC requests:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get KYC requests',
        error: error instanceof Error ? error.message : error
      });
    }
  },

  // Admin: Update user status
  updateUserStatus: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'isActive must be a boolean value'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isEmailVerified: true,
          isKycVerified: true,
          kycStatus: true,
          createdAt: true,
        }
      });

      res.json({
        success: true,
        data: updatedUser,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: error instanceof Error ? error.message : error
      });
    }
  },

  // Change password
  changePassword: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
      }
      // Lấy user từ DB
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      // Kiểm tra mật khẩu cũ
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      // Validate mật khẩu mới (ít nhất 8 ký tự, có số, chữ hoa, chữ thường)
      if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters, include uppercase, lowercase and a number' });
      }
      // Hash mật khẩu mới
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to change password', error: error instanceof Error ? error.message : error });
    }
  },

  // Get KYC status
  getKycStatus: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      // Lấy trạng thái KYC tổng thể
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          kycStatus: true,
          isKycVerified: true,
        },
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      // Lấy danh sách giấy tờ đã upload
      const documents = await prisma.userDocument.findMany({
        where: { userId },
        select: {
          id: true,
          documentType: true,
          documentUrl: true,
          documentName: true,
          fileSize: true,
          mimeType: true,
          idNumber: true,
          verificationStatus: true,
          verificationNotes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: { user, documents } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to get KYC status', error: error instanceof Error ? error.message : error });
    }
  },

  // Update display currency only
  updateDisplayCurrency: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { displayCurrency } = req.body;
      
      if (!displayCurrency) {
        return res.status(400).json({ success: false, message: 'displayCurrency is required' });
      }
      
      // Validate currency code
      const validCurrencies = ['VND', 'USD', 'EUR', 'JPY'];
      if (!validCurrencies.includes(displayCurrency)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid currency code. Supported currencies: VND, USD, EUR, JPY'
        });
      }
      
      const updated = await prisma.user.update({
        where: { id: userId },
        data: { displayCurrency },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profilePicture: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isKycVerified: true,
          kycStatus: true,
          twoFactorEnabled: true,
          isActive: true,
          isLocked: true,
          createdAt: true,
          updatedAt: true,
          displayCurrency: true,
        },
      });
      
      console.log(`[UserController] Updated display currency for user ${userId} to ${displayCurrency}`);
      res.json({ success: true, data: updated });
    } catch (error) {
      console.error('[UserController] Error updating display currency:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update display currency', 
        error: error instanceof Error ? error.message : error 
      });
    }
  },
}; 