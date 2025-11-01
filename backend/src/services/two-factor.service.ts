import { PrismaClient } from '@prisma/client';
import { EmailService } from './email.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface TwoFactorCode {
  id: string;
  userId: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class TwoFactorService {
  private static instance: TwoFactorService;

  public static getInstance(): TwoFactorService {
    if (!TwoFactorService.instance) {
      TwoFactorService.instance = new TwoFactorService();
    }
    return TwoFactorService.instance;
  }

  /**
   * Generate a 6-digit 2FA code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Create a new 2FA code for transfer (without deleting old codes to avoid timeout)
   */
  async createCodeForTransfer(userId: string, email: string): Promise<TwoFactorCode> {
    try {
      // Generate new code
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save to database
      const twoFactorCode = await prisma.twoFactorCode.create({
        data: {
          userId,
          code,
          expiresAt,
          used: false
        }
      });

      // Send email
      await this.sendTwoFactorEmail(email, code);

      return twoFactorCode;
    } catch (error) {
      console.error('Error creating 2FA code for transfer:', error);
      throw new Error('Failed to create 2FA code for transfer');
    }
  }

  /**
   * Create a new 2FA code for user
   */
  async createCode(userId: string, email: string): Promise<TwoFactorCode> {
    try {
      // Temporarily disable deleteMany to avoid timeout
      // TODO: Implement cleanup job for old OTP codes
      /*
      try {
        await prisma.twoFactorCode.deleteMany({
          where: {
            userId,
            used: false,
            expiresAt: {
              lt: new Date()
            }
          }
        });
      } catch (deleteError) {
        console.warn('Failed to delete old OTP codes:', deleteError);
        // Continue with creating new code even if delete fails
      }
      */

      // Generate new code
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Save to database
      const twoFactorCode = await prisma.twoFactorCode.create({
        data: {
          userId,
          code,
          expiresAt,
          used: false
        }
      });

      // Send email
      await this.sendTwoFactorEmail(email, code);

      return twoFactorCode;
    } catch (error) {
      console.error('Error creating 2FA code:', error);
      throw new Error('Failed to create 2FA code');
    }
  }

  /**
   * Verify 2FA code
   */
  async verifyCode(userId: string, code: string): Promise<boolean> {
    const twoFactorCode = await prisma.twoFactorCode.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!twoFactorCode) {
      return false;
    }

    // Mark code as used
    await prisma.twoFactorCode.update({
      where: { id: twoFactorCode.id },
      data: { used: true }
    });

    return true;
  }

  /**
   * Send 2FA code via email
   */
  private async sendTwoFactorEmail(email: string, code: string): Promise<void> {
    const subject = 'Your Banking System 2FA Code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">Banking System</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Two-Factor Authentication</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Your Verification Code</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </div>
          </div>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
            Enter this code in the 2FA verification page to complete your login. 
            This code will expire in <strong>10 minutes</strong>.
          </p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Security Tip:</strong> Never share this code with anyone. 
              Banking System will never ask for this code via phone or email.
            </p>
          </div>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            If you didn't request this code, please ignore this email and contact support immediately.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
          <p>© 2024 Banking System. All rights reserved.</p>
        </div>
      </div>
    `;

    await EmailService.sendEmail(email, subject, html);
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    return user?.twoFactorEnabled || false;
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false }
    });

    // Delete all 2FA codes for this user
    await prisma.twoFactorCode.deleteMany({
      where: { userId }
    });
  }

  /**
   * Get user's 2FA status
   */
  async getTwoFactorStatus(userId: string): Promise<{
    enabled: boolean;
    lastUsed?: Date;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        twoFactorCodes: {
          where: { used: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true }
        }
      }
    });

    return {
      enabled: user?.twoFactorEnabled || false,
      lastUsed: user?.twoFactorCodes[0]?.createdAt
    };
  }
}

export const twoFactorService = TwoFactorService.getInstance(); 