import { prisma } from '../config/database';
import { DatabaseService, BANKING_CONSTANTS, AccountWithTransactions } from './database.service';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

// Types
export interface CreateAccountData {
  accountType: string;
  accountName: string;
  currency?: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  interestRate?: number;
}

export interface AccountBalance {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  balance: number;
  availableBalance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  createdAt: Date;
}

export interface AccountStatement {
  account: AccountBalance;
  transactions: TransactionSummary[];
  summary: {
    totalTransactions: number;
    totalDeposits: number;
    totalWithdrawals: number;
    totalFees: number;
    periodStart: Date;
    periodEnd: Date;
  };
}

export interface TransactionSummary {
  id: string;
  transactionNumber: string;
  type: string;
  category: string;
  amount: number;
  fee: number;
  description: string | null;
  status: string;
  createdAt: Date;
  senderAccount?: {
    accountNumber: string;
    accountName: string;
  };
  receiverAccount?: {
    accountNumber: string;
    accountName: string;
  };
}

export class AccountService {
  // Get user accounts
  static async getUserAccounts(userId: string): Promise<AccountBalance[]> {
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        accountType: true,
        balance: true,
        availableBalance: true,
        currency: true,
        isActive: true,
        isFrozen: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return accounts.map(account => ({
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      balance: Number(account.balance),
      availableBalance: Number(account.availableBalance),
      currency: account.currency,
      isActive: account.isActive,
      isFrozen: account.isFrozen,
      createdAt: account.createdAt,
    }));
  }

  // Get account by ID
  static async getAccountById(accountId: string, userId: string): Promise<AccountBalance | null> {
    const account = await prisma.account.findFirst({
      where: { 
        id: accountId,
        userId,
      },
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        accountType: true,
        balance: true,
        availableBalance: true,
        currency: true,
        isActive: true,
        isFrozen: true,
        createdAt: true,
      },
    });

