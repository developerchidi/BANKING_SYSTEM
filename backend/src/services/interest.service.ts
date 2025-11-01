import { PrismaClient } from '@prisma/client';
import { TransactionService } from './transaction.service';

const prisma = new PrismaClient();

export interface InterestCalculationResult {
  userId: string;
  accountId: string;
  interestType: string;
  interestRate: number;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface InterestRateConfig {
  accountType: string;
  tier: string;
  annualRate: number;
  minimumBalance: number;
}

export class InterestService {
  /**
   * Tính lãi suất cho tất cả tài khoản tiết kiệm
   */
  static async calculateMonthlyInterest(): Promise<InterestCalculationResult[]> {
    console.log('🏦 InterestService: Starting monthly interest calculation...');
    
    const results: InterestCalculationResult[] = [];
    
    try {
      // Lấy tất cả tài khoản tiết kiệm có số dư > 0
      const savingsAccounts = await prisma.account.findMany({
        where: {
          accountType: 'SAVINGS',
          balance: { gt: 0 },
          isActive: true,
        },
        include: {
          user: true,
        },
      });

      console.log(`📊 Found ${savingsAccounts.length} savings accounts to process`);

      for (const account of savingsAccounts) {
        try {
          const result = await this.calculateAccountInterest(account.id);
          if (result) {
            results.push(result);
          }
        } catch (error) {
          console.error(`❌ Error calculating interest for account ${account.id}:`, error);
        }
      }

      console.log(`✅ Successfully calculated interest for ${results.length} accounts`);
      return results;
    } catch (error) {
      console.error('❌ Error in calculateMonthlyInterest:', error);
      throw error;
    }
  }

  /**
   * Tính lãi suất cho một tài khoản cụ thể
   */
  static async calculateAccountInterest(accountId: string): Promise<InterestCalculationResult | null> {
    try {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        include: { user: true },
      });

      if (!account || account.balance <= 0) {
        return null;
      }

      // Lấy lãi suất hiện tại
      const interestRate = await this.getCurrentInterestRate(account.accountType, 'STANDARD');
      
      if (!interestRate) {
        console.log(`⚠️ No interest rate found for account type: ${account.accountType}`);
        return null;
      }

      // Tính toán thời gian
      const now = new Date();
      const lastInterestDate = account.lastInterestDate || account.createdAt;
      const periodStart = new Date(lastInterestDate);
      const periodEnd = new Date(now);

      // Tính số ngày trong kỳ
      const daysInPeriod = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysInPeriod < 1) {
        console.log(`⚠️ Period too short for account ${accountId}: ${daysInPeriod} days`);
        return null;
      }

      // Tính lãi suất theo ngày
      const dailyRate = interestRate.annualRate / 365;
      const interestAmount = account.balance * dailyRate * daysInPeriod;
      const totalAmount = account.balance + interestAmount;

      const result: InterestCalculationResult = {
        userId: account.userId,
        accountId: account.id,
        interestType: 'SAVINGS',
        interestRate: interestRate.annualRate,
        principalAmount: account.balance,
        interestAmount: Math.round(interestAmount * 100) / 100, // Làm tròn 2 chữ số thập phân
        totalAmount: Math.round(totalAmount * 100) / 100,
        periodStart,
        periodEnd,
      };

