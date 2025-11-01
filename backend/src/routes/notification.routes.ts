// backend/src/routes/notification.routes.ts
import express from 'express';
import auth from '../middleware/auth.middleware';
import { NotificationController } from '../controllers/notification.controller';

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
// POST /api/notifications - Tạo thông báo (chỉ admin/manager/teller/customer_service)
router.post('/', auth.authenticateToken, NotificationController.create);

// GET /api/notifications - Lấy danh sách thông báo của user hiện tại
router.get('/', auth.authenticateToken, NotificationController.list);

// GET /api/notifications/unread-count - Lấy số thông báo chưa đọc
router.get('/unread-count', auth.authenticateToken, NotificationController.unreadCount);

// GET /api/notifications/:id - Lấy chi tiết thông báo
router.get('/:id', auth.authenticateToken, NotificationController.detail);

// PUT /api/notifications/:id/read - Đánh dấu thông báo đã đọc
router.put('/:id/read', auth.authenticateToken, NotificationController.markAsRead);

// PUT /api/notifications/read-all - Đánh dấu tất cả thông báo đã đọc
router.put('/read-all', auth.authenticateToken, NotificationController.markAllAsRead);

// DELETE /api/notifications/:id - Xóa thông báo
router.delete('/:id', auth.authenticateToken, NotificationController.delete);

export default router;