    if (!account) return null;

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      balance: Number(account.balance),
      availableBalance: Number(account.availableBalance),
      currency: account.currency,
      isActive: account.isActive,
      isFrozen: account.isFrozen,
      createdAt: account.createdAt,
    };
  }

  // Get account by account number
  static async getAccountByNumber(accountNumber: string, userId?: string): Promise<AccountBalance | null> {
    const account = await prisma.account.findFirst({
      where: { 
        accountNumber,
        ...(userId && { userId }),
      },
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        accountType: true,
        balance: true,
        availableBalance: true,
        currency: true,
        isActive: true,
        isFrozen: true,
        userId: true,
        createdAt: true,
      },
    });

    if (!account) return null;

    return {
      accountId: account.id,
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      accountType: account.accountType,
      balance: Number(account.balance),
      availableBalance: Number(account.availableBalance),
      currency: account.currency,
      isActive: account.isActive,
      isFrozen: account.isFrozen,
      createdAt: account.createdAt,
    };
  }

  // Create new account
  static async createAccount(userId: string, accountData: CreateAccountData): Promise<AccountBalance> {
    try {
      // Validate account type
      if (!DatabaseService.isValidAccountType(accountData.accountType)) {
        throw new Error('Invalid account type');
      }

      // Check if user already has this type of account (business rule)
      const existingAccount = await prisma.account.findFirst({
        where: {
          userId,
          accountType: accountData.accountType,
        },
      });

      if (existingAccount && accountData.accountType !== BANKING_CONSTANTS.ACCOUNT_TYPES.SAVINGS) {
        throw new Error(`You already have a ${accountData.accountType.toLowerCase()} account`);
      }

      // Generate unique account number
      let accountNumber: string;
      let isUnique = false;
      let attempts = 0;

      do {
        accountNumber = DatabaseService.generateAccountNumber();
        const existing = await prisma.account.findUnique({
          where: { accountNumber },
        });
        isUnique = !existing;
        attempts++;
      } while (!isUnique && attempts < 10);

      if (!isUnique) {
        throw new Error('Unable to generate unique account number');
      }

      const account = await prisma.account.create({
        data: {
          accountNumber,
          accountType: accountData.accountType,
          accountName: accountData.accountName,
          currency: accountData.currency || 'VND',
          userId,
          balance: 0,
          availableBalance: 0,
          dailyLimit: accountData.dailyLimit,
          monthlyLimit: accountData.monthlyLimit,
          interestRate: accountData.interestRate,
        },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'ACCOUNT_CREATED',
        tableName: 'accounts',
        recordId: account.id,
        userId,
        newValues: {
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          accountName: account.accountName,
        },
      });

      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        balance: Number(account.balance),
        availableBalance: Number(account.availableBalance),
        currency: account.currency,
        isActive: account.isActive,
        isFrozen: account.isFrozen,
        createdAt: account.createdAt,
      };
    } catch (error) {
      console.error('Create account error:', error);
      throw new Error('Failed to create account');
    }
  }

  // Get account transactions
  static async getAccountTransactions(
    accountId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: string;
      status?: string;
    } = {}
  ): Promise<{
    transactions: TransactionSummary[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    // Verify account ownership
    const account = await this.getAccountById(accountId, userId);
    if (!account) {
      throw new Error('Account not found or access denied');
    }

    const { skip, take, page, limit } = DatabaseService.getPaginationParams(
      options.page,
      options.limit
    );

    // Build where clause
    const where: any = {
      OR: [
        { senderAccountId: accountId },
        { receiverAccountId: accountId },
      ],
    };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    if (options.type) {
      where.type = options.type;
    }

    if (options.status) {
      where.status = options.status;
    }

    // Get transactions with count
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          senderAccount: {
            select: {
              accountNumber: true,
              accountName: true,
            },
          },
          receiverAccount: {
            select: {
              accountNumber: true,
              accountName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.transaction.count({ where }),
    ]);

    const transactionSummaries: TransactionSummary[] = transactions.map(tx => ({
      id: tx.id,
      transactionNumber: tx.transactionNumber,
      type: tx.type,
      category: tx.category,
      amount: Number(tx.amount),
      fee: Number(tx.fee),
      description: tx.description,
      status: tx.status,
      createdAt: tx.createdAt,
      senderAccount: tx.senderAccount ? {
        accountNumber: tx.senderAccount.accountNumber,
        accountName: tx.senderAccount.accountName,
      } : undefined,
      receiverAccount: tx.receiverAccount ? {
        accountNumber: tx.receiverAccount.accountNumber,
        accountName: tx.receiverAccount.accountName,
      } : undefined,
    }));

    return {
      transactions: transactionSummaries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get account statement
  static async getAccountStatement(
    accountId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AccountStatement> {
    // Verify account ownership
    const account = await this.getAccountById(accountId, userId);
    if (!account) {
      throw new Error('Account not found or access denied');
    }

    // Get transactions for the period
    const { transactions } = await this.getAccountTransactions(accountId, userId, {
      startDate,
      endDate,
      limit: 1000, // Large limit for statement
    });

    // Calculate summary
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let totalFees = 0;

    transactions.forEach(tx => {
      totalFees += tx.fee;

      if (tx.receiverAccount?.accountNumber === account.accountNumber) {
        // Money coming in
        totalDeposits += tx.amount;
      } else if (tx.senderAccount?.accountNumber === account.accountNumber) {
        // Money going out
        totalWithdrawals += tx.amount;
      }
    });

    return {
      account,
      transactions,
      summary: {
        totalTransactions: transactions.length,
        totalDeposits,
        totalWithdrawals,
        totalFees,
        periodStart: startDate,
        periodEnd: endDate,
      },
    };
  }

  // Update account limits
  static async updateAccountLimits(
    accountId: string,
    userId: string,
    limits: {
      dailyLimit?: number;
      monthlyLimit?: number;
    }
  ): Promise<AccountBalance> {
    // Verify account ownership
    const existingAccount = await this.getAccountById(accountId, userId);
    if (!existingAccount) {
      throw new Error('Account not found or access denied');
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        dailyLimit: limits.dailyLimit,
        monthlyLimit: limits.monthlyLimit,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await DatabaseService.createAuditLog({
      action: 'ACCOUNT_LIMITS_UPDATED',
      tableName: 'accounts',
      recordId: accountId,
      userId,
      oldValues: {
        dailyLimit: existingAccount.balance, // This should be the old limits
        monthlyLimit: existingAccount.availableBalance,
      },
      newValues: limits,
    });

    return {
      accountId: updatedAccount.id,
      accountNumber: updatedAccount.accountNumber,
      accountName: updatedAccount.accountName,
      accountType: updatedAccount.accountType,
      balance: Number(updatedAccount.balance),
      availableBalance: Number(updatedAccount.availableBalance),
      currency: updatedAccount.currency,
      isActive: updatedAccount.isActive,
      isFrozen: updatedAccount.isFrozen,
      createdAt: updatedAccount.createdAt,
    };
  }

  // Freeze/Unfreeze account
  static async toggleAccountFreeze(
    accountId: string,
    userId: string,
    freeze: boolean,
    reason?: string
  ): Promise<AccountBalance> {
    // Verify account ownership
    const existingAccount = await this.getAccountById(accountId, userId);
    if (!existingAccount) {
      throw new Error('Account not found or access denied');
    }

    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        isFrozen: freeze,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await DatabaseService.createAuditLog({
      action: freeze ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN',
      tableName: 'accounts',
      recordId: accountId,
      userId,
      newValues: {
        isFrozen: freeze,
        reason,
      },
    });

    return {
      accountId: updatedAccount.id,
      accountNumber: updatedAccount.accountNumber,
      accountName: updatedAccount.accountName,
      accountType: updatedAccount.accountType,
      balance: Number(updatedAccount.balance),
      availableBalance: Number(updatedAccount.availableBalance),
      currency: updatedAccount.currency,
      isActive: updatedAccount.isActive,
      isFrozen: updatedAccount.isFrozen,
      createdAt: updatedAccount.createdAt,
    };
  }

  // Get accounts by user ID
  static async getAccountsByUserId(userId: string) {
    try {
      const accounts = await prismaClient.account.findMany({
        where: { userId },
        include: {
          cards: true,
        },
      });

      return accounts;
    } catch (error) {
      console.error('Get user accounts error:', error);
      throw new Error('Failed to get user accounts');
    }
  }

  // Update account status
  static async updateAccountStatus(accountId: string, status: string, userId: string) {
    try {
      const account = await prisma.account.update({
        where: {
          id: accountId,
          userId,
        },
        data: {
          isActive: status === 'ACTIVE',
          isFrozen: status === 'FROZEN',
        },
      });

      return {
        accountId: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        balance: Number(account.balance),
        availableBalance: Number(account.availableBalance),
        currency: account.currency,
        isActive: account.isActive,
        isFrozen: account.isFrozen,
        createdAt: account.createdAt,
      };
    } catch (error) {
      console.error('Update account status error:', error);
      throw new Error('Failed to update account status');
    }
  }

  // Add beneficiary
  static async addBeneficiary(
    accountId: string,
    beneficiaryData: {
      name: string;
      accountNumber: string;
      bankName: string;
      bankCode: string;
    },
    userId: string
  ) {
    try {
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId,
        },
      });

      if (!account) {
        throw new Error('Account not found');
      }

      const beneficiary = await prisma.beneficiary.create({
        data: {
          name: beneficiaryData.name,
          accountNumber: beneficiaryData.accountNumber,
          bankName: beneficiaryData.bankName,
          bankCode: beneficiaryData.bankCode,
          accountId,
        },
      });

      return beneficiary;
    } catch (error) {
      console.error('Add beneficiary error:', error);
      throw new Error('Failed to add beneficiary');
    }
  }

  // Get beneficiaries by account ID
  static async getBeneficiariesByAccountId(accountId: string) {
    try {
      const beneficiaries = await prisma.beneficiary.findMany({
        where: {
          accountId,
        },
      });

      return beneficiaries;
    } catch (error) {
      console.error('Get beneficiaries error:', error);
      throw new Error('Failed to get beneficiaries');
    }
  }

  // Get beneficiaries by user ID
  static async getBeneficiariesByUserId(userId: string) {
    try {
      const beneficiaries = await prisma.beneficiary.findMany({
        where: {
          account: {
            userId,
          },
        },
        include: {
          account: {
            select: {
              accountNumber: true,
              accountName: true,
            },
          },
        },
      });

      return beneficiaries;
    } catch (error) {
      console.error('Get user beneficiaries error:', error);
      throw new Error('Failed to get user beneficiaries');
    }
  }

  // Remove beneficiary
  static async removeBeneficiary(beneficiaryId: string, userId: string) {
    try {
      // Verify beneficiary ownership through account
      const beneficiary = await prisma.beneficiary.findFirst({
        where: {
          id: beneficiaryId,
          account: {
            userId,
          },
        },
      });

      if (!beneficiary) {
        throw new Error('Beneficiary not found or access denied');
      }

      await prisma.beneficiary.delete({
        where: {
          id: beneficiaryId,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Remove beneficiary error:', error);
      throw new Error('Failed to remove beneficiary');
    }
  }

  // Generate unique account number (using DatabaseService)
  private static generateAccountNumber(): string {
    return DatabaseService.generateAccountNumber();
  }
}

export default AccountService; 