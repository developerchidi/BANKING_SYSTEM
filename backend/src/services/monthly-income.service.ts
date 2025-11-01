import { prisma } from '../config/database';

export class MonthlyIncomeService {
  /**
   * Calculate monthly income for a user based on transactions and account balance
   * @param userId - User ID to calculate income for
   * @param month - Optional month (default: current month)
   * @returns Calculated monthly income in VND
   */
  static async calculateMonthlyIncome(
    userId: string, 
    month?: Date
  ): Promise<number> {
    try {
      const targetMonth = month || new Date();
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

      // Get all user accounts
      const userAccounts = await prisma.account.findMany({
        where: { userId },
        select: { id: true, accountNumber: true, balance: true }
      });

      if (userAccounts.length === 0) {
        return 0;
      }

      const accountIds = userAccounts.map(acc => acc.id);

      // Calculate income from incoming transactions (money received)
      const incomingTransactions = await prisma.transaction.aggregate({
        where: {
          receiverAccountId: { in: accountIds },
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          // Exclude internal transfers (same user)
          NOT: {
            senderAccountId: { in: accountIds }
          }
        },
        _sum: {
          amount: true
        }
      });

      // Calculate income from salary/income transactions (if tagged)
      const salaryTransactions = await prisma.transaction.aggregate({
        where: {
          OR: [
            { receiverAccountId: { in: accountIds } },
            { senderAccountId: { in: accountIds } }
          ],
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          // Look for salary/income keywords in description
          description: {
            contains: 'Lương'
          }
        },
        _sum: {
          amount: true
        }
      });

      // Calculate income from account balance growth
      const balanceIncome = await this.calculateBalanceIncome(userId, startOfMonth, endOfMonth);

      // Calculate income from interest earned
      const interestIncome = await this.calculateInterestIncome(userId, startOfMonth, endOfMonth);

      // Sum all income sources
      const incomingAmount = incomingTransactions._sum.amount || 0;
      const salaryAmount = salaryTransactions._sum.amount || 0;
      
      const totalMonthlyIncome = incomingAmount + salaryAmount + balanceIncome + interestIncome;

      // Apply minimum income based on account tier
      const minIncome = await this.getMinimumIncomeByTier(userId);
      
      return Math.max(totalMonthlyIncome, minIncome);

    } catch (error) {
      console.error('Calculate monthly income error:', error);
      return 0;
    }
  }

  /**
   * Calculate income from account balance growth
   */
  private static async calculateBalanceIncome(
    userId: string, 
    startOfMonth: Date, 
    endOfMonth: Date
  ): Promise<number> {
    try {
      // Get account balances at start and end of month
      const accountsAtStart = await prisma.account.findMany({
        where: { userId },
        select: { id: true, balance: true }
      });

      const accountsAtEnd = await prisma.account.findMany({
        where: { userId },
        select: { id: true, balance: true }
      });

      // Calculate total balance growth
      const startBalance = accountsAtStart.reduce((sum, acc) => sum + acc.balance, 0);
      const endBalance = accountsAtEnd.reduce((sum, acc) => sum + acc.balance, 0);
      
      const balanceGrowth = endBalance - startBalance;
      
      // Only count positive growth as income
      return Math.max(0, balanceGrowth);

    } catch (error) {
      console.error('Calculate balance income error:', error);
      return 0;
    }
  }

  /**
   * Calculate income from interest earned
   */
  private static async calculateInterestIncome(
    userId: string, 
    startOfMonth: Date, 
    endOfMonth: Date
  ): Promise<number> {
    try {
      const interestTransactions = await prisma.transaction.aggregate({
        where: {
          receiverAccountId: {
            in: await prisma.account.findMany({
              where: { userId },
              select: { id: true }
            }).then(accounts => accounts.map(acc => acc.id))
          },
          status: 'COMPLETED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          type: 'INTEREST'
        },
        _sum: {
          amount: true
        }
      });

      return interestTransactions._sum.amount || 0;

    } catch (error) {
      console.error('Calculate interest income error:', error);
      return 0;
    }
  }

