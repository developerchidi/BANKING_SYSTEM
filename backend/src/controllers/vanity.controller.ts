import { Request, Response } from 'express';
import { vanityService } from '../services/vanity.service';

export class VanityController {
  static async suggest(req: Request, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const pattern = (req.query.pattern as string) || undefined;
      const list = await vanityService.suggest(limit, pattern);
      return res.json({ success: true, data: list });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async price(req: Request, res: Response) {
    try {
      const candidate = (req.query.number as string) || '';
      const result = await vanityService.getPrice(candidate);
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async purchase(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { accountId, newAccountNumber } = req.body || {};
      if (!accountId || !newAccountNumber) {
        return res.status(400).json({ success: false, message: 'accountId and newAccountNumber are required' });
      }
      const result = await vanityService.purchaseAccountNumber({
        accountId,
        newNumber: newAccountNumber,
        userId,
      });
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  // Market list (inventory)
  static async market(req: Request, res: Response) {
    try {
      const tier = (req.query.tier as string) || undefined;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');
      const data = await vanityService.market({ tier, page, limit });
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async availability(req: Request, res: Response) {
    try {
      const number = req.params.number as string;
      const data = await vanityService.availability(number);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  // Admin inventory
  static async adminAdd(req: Request, res: Response) {
    try {
      const numbers = req.body?.numbers as Array<{ number: string; tier?: string; basePrice?: number }>;
      if (!Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ success: false, message: 'numbers is required' });
      }
      const items = await vanityService.adminAddNumbers({ numbers });
      return res.json({ success: true, data: items });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async adminList(req: Request, res: Response) {
    try {
      const status = (req.query.status as string) || undefined;
      const tier = (req.query.tier as string) || undefined;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '20');
      const data = await vanityService.adminListNumbers({ status, tier, page, limit });
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async adminUpdate(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const updated = await vanityService.adminUpdateNumber(id, req.body || {});
      return res.json({ success: true, data: updated });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }

  static async adminDelete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const result = await vanityService.adminDeleteNumber(id);
      return res.json({ success: true, data: result });
    } catch (e) {
      return res.status(400).json({ success: false, message: (e as Error).message });
    }
  }
}

export default VanityController;