      return result;
    } catch (error) {
      console.error(`❌ Error calculating interest for account ${accountId}:`, error);
      return null;
    }
  }

  /**
   * Lưu lãi suất vào database và cập nhật số dư tài khoản
   */
  static async postInterest(calculation: InterestCalculationResult): Promise<boolean> {
    try {
      console.log(`💰 Posting interest for account ${calculation.accountId}: ${calculation.interestAmount} VND`);

      // Bắt đầu transaction
      await prisma.$transaction(async (tx) => {
        // Tạo bản ghi lãi suất
        const interestRecord = await tx.interest.create({
          data: {
            userId: calculation.userId,
            accountId: calculation.accountId,
            interestType: calculation.interestType,
            interestRate: calculation.interestRate,
            principalAmount: calculation.principalAmount,
            interestAmount: calculation.interestAmount,
            totalAmount: calculation.totalAmount,
            calculationDate: new Date(),
            periodStart: calculation.periodStart,
            periodEnd: calculation.periodEnd,
            status: 'PENDING',
          },
        });

        // Tạo transaction để cộng lãi vào tài khoản
        const transaction = await TransactionService.createTransaction({
          userId: calculation.userId,
          type: 'INTEREST',
          amount: calculation.interestAmount,
          description: `Lãi suất tiết kiệm tháng ${calculation.periodEnd.getMonth() + 1}/${calculation.periodEnd.getFullYear()}`,
          // senderAccountId không cần thiết cho lãi suất
          receiverAccountId: calculation.accountId,
        });

        // Cập nhật số dư tài khoản
        await tx.account.update({
          where: { id: calculation.accountId },
          data: {
            balance: calculation.totalAmount,
            availableBalance: calculation.totalAmount,
            lastInterestDate: calculation.periodEnd,
          },
        });

        // Cập nhật trạng thái lãi suất
        await tx.interest.update({
          where: { id: interestRecord.id },
          data: {
            status: 'POSTED',
            postedAt: new Date(),
            transactionId: transaction.id,
          },
        });
      });

      console.log(`✅ Successfully posted interest for account ${calculation.accountId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error posting interest for account ${calculation.accountId}:`, error);
      return false;
    }
  }

  /**
   * Lấy lãi suất hiện tại cho loại tài khoản
   */
  static async getCurrentInterestRate(accountType: string, tier: string = 'STANDARD'): Promise<InterestRateConfig | null> {
    try {
      const rate = await prisma.interestRate.findFirst({
        where: {
          accountType,
          tier,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: 'desc' },
      });

      if (!rate) {
        return null;
      }

      return {
        accountType: rate.accountType,
        tier: rate.tier,
        annualRate: rate.annualRate,
        minimumBalance: rate.minimumBalance,
      };
    } catch (error) {
      console.error('❌ Error getting interest rate:', error);
      return null;
    }
  }

  /**
   * Lấy lịch sử lãi suất của user
   */
  static async getUserInterestHistory(userId: string, limit: number = 50) {
    try {
      return await prisma.interest.findMany({
        where: { userId },
        include: {
          account: {
            select: {
              accountNumber: true,
              accountName: true,
              accountType: true,
            },
          },
        },
        orderBy: { calculationDate: 'desc' },
        take: limit,
      });
    } catch (error) {
      console.error('❌ Error getting user interest history:', error);
      throw error;
    }
  }

  /**
   * Lấy tổng lãi suất của user trong năm
   */
  static async getUserYearlyInterest(userId: string, year: number = new Date().getFullYear()) {
    try {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);

      const result = await prisma.interest.aggregate({
        where: {
          userId,
          status: 'POSTED',
          calculationDate: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        _sum: {
          interestAmount: true,
        },
        _count: {
          id: true,
        },
      });

      return {
        totalInterest: result._sum.interestAmount || 0,
        transactionCount: result._count.id,
        year,
      };
    } catch (error) {
      console.error('❌ Error getting yearly interest:', error);
      throw error;
    }
  }

  /**
   * Khởi tạo lãi suất mặc định
   */
  static async initializeDefaultRates() {
    try {
      console.log('🏦 Initializing default interest rates...');

      const defaultRates = [
        {
          accountType: 'SAVINGS',
          tier: 'STANDARD',
          annualRate: 6.0, // 6% per year
          minimumBalance: 0,
        },
        {
          accountType: 'SAVINGS',
          tier: 'PREMIUM',
          annualRate: 7.0, // 7% per year
          minimumBalance: 10000000, // 10M VND
        },
        {
          accountType: 'SAVINGS',
          tier: 'VIP',
          annualRate: 8.0, // 8% per year
          minimumBalance: 50000000, // 50M VND
        },
      ];

      for (const rate of defaultRates) {
        await prisma.interestRate.upsert({
          where: {
            accountType_tier: {
              accountType: rate.accountType,
              tier: rate.tier,
            },
          },
          update: {
            annualRate: rate.annualRate,
            minimumBalance: rate.minimumBalance,
            isActive: true,
          },
          create: {
            ...rate,
            effectiveFrom: new Date(),
          },
        });
      }

      console.log('✅ Default interest rates initialized');
    } catch (error) {
      console.error('❌ Error initializing default rates:', error);
      throw error;
    }
  }
}