  /**
   * Get minimum income based on user's account tier
   */
  private static async getMinimumIncomeByTier(userId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountTier: true }
      });

      if (!user) return 0;

      const tierMinimums = {
        'BASIC': 0,
        'STANDARD': 5000000,    // 5M VND
        'PREMIUM': 20000000,    // 20M VND
        'VIP': 50000000         // 50M VND
      };

      return tierMinimums[user.accountTier as keyof typeof tierMinimums] || 0;

    } catch (error) {
      console.error('Get minimum income by tier error:', error);
      return 0;
    }
  }

  /**
   * Update user's monthly income in database
   */
  static async updateUserMonthlyIncome(userId: string, month?: Date): Promise<number> {
    try {
      const calculatedIncome = await this.calculateMonthlyIncome(userId, month);
      
      await prisma.user.update({
        where: { id: userId },
        data: { monthlyIncome: calculatedIncome }
      });

      return calculatedIncome;

    } catch (error) {
      console.error('Update user monthly income error:', error);
      throw new Error('Failed to update monthly income');
    }
  }

  /**
   * Batch update monthly income for all users
   */
  static async batchUpdateAllUsersMonthlyIncome(): Promise<void> {
    try {
      console.log('🔄 Starting batch update of monthly income for all users...');

      const users = await prisma.user.findMany({
        select: { id: true, email: true, accountTier: true }
      });

      let updatedCount = 0;
      let errorCount = 0;

      for (const user of users) {
        try {
          const income = await this.calculateMonthlyIncome(user.id);
          
          await prisma.user.update({
            where: { id: user.id },
            data: { monthlyIncome: income }
          });

          console.log(`✅ Updated ${user.email} (${user.accountTier}): ${income.toLocaleString()} VND`);
          updatedCount++;

        } catch (error) {
          console.error(`❌ Failed to update ${user.email}:`, error);
          errorCount++;
        }
      }

      console.log(`\n📊 Batch update completed:`);
      console.log(`✅ Successfully updated: ${updatedCount} users`);
      console.log(`❌ Failed: ${errorCount} users`);

    } catch (error) {
      console.error('Batch update monthly income error:', error);
      throw new Error('Failed to batch update monthly income');
    }
  }

  /**
   * Get monthly income breakdown for a user
   */
  static async getMonthlyIncomeBreakdown(userId: string, month?: Date) {
    try {
      const targetMonth = month || new Date();
      const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
      const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0, 23, 59, 59);

      const userAccounts = await prisma.account.findMany({
        where: { userId },
        select: { id: true }
      });

      const accountIds = userAccounts.map(acc => acc.id);

      // Get detailed breakdown
      const incomingTransactions = await prisma.transaction.findMany({
        where: {
          receiverAccountId: { in: accountIds },
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          NOT: { senderAccountId: { in: accountIds } }
        },
        select: {
          amount: true,
          description: true,
          createdAt: true,
          senderAccount: {
            select: { accountName: true, accountNumber: true }
          }
        }
      });

      const salaryTransactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { receiverAccountId: { in: accountIds } },
            { senderAccountId: { in: accountIds } }
          ],
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          description: { contains: 'Lương' }
        },
        select: {
          amount: true,
          description: true,
          createdAt: true
        }
      });

      const interestTransactions = await prisma.transaction.findMany({
        where: {
          receiverAccountId: { in: accountIds },
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          type: 'INTEREST'
        },
        select: {
          amount: true,
          description: true,
          createdAt: true
        }
      });

      return {
        totalIncome: await this.calculateMonthlyIncome(userId, month),
        breakdown: {
          incomingTransactions: incomingTransactions,
          salaryTransactions: salaryTransactions,
          interestTransactions: interestTransactions,
          balanceGrowth: await this.calculateBalanceIncome(userId, startOfMonth, endOfMonth)
        }
      };

    } catch (error) {
      console.error('Get monthly income breakdown error:', error);
      throw new Error('Failed to get monthly income breakdown');
    }
  }
}
