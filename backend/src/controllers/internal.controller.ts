import { Request, Response } from 'express';
import { getNotificationWebSocket } from '../services/websocket-instance';

export class InternalController {
  /**
   * API nội bộ để gửi thông báo qua WebSocket
   * Chỉ dành cho script và service nội bộ
   */
  static async sendNotification(req: Request, res: Response) {
    try {
      const { userId, type, payload } = req.body;

      if (!userId || !type || !payload) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, type, payload'
        });
      }

      // Kiểm tra token nội bộ (đơn giản hóa cho script)
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.includes('internal')) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - Internal API only'
        });
      }

      // Gửi thông báo qua WebSocket
      const notificationWS = getNotificationWebSocket();
      if (notificationWS) {
        notificationWS.sendToUser(userId, {
          type,
          payload
        });

        console.log(`📱 Internal notification sent: ${type} to user ${userId}`);
        
        return res.json({
          success: true,
          message: 'Notification sent successfully',
          data: { userId, type, payload }
        });
      } else {
        return res.status(503).json({
          success: false,
          message: 'WebSocket service not available'
        });
      }

    } catch (error) {
      console.error('❌ Error sending internal notification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
