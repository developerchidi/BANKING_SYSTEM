import { prisma } from '../config/database';
import { DatabaseService } from './database.service';
import { Card } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export class CardService {
  // Create new card
  static async createCard(
    userId: string,
    accountId: string,
    cardType: string,
    pin: string
  ): Promise<Card> {
    try {
      // Generate card number
      const cardNumber = this.generateCardNumber();
      // Generate CVV
      const cvv = this.generateCVV();
      // Set expiry date (3 years from now)
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 10);

      // Infer tier and default limits at issuance
      const tier = await this.inferUserTier(userId);
      const defaultLimits = this.getTierDefaultLimits(tier);

      const card = await prisma.card.create({
        data: {
          cardNumber,
          cardType,
          cardBrand: 'VISA', // Default to VISA for now
          cvv,
          pinHash,
          expiryMonth: expiryDate.getMonth() + 1,
          expiryYear: expiryDate.getFullYear(),
          cardholderName: '', // This should be set from user data
          isActive: true,
          isBlocked: false,
          userId,
          accountId,
          dailyLimit: defaultLimits.dailyLimit,
          monthlyLimit: defaultLimits.monthlyLimit,
          atmDailyLimit: defaultLimits.atmDailyLimit,
        },
      });

      // Create audit log
      DatabaseService.createAuditLog({
        action: 'CREATE_CARD',
        tableName: 'cards',
        recordId: card.id,
        userId,
      });

      return card;
    } catch (error) {
      console.error('Create card error:', error);
      throw new Error('Failed to create card');
    }
  }

  // Get card by ID
  static async getCardById(cardId: string): Promise<Card | null> {
    try {
      const card = await prisma.card.findUnique({
        where: { id: cardId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          account: true,
        },
      });

      if (!card) {
        throw new Error('Card not found');
      }

      return card;
    } catch (error) {
      console.error('Get card error:', error);
      throw new Error('Failed to get card');
    }
  }

  // Get cards by user ID
  static async getCardsByUserId(userId: string): Promise<Card[]> {
    try {
      const cards = await prisma.card.findMany({
        where: { userId },
        include: {
          account: true,
        },
      });

      return cards;
    } catch (error) {
      console.error('Get user cards error:', error);
      throw new Error('Failed to get user cards');
    }
  }

  // Update card status
  static async updateCardStatus(cardId: string, isActive: boolean, isBlocked: boolean, blockReason?: string): Promise<Card> {
    try {
      const card = await prisma.card.update({
        where: { id: cardId },
        data: {
          isActive,
          isBlocked,
          blockReason,
        },
      });

      // Create audit log
      DatabaseService.createAuditLog({
        action: 'UPDATE_CARD_STATUS',
        tableName: 'cards',
        recordId: cardId,
        userId: card.userId,
      });

      return card;
    } catch (error) {
      console.error('Update card status error:', error);
      throw new Error('Failed to update card status');
    }
  }

  // Update card PIN
  static async updateCardPin(cardId: string, newPin: string): Promise<Card> {
    try {
      // Hash new PIN
      const pinHash = await bcrypt.hash(newPin, 10);

      const card = await prisma.card.update({
        where: { id: cardId },
        data: {
          pinHash,
          pinAttempts: 0,
          pinLockedUntil: null,
        },
      });

      // Create audit log
      DatabaseService.createAuditLog({
        action: 'UPDATE_CARD_PIN',
        tableName: 'cards',
        recordId: cardId,
        userId: card.userId,
      });

      return card;
    } catch (error) {
      console.error('Update card PIN error:', error);
      throw new Error('Failed to update card PIN');
    }
  }

  // Update card limits
  static async updateCardLimits(
    cardId: string,
    limits: { dailyLimit?: number; monthlyLimit?: number; atmDailyLimit?: number }
  ): Promise<Card> {
    try {
      const card = await prisma.card.update({
        where: { id: cardId },
        data: {
          dailyLimit: limits.dailyLimit,
          monthlyLimit: limits.monthlyLimit,
          atmDailyLimit: limits.atmDailyLimit,
        },
      });

      DatabaseService.createAuditLog({
        action: 'UPDATE_CARD_LIMITS',
        tableName: 'cards',
        recordId: cardId,
        userId: card.userId,
      });

      return card;
    } catch (error) {
      console.error('Update card limits error:', error);
      throw new Error('Failed to update card limits');
    }
  }

  // Infer user tier from accountTier field
  static async inferUserTier(userId: string): Promise<'BASIC' | 'STANDARD' | 'PREMIUM' | 'VIP'> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { accountTier: true },
    });
    const tier = user?.accountTier as 'BASIC' | 'STANDARD' | 'PREMIUM' | 'VIP';
    return tier || 'BASIC';
  }

  // Tier default limits (VND). These should align with business policy
  static getTierDefaultLimits(tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'VIP') {
    switch (tier) {
      case 'VIP':
        return { dailyLimit: 500_000_000, monthlyLimit: 5_000_000_000, atmDailyLimit: 50_000_000 };
      case 'PREMIUM':
        return { dailyLimit: 300_000_000, monthlyLimit: 3_000_000_000, atmDailyLimit: 20_000_000 };
      case 'STANDARD':
        return { dailyLimit: 100_000_000, monthlyLimit: 1_000_000_000, atmDailyLimit: 10_000_000 };
      default:
        return { dailyLimit: 20_000_000, monthlyLimit: 200_000_000, atmDailyLimit: 5_000_000 };
    }
  }

  // Create virtual card (cardType: VIRTUAL)
  static async createVirtualCard(
    userId: string,
    accountId: string,
    pin: string
  ): Promise<Card> {
    return await this.createCard(userId, accountId, 'VIRTUAL', pin);
  }

  // Generate unique card number
  private static generateCardNumber(): string {
    const prefix = '4111'; // Visa prefix
    const random = Math.floor(Math.random() * 1000000000000000).toString().padStart(12, '0');
    return `${prefix}${random}`;
  }

  // Generate CVV
  private static generateCVV(): string {
    return Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
} 