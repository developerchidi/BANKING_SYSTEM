import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { NotificationService } from '../services/notification.service';

// AdminController for managing admin operations
export const AdminController = {
  // Update user account tier
  updateUserTier: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { accountTier } = req.body;

      if (!['BASIC', 'STANDARD', 'PREMIUM', 'VIP'].includes(accountTier)) {
        return res.status(400).json({ error: 'Invalid account tier' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { accountTier },
        select: { id: true, email: true, firstName: true, lastName: true, accountTier: true },
      });

      return res.json({ success: true, message: 'User tier updated', data: { user } });
    } catch (error) {
      console.error('Update user tier error:', error);
      return res.status(500).json({ error: 'Failed to update user tier' });
    }
  },

  // Dashboard Stats
  getStats: async (req: Request, res: Response) => {
    try {
      const totalUsers = await prisma.user.count();

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayTransactions = await prisma.transaction.count({
        where: { createdAt: { gte: today, lt: tomorrow } },
      });

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyRevenueResult = await prisma.transaction.aggregate({
        where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
        _sum: { fee: true },
      });
      const monthlyRevenue = monthlyRevenueResult._sum.fee || 0;

      const activeAccounts = await prisma.user.count({ where: { isActive: true } });

      const userGrowth = 5.2;
      const transactionGrowth = 12.1;
      const revenueGrowth = 8.7;
      const accountGrowth = -2.3;

      res.json({
        success: true,
        data: {
          totalUsers,
          todayTransactions,
          monthlyRevenue,
          activeAccounts,
          userGrowth,
          transactionGrowth,
          revenueGrowth,
          accountGrowth,
        },
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
    }
  },

  // Recent Activities
  getActivities: async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const activities = await prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      });

      const recentActivities = activities.map((log) => ({
        id: log.id,
        user: `${log.user?.firstName || 'Unknown'} ${log.user?.lastName || 'User'}`,
        action: log.action,
        time: log.createdAt.toISOString(),
        type: log.action.includes('ERROR')
          ? 'error'
          : log.action.includes('WARNING')
          ? 'warning'
          : log.action.includes('SUCCESS')
          ? 'success'
          : 'info',
      }));

      res.json({ success: true, data: recentActivities });
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recent activities' });
    }
  },

  // KYC Requests (list) - return actual KYCRequest rows with user info
  getKycRequests: async (req: Request, res: Response) => {
    try {
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);
      const search = (req.query.search as string) || '';
      const skip = (page - 1) * limit;

      // Filter by user's name/email if search provided
      const whereClause: any = search
        ? {
            OR: [
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { user: { firstName: { contains: search, mode: 'insensitive' } } },
              { user: { lastName: { contains: search, mode: 'insensitive' } } },
              { id: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {};

      const [requests, total] = await Promise.all([
        prisma.kYCRequest.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                isActive: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { submittedAt: 'desc' },
        }),
        prisma.kYCRequest.count({ where: whereClause }),
      ]);

      res.json({ success: true, data: { requests, total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      console.error('Error getting KYC requests:', error);
      res.status(500).json({ success: false, message: 'Failed to get KYC requests', error: error instanceof Error ? error.message : error });
    }
  },

  // KYC Approve
  approveKyc: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = (req as any).user?.id;
      if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized: missing admin id' });

      const user = await prisma.user.findUnique({ where: { id: userId }, include: { userDocuments: true } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Update latest KYC request row as APPROVED
      const latestKyc = await prisma.kYCRequest.findFirst({ where: { userId }, orderBy: { submittedAt: 'desc' } });
      if (latestKyc) {
        await prisma.kYCRequest.update({
          where: { id: latestKyc.id },
          data: { status: 'APPROVED', reviewedAt: new Date(), reviewedBy: adminId, rejectionReason: null },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isKycVerified: true, kycStatus: 'APPROVED', kycApprovedAt: new Date(), kycApprovedBy: adminId, kycReviewNotes: reviewNotes },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: `KYC_APPROVED: User ${user.email} KYC approved by admin`,
          details: JSON.stringify({ targetUserId: userId, reviewNotes, timestamp: new Date().toISOString() }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
        },
      });

      // Gửi thông báo cho user
      try {
        await NotificationService.createNotification({
          title: 'KYC đã được duyệt',
          content: reviewNotes 
            ? `Yêu cầu KYC của bạn đã được duyệt thành công. Ghi chú: ${reviewNotes}`
            : 'Yêu cầu KYC của bạn đã được duyệt thành công. Bạn có thể sử dụng đầy đủ các tính năng của hệ thống ngân hàng.',
          senderId: adminId,
          receiverIds: [userId],
          type: 'KYC',
          priority: 'HIGH',
          category: 'VERIFICATION',
          relatedType: 'KYC_REQUEST',
          relatedId: latestKyc?.id,
        });
      } catch (notificationError) {
        console.error('Error sending KYC approval notification:', notificationError);
        // Không fail cả request nếu notification lỗi
      }

      res.json({ success: true, message: 'KYC request approved successfully', data: { userId: updatedUser.id, kycStatus: updatedUser.kycStatus, approvedAt: updatedUser.kycApprovedAt } });
    } catch (error) {
      console.error('Error approving KYC request:', error);
      res.status(500).json({ success: false, message: 'Failed to approve KYC request', error: error instanceof Error ? error.message : error });
    }
  },

  // KYC Reject
  rejectKyc: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reviewNotes } = req.body;
      const adminId = (req as any).user?.id;
      if (!adminId) return res.status(401).json({ success: false, message: 'Unauthorized: missing admin id' });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      // Update latest KYC request row as REJECTED
      const latestKyc = await prisma.kYCRequest.findFirst({ where: { userId }, orderBy: { submittedAt: 'desc' } });
      if (latestKyc) {
        await prisma.kYCRequest.update({
          where: { id: latestKyc.id },
          data: { status: 'REJECTED', reviewedAt: new Date(), reviewedBy: adminId, rejectionReason: reviewNotes || null },
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isKycVerified: false, kycStatus: 'REJECTED', kycRejectedAt: new Date(), kycRejectedBy: adminId, kycReviewNotes: reviewNotes },
      });

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: `KYC_REJECTED: User ${user.email} KYC rejected by admin`,
          details: JSON.stringify({ targetUserId: userId, reviewNotes, timestamp: new Date().toISOString() }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || '',
        },
      });

      // Gửi thông báo cho user
      try {
        await NotificationService.createNotification({
          title: 'KYC bị từ chối',
          content: reviewNotes 
            ? `Yêu cầu KYC của bạn đã bị từ chối. Lý do: ${reviewNotes}. Vui lòng kiểm tra và gửi lại yêu cầu KYC mới.`
            : 'Yêu cầu KYC của bạn đã bị từ chối. Vui lòng kiểm tra lại thông tin và gửi lại yêu cầu KYC mới.',
          senderId: adminId,
          receiverIds: [userId],
          type: 'KYC',
          priority: 'HIGH',
          category: 'VERIFICATION',
          relatedType: 'KYC_REQUEST',
          relatedId: latestKyc?.id,
        });
      } catch (notificationError) {
        console.error('Error sending KYC rejection notification:', notificationError);
        // Không fail cả request nếu notification lỗi
      }

      res.json({ success: true, message: 'KYC request rejected', data: { userId: updatedUser.id, kycStatus: updatedUser.kycStatus, rejectedAt: updatedUser.kycRejectedAt } });
    } catch (error) {
      console.error('Error rejecting KYC request:', error);
      res.status(500).json({ success: false, message: 'Failed to reject KYC request', error: error instanceof Error ? error.message : error });
    }
  },

  // KYC Documents
  getKycDocuments: async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      console.log('🔍 Admin: Fetching KYC documents for user:', userId);

      const latestKyc = await prisma.kYCRequest.findFirst({ where: { userId }, orderBy: { submittedAt: 'desc' } });
      console.log('🔍 Admin: Latest KYC request found:', latestKyc ? 'Yes' : 'No');

      if (!latestKyc) {
        return res.json({ success: true, data: { studentCardImage: null, selfieImage: null, documents: [] } });
      }

      const toPublicUrl = (value?: string | null) => {
        if (!value || value.length === 0) return null;
        if (value.startsWith('data:')) return value;
        if (value.startsWith('http://') || value.startsWith('https://')) return value;
        if (
          value.startsWith('/9j/') ||
          value.startsWith('iVBORw0KGgo') ||
          value.startsWith('AAAAGGZ0eXBtcDQy') ||
          value.startsWith('UklGR') ||
          value.startsWith('R0lGOD') ||
          value.startsWith('SUkqAAg')
        ) {
          let mimeType = 'image/jpeg';
          if (value.startsWith('iVBORw0KGgo') || value.startsWith('UklGR')) mimeType = 'image/png';
          else if (value.startsWith('R0lGOD')) mimeType = 'image/gif';
          else if (value.startsWith('AAAAGGZ0eXBtcDQy') || value.startsWith('SUkqAAg')) mimeType = 'video/mp4';
          return `data:${mimeType};base64,${value}`;
        }
        const host = `${req.protocol}://${req.get('host')}`;
        const normalized = value.startsWith('/') ? value.slice(1) : value;
        return `${host}/${normalized}`;
      };

      const responseData = {
        studentCardUrl: toPublicUrl(latestKyc.frontImage),
        selfieUrl: toPublicUrl(latestKyc.selfieImage),
        studentCardImage: toPublicUrl(latestKyc.frontImage),
        selfieVideo: toPublicUrl(latestKyc.selfieImage),
        extractedData: latestKyc.extractedData,
        submittedAt: latestKyc.submittedAt,
      };

      res.json({ success: true, data: responseData });
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch KYC documents', error: error instanceof Error ? error.message : error });
    }
  },

  // System Health
  getHealth: async (req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ success: true, data: { status: 'OK', database: 'CONNECTED', services: { api: 'RUNNING', database: 'CONNECTED', email: 'FALLBACK' } } });
    } catch (error) {
      console.error('Error checking system health:', error);
      res.status(500).json({
        success: false,
        message: 'System health check failed',
        data: { status: 'ERROR', database: 'DISCONNECTED', services: { api: 'RUNNING', database: 'DISCONNECTED', email: 'UNKNOWN' } },
      });
    }
  },

  // Get tier upgrade requests
  getTierUpgradeRequests: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (status && status !== 'ALL') {
        where.status = status;
      }

      const [requests, total] = await Promise.all([
        prisma.tierUpgradeRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                monthlyIncome: true,
                isKycVerified: true,
                accountTier: true,
              },
            },
          },
          orderBy: { requestedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.tierUpgradeRequest.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return res.json({
        success: true,
        data: {
          requests,
          total,
          page,
          limit,
          totalPages,
        },
      });
    } catch (error) {
      console.error('Get tier upgrade requests error:', error);
      return res.status(500).json({ error: 'Failed to get tier upgrade requests' });
    }
  },

  // Approve tier upgrade request
  approveTierUpgradeRequest: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;

      const request = await prisma.tierUpgradeRequest.findUnique({
        where: { id: requestId },
        include: { user: true },
      });

      if (!request) {
        return res.status(404).json({ error: 'Tier upgrade request not found' });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request is not pending' });
      }

      // Update user's tier
      await prisma.user.update({
        where: { id: request.userId },
        data: { accountTier: request.targetTier },
      });

      // Update request status
      await prisma.tierUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: req.user?.userId,
        },
      });

      return res.json({
        success: true,
        message: 'Tier upgrade request approved successfully',
      });
    } catch (error) {
      console.error('Approve tier upgrade request error:', error);
      return res.status(500).json({ error: 'Failed to approve tier upgrade request' });
    }
  },

  // Reject tier upgrade request
  rejectTierUpgradeRequest: async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;

      if (!reason || !reason.trim()) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const request = await prisma.tierUpgradeRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ error: 'Tier upgrade request not found' });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request is not pending' });
      }

      // Update request status
      await prisma.tierUpgradeRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: req.user?.userId,
          rejectionReason: reason.trim(),
        },
      });

      return res.json({
        success: true,
        message: 'Tier upgrade request rejected successfully',
      });
    } catch (error) {
      console.error('Reject tier upgrade request error:', error);
      return res.status(500).json({ error: 'Failed to reject tier upgrade request' });
    }
  },

  // Get all notifications (admin view)
  getAllNotifications: async (req: Request, res: Response) => {
    try {
      const { type, priority, category, isRead, limit, offset } = req.query;

      const result = await NotificationService.getAllNotifications({
        type: type as string,
        priority: priority as string,
        category: category as string,
        isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting all notifications:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể lấy danh sách thông báo',
      });
    }
  },
};
