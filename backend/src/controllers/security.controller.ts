import { Request, Response } from 'express';
import SecurityService from '../services/security.service';

export class SecurityController {
  static async setPin(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { pin } = req.body || {};
      if (!userId || !pin) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      await SecurityService.setTransactionPin(userId, pin);
      return res.json({ success: true, message: 'Cập nhật PIN thành công' });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async verifyPin(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { pin } = req.body || {};
      if (!userId || !pin) return res.status(400).json({ success: false, message: 'Thiếu tham số' });
      await SecurityService.verifyTransactionPin(userId, pin);
      return res.json({ success: true, message: 'PIN hợp lệ' });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async hasPin(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const result = await SecurityService.hasTransactionPin(userId);
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }
}

export default SecurityController;


