import { Router } from 'express';
import { InternalController } from '../controllers/internal.controller';

const router = Router();

// POST /api/internal/send-notification - Gửi thông báo nội bộ
router.post('/send-notification', InternalController.sendNotification);

export default router;
