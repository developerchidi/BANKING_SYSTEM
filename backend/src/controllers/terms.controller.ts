import { Request, Response } from 'express';
import { TermsService } from '../services/terms.service';

export class TermsController {
  /**
   * Get user's terms acceptance history
   */
  static async getUserTermsHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const history = await TermsService.getUserTermsHistory(userId);
      return res.json({ success: true, data: history });
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to get terms history', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  /**
   * Check if user has accepted latest terms
   */
  static async checkTermsAcceptance(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const { termsVersion, termsType = 'REGISTRATION' } = req.query;
      
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!termsVersion) {
        return res.status(400).json({ message: 'Terms version is required' });
      }

      const hasAccepted = await TermsService.hasAcceptedLatestTerms(
        userId, 
        termsVersion as string, 
        termsType as string
      );

      return res.json({ 
        success: true, 
        hasAccepted,
        message: hasAccepted ? 'Terms accepted' : 'Terms not accepted'
      });
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to check terms acceptance', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  /**
   * Get terms acceptance statistics (Admin only)
   */
  static async getTermsStats(req: Request, res: Response) {
    try {
      const stats = await TermsService.getTermsAcceptanceStats();
      return res.json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to get terms statistics', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  /**
   * Get all terms acceptances (Admin only)
   */
  static async getAllTermsAcceptances(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await TermsService.getAllTermsAcceptances(page, limit);
      return res.json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to get terms acceptances', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
}
