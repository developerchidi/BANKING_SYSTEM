// backend/src/controllers/notification.controller.ts
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { prisma } from '../config/database';

export class NotificationController {
  /**
   * Tạo thông báo (chỉ dành cho admin/manager/teller/customer_service)
   */
  static async create(req: Request, res: Response) {
    try {
      const senderId = (req as any).user?.id;
      if (!senderId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      // Check if user has permission to create notifications
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!sender) {
        return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });
      }

      // Check if user has admin/manager/teller/customer_service role
      const allowedRoles = ['ADMIN', 'MANAGER', 'TELLER', 'CUSTOMER_SERVICE', 'SUPER_ADMIN'];
      const hasPermission = sender.userRoles.some(
        (ur) => ur.isActive && allowedRoles.includes(ur.role.name)
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không có quyền tạo thông báo',
        });
      }

      const { title, content, receiverIds, type, priority, category, relatedType, relatedId } =
        req.body;

      if (!title || !content || !receiverIds || !Array.isArray(receiverIds) || receiverIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng cung cấp tiêu đề, nội dung và danh sách người nhận',
        });
      }

      const notifications = await NotificationService.createNotification({
        title,
        content,
        senderId,
        receiverIds,
        type,
        priority,
        category,
        relatedType,
        relatedId,
      });

      return res.json({
        success: true,
        message: 'Thông báo đã được gửi thành công',
        data: notifications,
      });
    } catch (error: any) {
      console.error('Error creating notification:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể tạo thông báo',
      });
    }
  }

  /**
   * Lấy danh sách thông báo của user hiện tại
   */
  static async list(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { type, priority, category, isRead, limit, offset } = req.query;

      const result = await NotificationService.getNotifications(userId, {
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
      console.error('Error getting notifications:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể lấy danh sách thông báo',
      });
    }
  }

  /**
   * Lấy chi tiết thông báo
   */
  static async detail(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      const notification = await NotificationService.getNotificationById(id, userId);

      return res.json({
        success: true,
        data: notification,
      });
    } catch (error: any) {
      console.error('Error getting notification detail:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể lấy chi tiết thông báo',
      });
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      await NotificationService.markAsRead(id, userId);

      return res.json({
        success: true,
        message: 'Đã đánh dấu thông báo đã đọc',
      });
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể đánh dấu đã đọc',
      });
    }
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await NotificationService.markAllAsRead(userId);

      return res.json({
        success: true,
        message: `Đã đánh dấu ${result.count} thông báo đã đọc`,
        data: result,
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể đánh dấu tất cả đã đọc',
      });
    }
  }

  /**
   * Xóa thông báo
   */
  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const { id } = req.params;
      await NotificationService.deleteNotification(id, userId);

      return res.json({
        success: true,
        message: 'Đã xóa thông báo',
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể xóa thông báo',
      });
    }
  }

  /**
   * Lấy số thông báo chưa đọc
   */
  static async unreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await NotificationService.getUnreadCount(userId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Không thể đếm số thông báo chưa đọc',
      });
    }
  }
}

