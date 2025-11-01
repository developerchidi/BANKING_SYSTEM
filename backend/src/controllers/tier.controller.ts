import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { MonthlyIncomeService } from '../services/monthly-income.service';

export class TierController {
  // User request tier upgrade
  static async requestTierUpgrade(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { targetTier } = req.body;
      
      if (!['STANDARD', 'PREMIUM', 'VIP'].includes(targetTier)) {
        return res.status(400).json({ error: 'Invalid target tier' });
      }

      // Auto-calculate monthly income before checking requirements
      const calculatedIncome = await MonthlyIncomeService.calculateMonthlyIncome(req.user.userId);
      
      // Update user's monthly income in database
      await prisma.user.update({
        where: { id: req.user.userId },
        data: { monthlyIncome: calculatedIncome }
      });

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: {
          accountTier: true,
          isKycVerified: true,
          monthlyIncome: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Kiểm tra điều kiện upgrade
      const currentTier = user.accountTier as 'BASIC' | 'STANDARD' | 'PREMIUM' | 'VIP';
      const tierOrder: Record<string, number> = { 'BASIC': 1, 'STANDARD': 2, 'PREMIUM': 3, 'VIP': 4 };
      
      if (tierOrder[targetTier] <= tierOrder[currentTier]) {
        return res.status(400).json({ error: 'Cannot downgrade or stay at same tier' });
      }

      // Kiểm tra điều kiện cụ thể cho từng tier
      const requirements: Record<string, { kycRequired: boolean; minIncome: number; message: string }> = {
        'STANDARD': { 
          kycRequired: true, 
          minIncome: 0,
          message: 'Cần xác thực KYC để nâng cấp lên Standard'
        },
        'PREMIUM': { 
          kycRequired: true, 
          minIncome: 10000000, // 10M VND
          message: 'Cần xác thực KYC và thu nhập tối thiểu 10M VND/tháng để nâng cấp lên Premium'
        },
        'VIP': { 
          kycRequired: true, 
          minIncome: 50000000, // 50M VND
          message: 'Cần xác thực KYC và thu nhập tối thiểu 50M VND/tháng để nâng cấp lên VIP'
        },
      };

      const requirement = requirements[targetTier];
      
      if (requirement.kycRequired && !user.isKycVerified) {
        return res.status(400).json({ 
          error: 'KYC verification required',
          message: requirement.message,
          requirement: 'KYC'
        });
      }

      if (requirement.minIncome > 0 && (user.monthlyIncome || 0) < requirement.minIncome) {
        return res.status(400).json({ 
          error: 'Income requirement not met',
          message: requirement.message,
          requirement: 'INCOME',
          currentIncome: user.monthlyIncome || 0,
          requiredIncome: requirement.minIncome
        });
      }

      // Tạo request upgrade
      const upgradeRequest = await prisma.tierUpgradeRequest.create({
        data: {
          userId: req.user.userId,
          currentTier: currentTier,
          targetTier: targetTier,
          status: 'PENDING',
          requestedAt: new Date(),
          reason: `User ${user.firstName} ${user.lastName} (${user.email}) requests upgrade from ${currentTier} to ${targetTier}`,
        },
      });

      return res.json({ 
        success: true, 
        message: 'Tier upgrade request submitted successfully',
        data: { 
          requestId: upgradeRequest.id,
          currentTier,
          targetTier,
          status: 'PENDING'
        }
      });

    } catch (error) {
      console.error('Request tier upgrade error:', error);
      return res.status(500).json({ 
        error: 'Failed to request tier upgrade',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get user's tier upgrade requests
  static async getMyUpgradeRequests(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const requests = await prisma.tierUpgradeRequest.findMany({
        where: { userId: req.user.userId },
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          currentTier: true,
          targetTier: true,
          status: true,
          reason: true,
          requestedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      });

      return res.json({ 
        success: true, 
        data: { requests }
      });

    } catch (error) {
      console.error('Get upgrade requests error:', error);
      return res.status(500).json({ 
        error: 'Failed to get upgrade requests',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get tier requirements info
  static async getTierRequirements(req: Request, res: Response) {
    try {
      const requirements = {
        'BASIC': {
          name: 'Cơ bản',
          limits: { daily: 20000000, monthly: 200000000, atmDaily: 5000000 },
          requirements: { kyc: false, minIncome: 0 }
        },
        'STANDARD': {
          name: 'Tiêu chuẩn',
          limits: { daily: 100000000, monthly: 1000000000, atmDaily: 10000000 },
          requirements: { kyc: true, minIncome: 0 }
        },
        'PREMIUM': {
          name: 'Cao cấp',
          limits: { daily: 300000000, monthly: 3000000000, atmDaily: 20000000 },
          requirements: { kyc: true, minIncome: 10000000 }
        },
        'VIP': {
          name: 'VIP',
          limits: { daily: 500000000, monthly: 5000000000, atmDaily: 50000000 },
          requirements: { kyc: true, minIncome: 50000000 }
        },
      };

      return res.json({ 
        success: true, 
        data: { requirements }
      });

    } catch (error) {
      console.error('Get tier requirements error:', error);
      return res.status(500).json({ 
        error: 'Failed to get tier requirements',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Batch update monthly income for all users (Admin only)
  static async batchUpdateMonthlyIncome(req: Request, res: Response) {
    try {
      await MonthlyIncomeService.batchUpdateAllUsersMonthlyIncome();
      
      return res.json({
        success: true,
        message: 'Monthly income updated for all users successfully'
      });

    } catch (error) {
      console.error('Batch update monthly income error:', error);
      return res.status(500).json({
        error: 'Failed to batch update monthly income',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Get monthly income breakdown for a user
  static async getMonthlyIncomeBreakdown(req: Request, res: Response) {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const breakdown = await MonthlyIncomeService.getMonthlyIncomeBreakdown(req.user.userId);
      
      return res.json({
        success: true,
        data: breakdown
      });

    } catch (error) {
      console.error('Get monthly income breakdown error:', error);
      return res.status(500).json({
        error: 'Failed to get monthly income breakdown',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
