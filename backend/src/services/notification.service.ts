// backend/src/services/notification.service.ts
import { PrismaClient } from '@prisma/client';
import { getNotificationWebSocket } from './websocket-instance';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  title: string;
  content: string;
  senderId: string;
  receiverIds: string[]; // Array of user IDs
  type?: string; // SYSTEM, KYC, TRANSACTION, ANNOUNCEMENT, SECURITY
  priority?: string; // LOW, NORMAL, HIGH, URGENT
  category?: string;
  relatedType?: string; // TRANSACTION, KYC_REQUEST, LOAN, etc.
  relatedId?: string;
}

export interface NotificationFilters {
  userId?: string;
  type?: string;
  priority?: string;
  category?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  /**
   * Tạo thông báo cho một hoặc nhiều người nhận
   */
  static async createNotification(data: CreateNotificationData) {
    try {
      const {
        title,
        content,
        senderId,
        receiverIds,
        type = 'SYSTEM',
        priority = 'NORMAL',
        category,
        relatedType,
        relatedId,
      } = data;

      // Validate sender exists
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { id: true, email: true },
      });

      if (!sender) {
        throw new Error('Người gửi không tồn tại');
      }

      // Validate receivers exist
      const receivers = await prisma.user.findMany({
        where: { id: { in: receiverIds } },
        select: { id: true, email: true },
      });

      if (receivers.length !== receiverIds.length) {
        throw new Error('Một số người nhận không tồn tại');
      }

      // Tạo thông báo cho từng người nhận
      const notifications = await Promise.all(
        receiverIds.map((receiverId) =>
          (prisma as any).notification.create({
            data: {
              title,
              content,
              senderId,
              receiverId,
              type,
              priority,
              category,
              relatedType,
              relatedId,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          })
        )
      );

      // Gửi thông báo real-time qua WebSocket
      const ws = getNotificationWebSocket();
      if (ws) {
        receiverIds.forEach((receiverId) => {
          ws.sendToUser(receiverId, {
            type: 'NEW_NOTIFICATION',
            payload: {
              id: notifications.find((n: any) => n.receiverId === receiverId)?.id,
              title,
              content,
              type,
              priority,
              category,
              relatedType,
              relatedId,
              createdAt: new Date().toISOString(),
            },
          });
        });
      }

      return notifications;
    } catch (error: any) {
      console.error('Error creating notification:', error);
      throw new Error(error.message || 'Không thể tạo thông báo');
    }
  }

  /**
   * Lấy tất cả thông báo (cho admin - không filter theo userId)
   */
  static async getAllNotifications(filters: NotificationFilters = {}) {
    try {
      const {
        type,
        priority,
        category,
        isRead,
        limit = 50,
        offset = 0,
      } = filters;

      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (priority) {
        where.priority = priority;
      }

      if (category) {
        where.category = category;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      const [notifications, total] = await Promise.all([
        (prisma as any).notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            receiver: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        (prisma as any).notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      console.error('Error getting all notifications:', error);
      throw new Error(error.message || 'Không thể lấy danh sách thông báo');
    }
  }

  /**
   * Lấy danh sách thông báo của user
   */
  static async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ) {
    try {
      const {
        type,
        priority,
        category,
        isRead,
        limit = 50,
        offset = 0,
      } = filters;

      const where: any = {
        receiverId: userId,
      };

      if (type) {
        where.type = type;
      }

      if (priority) {
        where.priority = priority;
      }

      if (category) {
        where.category = category;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      const [notifications, total] = await Promise.all([
        (prisma as any).notification.findMany({
          where,
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit,
          skip: offset,
        }),
        (prisma as any).notification.count({ where }),
      ]);

      return {
        notifications,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      throw new Error(error.message || 'Không thể lấy danh sách thông báo');
    }
  }

  /**
   * Lấy chi tiết thông báo
   */
  static async getNotificationById(notificationId: string, userId: string) {
    try {
      const notification = await (prisma as any).notification.findFirst({
        where: {
          id: notificationId,
          receiverId: userId, // Đảm bảo user chỉ xem thông báo của mình
        },
        include: {
          sender: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!notification) {
        throw new Error('Thông báo không tồn tại');
      }

      return notification;
    } catch (error: any) {
      console.error('Error getting notification:', error);
      throw new Error(error.message || 'Không thể lấy chi tiết thông báo');
    }
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await (prisma as any).notification.updateMany({
        where: {
          id: notificationId,
          receiverId: userId, // Đảm bảo user chỉ cập nhật thông báo của mình
          isRead: false, // Chỉ cập nhật nếu chưa đọc
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      if (notification.count === 0) {
        throw new Error('Thông báo không tồn tại hoặc đã được đánh dấu đã đọc');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      throw new Error(error.message || 'Không thể đánh dấu đã đọc');
    }
  }

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await (prisma as any).notification.updateMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      return {
        success: true,
        count: result.count,
      };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      throw new Error(error.message || 'Không thể đánh dấu tất cả đã đọc');
    }
  }

  /**
   * Xóa thông báo
   */
  static async deleteNotification(notificationId: string, userId: string) {
    try {
      const notification = await (prisma as any).notification.deleteMany({
        where: {
          id: notificationId,
          receiverId: userId, // Đảm bảo user chỉ xóa thông báo của mình
        },
      });

      if (notification.count === 0) {
        throw new Error('Thông báo không tồn tại');
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      throw new Error(error.message || 'Không thể xóa thông báo');
    }
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  static async getUnreadCount(userId: string) {
    try {
      const count = await (prisma as any).notification.count({
        where: {
          receiverId: userId,
          isRead: false,
        },
      });

      return { count };
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      throw new Error(error.message || 'Không thể đếm số thông báo chưa đọc');
    }
  }
}

