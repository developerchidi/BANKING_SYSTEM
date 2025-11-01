import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { twoFactorService } from '../services/two-factor.service';
import { AuthService } from '../services/auth.service';

export class TwoFactorController {
  static async sendCode(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, twoFactorEnabled: true },
      });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (!user.twoFactorEnabled) {
        return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled for this account' });
      }

      const twoFactorCode = await twoFactorService.createCode(userId, user.email);
      res.json({ success: true, message: '2FA code sent successfully to your email', data: { expiresIn: 600, userId: twoFactorCode.userId } });
    } catch (error) {
      console.error('2FA send code error:', error);
      res.status(500).json({ success: false, message: 'Failed to send 2FA code' });
    }
  }

  static async verifyCode(req: Request, res: Response) {
    try {
      const { code } = req.body;
      const userId = req.user?.userId;
      if (!code) return res.status(400).json({ success: false, message: '2FA code is required' });
      if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });

      const { user, tokens } = await AuthService.completeTwoFactorLogin(userId, code, req.ip);
      res.json({ success: true, message: '2FA verification successful', accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user });
    } catch (error) {
      console.error('2FA verify code error:', error);
      res.status(500).json({ success: false, message: 'Failed to verify 2FA code' });
    }
  }

  static async enable(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });

      const isEnabled = await twoFactorService.isTwoFactorEnabled(userId);
      if (isEnabled) return res.status(400).json({ success: false, message: 'Two-factor authentication is already enabled' });

      await twoFactorService.enableTwoFactor(userId);
      res.json({ success: true, message: 'Two-factor authentication enabled successfully', data: { userId, enabledAt: new Date() } });
    } catch (error) {
      console.error('2FA enable error:', error);
      res.status(500).json({ success: false, message: 'Failed to enable two-factor authentication' });
    }
  }

  static async disable(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });

      const isEnabled = await twoFactorService.isTwoFactorEnabled(userId);
      if (!isEnabled) return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled' });

      await twoFactorService.disableTwoFactor(userId);
      res.json({ success: true, message: 'Two-factor authentication disabled successfully', data: { userId, disabledAt: new Date() } });
    } catch (error) {
      console.error('2FA disable error:', error);
      res.status(500).json({ success: false, message: 'Failed to disable two-factor authentication' });
    }
  }

  static async status(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ success: false, message: 'User not authenticated' });
      const status = await twoFactorService.getTwoFactorStatus(userId);
      res.json({ success: true, data: status });
    } catch (error) {
      console.error('2FA status error:', error);
      res.status(500).json({ success: false, message: 'Failed to get 2FA status' });
    }
  }

  static async sendCodeLogin(req: Request, res: Response) {
    try {
      const { userId } = req.body;
      if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

      const existingCode = await prisma.twoFactorCode.findFirst({
        where: {
          userId,
          used: false,
          expiresAt: { gt: new Date() },
          createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
        },
      });
      if (existingCode) {
        return res.json({ success: true, message: '2FA code already sent recently', data: { expiresIn: 600, userId: existingCode.userId } });
      }

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, twoFactorEnabled: true, isActive: true } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      if (!user.isActive) return res.status(400).json({ success: false, message: 'User account is not active' });
      if (!user.twoFactorEnabled) {
        return res.status(400).json({ success: false, message: 'Two-factor authentication is not enabled for this account' });
      }

      const twoFactorCode = await twoFactorService.createCode(userId, user.email);
      res.json({ success: true, message: '2FA code sent successfully to your email', data: { expiresIn: 600, userId: twoFactorCode.userId } });
    } catch (error) {
      console.error('2FA send code login error:', error);
      res.status(500).json({ success: false, message: 'Failed to send 2FA code' });
    }
  }
}

export default TwoFactorController;

