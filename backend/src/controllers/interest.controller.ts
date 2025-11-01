import { Request, Response } from 'express';
import { InterestService } from '../services/interest.service';

export class InterestController {
  /**
   * Lấy lịch sử lãi suất của user
   */
  static async getInterestHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { limit = 50, page = 1 } = req.query;
      const limitNum = Math.min(parseInt(limit as string) || 50, 100);
      const offset = (parseInt(page as string) || 1 - 1) * limitNum;

      const history = await InterestService.getUserInterestHistory(userId, limitNum);
      
      return res.json({
        success: true,
        data: history,
        pagination: {
          page: parseInt(page as string) || 1,
          limit: limitNum,
          total: history.length,
        },
      });
    } catch (error) {
      console.error('❌ Error getting interest history:', error);
      return res.status(500).json({
        message: 'Failed to get interest history',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Lấy tổng lãi suất năm của user
   */
  static async getYearlyInterest(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { year } = req.query;
      const yearNum = parseInt(year as string) || new Date().getFullYear();

      const yearlyInterest = await InterestService.getUserYearlyInterest(userId, yearNum);
      
      return res.json({
        success: true,
        data: yearlyInterest,
      });
    } catch (error) {
      console.error('❌ Error getting yearly interest:', error);
      return res.status(500).json({
        message: 'Failed to get yearly interest',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Lấy lãi suất hiện tại cho loại tài khoản
   */
  static async getCurrentRates(req: Request, res: Response) {
    try {
      const { accountType, tier = 'STANDARD' } = req.query;
      
      if (!accountType) {
        return res.status(400).json({ message: 'Account type is required' });
      }

      const rate = await InterestService.getCurrentInterestRate(
        accountType as string,
        tier as string
      );
      
      if (!rate) {
        return res.status(404).json({ message: 'Interest rate not found' });
      }

      return res.json({
        success: true,
        data: rate,
      });
    } catch (error) {
      console.error('❌ Error getting current rates:', error);
      return res.status(500).json({
        message: 'Failed to get current rates',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Tính lãi suất cho một tài khoản cụ thể (Admin only)
   */
  static async calculateAccountInterest(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      const result = await InterestService.calculateAccountInterest(accountId);
      
      if (!result) {
        return res.status(404).json({ message: 'Account not found or no interest to calculate' });
      }

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('❌ Error calculating account interest:', error);
      return res.status(500).json({
        message: 'Failed to calculate account interest',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Tính lãi suất cho tất cả tài khoản (Admin only)
   */
  static async calculateAllInterest(req: Request, res: Response) {
    try {
      const results = await InterestService.calculateMonthlyInterest();
      
      return res.json({
        success: true,
        data: {
          processedAccounts: results.length,
          calculations: results,
        },
      });
    } catch (error) {
      console.error('❌ Error calculating all interest:', error);
      return res.status(500).json({
        message: 'Failed to calculate all interest',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Post lãi suất cho một tài khoản (Admin only)
   */
  static async postAccountInterest(req: Request, res: Response) {
    try {
      const { accountId } = req.params;
      
      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      const calculation = await InterestService.calculateAccountInterest(accountId);
      
      if (!calculation) {
        return res.status(404).json({ message: 'Account not found or no interest to calculate' });
      }

      const success = await InterestService.postInterest(calculation);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to post interest' });
      }

      return res.json({
        success: true,
        message: 'Interest posted successfully',
        data: calculation,
      });
    } catch (error) {
      console.error('❌ Error posting account interest:', error);
      return res.status(500).json({
        message: 'Failed to post account interest',
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  /**
   * Khởi tạo lãi suất mặc định (Admin only)
   */
  static async initializeRates(req: Request, res: Response) {
    try {
      await InterestService.initializeDefaultRates();
      
      return res.json({
        success: true,
        message: 'Default interest rates initialized successfully',
      });
    } catch (error) {
      console.error('❌ Error initializing rates:', error);
      return res.status(500).json({
        message: 'Failed to initialize rates',
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}
