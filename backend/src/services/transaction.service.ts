import { prisma } from '../config/database';
import { DatabaseService, BANKING_CONSTANTS } from './database.service';
import { AccountService } from './account.service';
import { TwoFactorService } from './two-factor.service';
import { Transaction } from '@prisma/client';

// Types
export interface TransferData {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
  reference?: string;
}

export interface DepositData {
  accountId: string;
  amount: number;
  description?: string;
  reference?: string;
}

export interface WithdrawalData {
  accountId: string;
  amount: number;
  description?: string;
  reference?: string;
}

export interface TransactionResult {
  transactionId: string;
  transactionNumber: string;
  status: string;
  amount: number;
  fee: number;
  fromAccount?: {
    accountNumber: string;
    newBalance: number;
  };
  toAccount?: {
    accountNumber: string;
    newBalance: number;
  };
  createdAt: Date;
}

export class TransactionService {
  // Calculate transaction fee
  static calculateTransactionFee(amount: number, transactionType: string): number {
    // Fee disabled per business rule: all transactions are free for now
    return 0;
  }

  // Internal transfer between accounts
  static async internalTransfer(userId: string, transferData: TransferData): Promise<TransactionResult> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get sender account
      const senderAccount = await tx.account.findFirst({
        where: {
          id: transferData.fromAccountId,
          userId,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!senderAccount) {
        throw new Error('Sender account not found or is frozen');
      }

      // Get receiver account by account number
      const receiverAccount = await tx.account.findUnique({
        where: {
          accountNumber: transferData.toAccountNumber,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!receiverAccount) {
        throw new Error('Receiver account not found or is frozen');
      }

      // Allow self-transfer but handle atomically to avoid double counting

      // Calculate fee
      const fee = this.calculateTransactionFee(
        transferData.amount,
        BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER
      );

      const totalAmount = transferData.amount + fee;

      // Check sufficient balance
      if (Number(senderAccount.availableBalance) < totalAmount) {
        throw new Error('Insufficient funds');
      }

      // Generate transaction number
      const transactionNumber = DatabaseService.generateTransactionNumber();

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER,
          category: BANKING_CONSTANTS.TRANSACTION_CATEGORIES.INTERNAL_TRANSFER,
          amount: transferData.amount,
          fee,
          currency: senderAccount.currency,
          description: transferData.description,
          reference: transferData.reference,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.PROCESSING,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          userId,
        },
      });

      // Perform debit then credit atomically. For self-transfer, both apply on same account.
      const updatedSenderAccount = await tx.account.update({
        where: { id: senderAccount.id },
        data: {
          balance: { decrement: totalAmount },
          availableBalance: { decrement: totalAmount },
        },
      });

      const updatedReceiverAccount = await tx.account.update({
        where: { id: receiverAccount.id },
        data: {
          balance: { increment: transferData.amount },
          availableBalance: { increment: transferData.amount },
        },
      });

      // Update transaction status to completed
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'TRANSFER_COMPLETED',
        tableName: 'transactions',
        recordId: transaction.id,
        userId,
        newValues: {
          transactionNumber: transaction.transactionNumber,
          amount: transferData.amount,
          fee,
          fromAccount: senderAccount.accountNumber,
          toAccount: receiverAccount.accountNumber,
        },
      });

      return {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
        amount: transferData.amount,
        fee,
        fromAccount: {
          accountNumber: senderAccount.accountNumber,
          newBalance: Number(updatedSenderAccount.balance),
        },
        toAccount: {
          accountNumber: receiverAccount.accountNumber,
          newBalance: Number(updatedReceiverAccount.balance),
        },
        createdAt: transaction.createdAt,
      };
    });
  }

  // Deposit money to account
  static async deposit(userId: string, depositData: DepositData): Promise<TransactionResult> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get account
      const account = await tx.account.findFirst({
        where: {
          id: depositData.accountId,
          userId,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!account) {
        throw new Error('Account not found or is frozen');
      }

      // Calculate fee
      const fee = this.calculateTransactionFee(
        depositData.amount,
        BANKING_CONSTANTS.TRANSACTION_TYPES.DEPOSIT
      );

      // Generate transaction number
      const transactionNumber = DatabaseService.generateTransactionNumber();

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: BANKING_CONSTANTS.TRANSACTION_TYPES.DEPOSIT,
          category: BANKING_CONSTANTS.TRANSACTION_CATEGORIES.OTHER,
          amount: depositData.amount,
          fee,
          currency: account.currency,
          description: depositData.description || 'Cash deposit',
          reference: depositData.reference,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
          receiverAccountId: account.id,
          userId,
          processedAt: new Date(),
        },
      });

      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: Number(account.balance) + depositData.amount,
          availableBalance: Number(account.availableBalance) + depositData.amount,
        },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'DEPOSIT_COMPLETED',
        tableName: 'transactions',
        recordId: transaction.id,
        userId,
        newValues: {
          transactionNumber: transaction.transactionNumber,
          amount: depositData.amount,
          account: account.accountNumber,
        },
      });

      return {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
        amount: depositData.amount,
        fee,
        toAccount: {
          accountNumber: account.accountNumber,
          newBalance: Number(updatedAccount.balance),
        },
        createdAt: transaction.createdAt,
      };
    });
  }

  // Withdraw money from account
  static async withdraw(userId: string, withdrawalData: WithdrawalData): Promise<TransactionResult> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get account
      const account = await tx.account.findFirst({
        where: {
          id: withdrawalData.accountId,
          userId,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!account) {
        throw new Error('Account not found or is frozen');
      }

      // Calculate fee
      const fee = this.calculateTransactionFee(
        withdrawalData.amount,
        BANKING_CONSTANTS.TRANSACTION_TYPES.WITHDRAWAL
      );

      const totalAmount = withdrawalData.amount + fee;

      // Check sufficient balance
      if (Number(account.availableBalance) < totalAmount) {
        throw new Error('Insufficient funds');
      }

      // Generate transaction number
      const transactionNumber = DatabaseService.generateTransactionNumber();

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: BANKING_CONSTANTS.TRANSACTION_TYPES.WITHDRAWAL,
          category: BANKING_CONSTANTS.TRANSACTION_CATEGORIES.ATM_WITHDRAWAL,
          amount: withdrawalData.amount,
          fee,
          currency: account.currency,
          description: withdrawalData.description || 'ATM withdrawal',
          reference: withdrawalData.reference,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
          senderAccountId: account.id,
          userId,
          processedAt: new Date(),
        },
      });

      // Update account balance
      const updatedAccount = await tx.account.update({
        where: { id: account.id },
        data: {
          balance: Number(account.balance) - totalAmount,
          availableBalance: Number(account.availableBalance) - totalAmount,
        },
      });

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'WITHDRAWAL_COMPLETED',
        tableName: 'transactions',
        recordId: transaction.id,
        userId,
        newValues: {
          transactionNumber: transaction.transactionNumber,
          amount: withdrawalData.amount,
          fee,
          account: account.accountNumber,
        },
      });

      return {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
        amount: withdrawalData.amount,
        fee,
        fromAccount: {
          accountNumber: account.accountNumber,
          newBalance: Number(updatedAccount.balance),
        },
        createdAt: transaction.createdAt,
      };
    });
  }

  // Get transaction by ID
  static async getTransactionById(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId,
      },
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
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      type: transaction.type,
      category: transaction.category,
      amount: Number(transaction.amount),
      fee: Number(transaction.fee),
      currency: transaction.currency,
      description: transaction.description,
      reference: transaction.reference,
      status: transaction.status,
      processedAt: transaction.processedAt,
      createdAt: transaction.createdAt,
      senderAccount: transaction.senderAccount,
      receiverAccount: transaction.receiverAccount,
    };
  }

  static async createTransaction(data: {
    userId: string;
    type: string;
    amount: number;
    description?: string;
    senderAccountId?: string;
    receiverAccountId?: string;
  }): Promise<Transaction> {
    const transactionNumber = this.generateTransactionNumber();
    const category = this.getCategoryFromType(data.type);
    return prisma.transaction.create({
      data: {
        transactionNumber,
        type: data.type,
        category,
        amount: data.amount,
        description: data.description,
        userId: data.userId,
        senderAccountId: data.senderAccountId,
        receiverAccountId: data.receiverAccountId,
      },
    });
  }

  static async getTransactionsByUserId(userId: string): Promise<Transaction[]> {
    return prisma.transaction.findMany({
      where: { userId },
      include: {
        senderAccount: true,
        receiverAccount: true,
      },
    });
  }

  // Get transactions by account ID
  static async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await prisma.transaction.findMany({
      where: {
        OR: [
          { senderAccountId: accountId },
          { receiverAccountId: accountId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get user transactions with pagination and filters
  static async getUserTransactions(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      type?: string;
      status?: string;
      accountId?: string;
    } = {}
  ): Promise<{
    transactions: Transaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId };

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

    if (options.accountId) {
      where.OR = [
        { senderAccountId: options.accountId },
        { receiverAccountId: options.accountId },
      ];
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
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
      take: limit,
    });

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Cancel transaction
  static async cancelTransaction(
    transactionId: string,
    userId: string,
    reason?: string
  ): Promise<Transaction> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get transaction
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          status: {
            in: [
              BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
              BANKING_CONSTANTS.TRANSACTION_STATUS.PROCESSING,
            ],
          },
        },
        include: {
          senderAccount: true,
          receiverAccount: true,
        },
      });

      if (!transaction) {
        throw new Error('Transaction not found or cannot be cancelled');
      }

      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.CANCELLED,
          cancelledAt: new Date(),
          cancellationReason: reason,
        },
      });

      // Reverse the transaction if it was completed
      if (transaction.status === BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED) {
        // Reverse sender account balance
        if (transaction.senderAccount) {
          await tx.account.update({
            where: { id: transaction.senderAccount.id },
            data: {
              balance: Number(transaction.senderAccount.balance) + transaction.amount + transaction.fee,
              availableBalance: Number(transaction.senderAccount.availableBalance) + transaction.amount + transaction.fee,
            },
          });
        }

        // Reverse receiver account balance
        if (transaction.receiverAccount) {
          await tx.account.update({
            where: { id: transaction.receiverAccount.id },
            data: {
              balance: Number(transaction.receiverAccount.balance) - transaction.amount,
              availableBalance: Number(transaction.receiverAccount.availableBalance) - transaction.amount,
            },
          });
        }
      }

      // Create audit log
      await DatabaseService.createAuditLog({
        action: 'TRANSACTION_CANCELLED',
        tableName: 'transactions',
        recordId: transactionId,
        userId,
        newValues: {
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.CANCELLED,
          reason,
        },
      });

      return updatedTransaction;
    });
  }

  // Transfer money between accounts with enhanced security
  static async transferMoney(
    userId: string,
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string,
    transferType?: string,
    toAccountNumber?: string
  ): Promise<Transaction> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Check for duplicate transaction using idempotency key
      if (idempotencyKey) {
        const existingTransaction = await tx.transaction.findFirst({
          where: {
            idempotencyKey,
            status: {
              in: [
                BANKING_CONSTANTS.TRANSACTION_STATUS.PROCESSING,
                BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
              ],
            },
          },
        });

        if (existingTransaction) {
          throw new Error('Duplicate transaction detected');
        }
      }

      // Enhanced validation
      if (!amount || amount <= 0) {
        throw new Error('Invalid transfer amount');
      }

      if (senderAccountId === receiverAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      // Get sender account with enhanced validation
      const senderAccount = await tx.account.findFirst({
        where: {
          id: senderAccountId,
          userId,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!senderAccount) {
        throw new Error('Sender account not found, inactive, or frozen');
      }

      // Get receiver account with enhanced validation
      let receiverAccount;
      if (transferType === 'external') {
        receiverAccount = await tx.account.findUnique({
          where: {
            accountNumber: toAccountNumber,
            // isActive: true, // Prisma findUnique chỉ nhận unique fields
          },
        });
        if (!receiverAccount || !receiverAccount.isActive || receiverAccount.isFrozen) {
          throw new Error('Receiver account not found, inactive, or frozen');
        }
      } else {
        receiverAccount = await tx.account.findUnique({
          where: {
            id: receiverAccountId,
            // isActive: true, // Prisma findUnique chỉ nhận unique fields
          },
        });
        if (!receiverAccount || !receiverAccount.isActive || receiverAccount.isFrozen) {
          throw new Error('Receiver account not found, inactive, or frozen');
        }
      }

      // Prevent self-transfer regardless of input mode
      // Allow self-transfer; handle below

      // Validate currency compatibility
      if (senderAccount.currency !== receiverAccount.currency) {
        throw new Error('Currency mismatch between accounts');
      }

      // Calculate fee
      const fee = this.calculateTransactionFee(amount, BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER);

      // Enhanced balance validation (self-transfer only needs fee)
      const required = senderAccount.id === receiverAccount.id ? fee : amount + fee;
      if (Number(senderAccount.availableBalance) < required) {
        throw new Error(`Insufficient funds. Available: ${senderAccount.availableBalance}, Required: ${required}`);
      }

      // Check daily/monthly limits
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Check daily limit
      if (senderAccount.dailyLimit) {
        const dailyTransactions = await tx.transaction.aggregate({
          where: {
            senderAccountId: senderAccount.id,
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
            createdAt: {
              gte: startOfDay,
            },
          },
          _sum: {
            amount: true,
            fee: true,
          },
        });

        const dailyTotal = (dailyTransactions._sum.amount || 0) + (dailyTransactions._sum.fee || 0);
        if (dailyTotal + amount + fee > senderAccount.dailyLimit) {
          throw new Error(`Daily transfer limit exceeded. Daily total: ${dailyTotal}, Limit: ${senderAccount.dailyLimit}`);
        }
      }

      // Check monthly limit
      if (senderAccount.monthlyLimit) {
        const monthlyTransactions = await tx.transaction.aggregate({
          where: {
            senderAccountId: senderAccount.id,
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
            createdAt: {
              gte: startOfMonth,
            },
          },
          _sum: {
            amount: true,
            fee: true,
          },
        });

        const monthlyTotal = (monthlyTransactions._sum.amount || 0) + (monthlyTransactions._sum.fee || 0);
        if (monthlyTotal + amount + fee > senderAccount.monthlyLimit) {
          throw new Error(`Monthly transfer limit exceeded. Monthly total: ${monthlyTotal}, Limit: ${senderAccount.monthlyLimit}`);
        }
      }

      // Generate unique transaction number
      const transactionNumber = DatabaseService.generateTransactionNumber();

      // Create transaction record with PENDING status first
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER,
          category: BANKING_CONSTANTS.TRANSACTION_CATEGORIES.INTERNAL_TRANSFER,
          amount,
          fee,
          currency: senderAccount.currency,
          description,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          userId,
          idempotencyKey,
        },
      });

      try {
        let updatedSenderAccount;
        let updatedReceiverAccount;
        if (senderAccount.id === receiverAccount.id) {
          // Self-transfer: chỉ trừ phí, không ghi đè số dư bằng giá trị tuyệt đối
          updatedSenderAccount = await tx.account.update({
            where: { id: senderAccount.id },
            data: {
              balance: { decrement: fee },
              availableBalance: { decrement: fee },
              updatedAt: new Date(),
            },
          });
          updatedReceiverAccount = updatedSenderAccount;
        } else {
          // Khác tài khoản: trừ (amount + fee) ở sender, cộng amount ở receiver
          updatedSenderAccount = await tx.account.update({
            where: { id: senderAccount.id },
            data: {
              balance: { decrement: amount + fee },
              availableBalance: { decrement: amount + fee },
              updatedAt: new Date(),
            },
          });

          updatedReceiverAccount = await tx.account.update({
            where: { id: receiverAccount.id },
            data: {
              balance: { increment: amount },
              availableBalance: { increment: amount },
              updatedAt: new Date(),
            },
          });
        }

        // Update transaction status to COMPLETED
        const completedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
            processedAt: new Date(),
          },
        });

        // Lấy thông tin chi tiết tài khoản gửi/nhận
        const senderAccountFull = await tx.account.findUnique({ where: { id: senderAccount.id } });
        const receiverAccountFull = await tx.account.findUnique({ where: { id: receiverAccount.id } });

        // Create detailed audit log
        await DatabaseService.createAuditLog({
          action: 'TRANSFER_COMPLETED',
          tableName: 'transactions',
          recordId: transaction.id,
          userId,
          oldValues: {
            senderBalance: Number(senderAccount.balance),
            senderAvailableBalance: Number(senderAccount.availableBalance),
            receiverBalance: Number(receiverAccount.balance),
            receiverAvailableBalance: Number(receiverAccount.availableBalance),
          },
          newValues: {
            transactionNumber: transaction.transactionNumber,
            amount,
            fee,
            totalAmount: amount + fee,
            fromAccount: senderAccount.accountNumber,
            toAccount: receiverAccount.accountNumber,
            senderNewBalance: Number(updatedSenderAccount.balance),
            senderNewAvailableBalance: Number(updatedSenderAccount.availableBalance),
            receiverNewBalance: Number(updatedReceiverAccount.balance),
            receiverNewAvailableBalance: Number(updatedReceiverAccount.availableBalance),
            idempotencyKey,
          },
        });

        // Trả về transaction kèm thông tin tài khoản chi tiết
        return {
          ...completedTransaction,
          fromAccount: senderAccountFull,
          toAccount: receiverAccountFull,
        };

      } catch (error) {
        // If any step fails, update transaction status to FAILED
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.FAILED,
            failedAt: new Date(),
            failureReason: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        // Create audit log for failed transaction
        await DatabaseService.createAuditLog({
          action: 'TRANSFER_FAILED',
          tableName: 'transactions',
          recordId: transaction.id,
          userId,
          newValues: {
            transactionNumber: transaction.transactionNumber,
            amount,
            fee,
            failureReason: error instanceof Error ? error.message : 'Unknown error',
            idempotencyKey,
          },
        });

        throw error;
      }
    });
  }

  // Create pending transfer and send OTP (temporarily auto-completes for testing)
  static async createPendingTransfer(
    userId: string,
    senderAccountId: string,
    receiverAccountId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string,
    transferType?: string,
    toAccountNumber?: string
  ): Promise<{
    transactionId: string;
    transactionNumber: string;
    status: string;
    amount: number;
    fee: number;
    fromAccount: {
      accountNumber: string;
      newBalance: number;
    };
    toAccount: {
      accountNumber: string;
      newBalance: number;
    };
    userEmail: string;
  }> {
    return await DatabaseService.executeTransaction(async (tx) => {
      // Check for duplicate transaction using idempotency key
      if (idempotencyKey) {
        const existingTransaction = await tx.transaction.findFirst({
          where: {
            idempotencyKey,
            status: {
              in: [
                BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
                BANKING_CONSTANTS.TRANSACTION_STATUS.PROCESSING,
                BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
              ],
            },
          },
        });

        if (existingTransaction) {
          throw new Error('Duplicate transaction detected');
        }
      }

      // Enhanced validation
      if (!amount || amount <= 0) {
        throw new Error('Invalid transfer amount');
      }

      if (senderAccountId === receiverAccountId) {
        throw new Error('Cannot transfer to the same account');
      }

      // Get sender account with enhanced validation
      const senderAccount = await tx.account.findFirst({
        where: {
          id: senderAccountId,
          userId,
          isActive: true,
          isFrozen: false,
        },
      });

      if (!senderAccount) {
        throw new Error('Sender account not found, inactive, or frozen');
      }

      // Get receiver account with enhanced validation
      let receiverAccount;
      if (transferType === 'external') {
        receiverAccount = await tx.account.findUnique({
          where: {
            accountNumber: toAccountNumber,
          },
        });
        if (!receiverAccount || !receiverAccount.isActive || receiverAccount.isFrozen) {
          throw new Error('Receiver account not found, inactive, or frozen');
        }
      } else {
        receiverAccount = await tx.account.findUnique({
          where: {
            id: receiverAccountId,
          },
        });
        if (!receiverAccount || !receiverAccount.isActive || receiverAccount.isFrozen) {
          throw new Error('Receiver account not found, inactive, or frozen');
        }
      }

      // Prevent self-transfer regardless of input mode
      // Allow self-transfer; handle later

      // Validate currency compatibility
      if (senderAccount.currency !== receiverAccount.currency) {
        throw new Error('Currency mismatch between accounts');
      }

      // Calculate fee
      const fee = this.calculateTransactionFee(amount, BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER);
      const totalAmount = amount + fee;

      // Enhanced balance validation (self-transfer only needs fee)
      const requiredAmount = senderAccount.id === receiverAccount.id ? fee : totalAmount;
      if (Number(senderAccount.availableBalance) < requiredAmount) {
        throw new Error(`Insufficient funds. Available: ${senderAccount.availableBalance}, Required: ${requiredAmount}`);
      }

      // Check daily/monthly limits
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Check daily limit
      if (senderAccount.dailyLimit) {
        const dailyTransactions = await tx.transaction.aggregate({
          where: {
            senderAccountId: senderAccount.id,
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
            createdAt: {
              gte: startOfDay,
            },
          },
          _sum: {
            amount: true,
            fee: true,
          },
        });

        const dailyTotal = (dailyTransactions._sum.amount || 0) + (dailyTransactions._sum.fee || 0);
        if (dailyTotal + totalAmount > senderAccount.dailyLimit) {
          throw new Error(`Daily transfer limit exceeded. Daily total: ${dailyTotal}, Limit: ${senderAccount.dailyLimit}`);
        }
      }

      // Check monthly limit
      if (senderAccount.monthlyLimit) {
        const monthlyTransactions = await tx.transaction.aggregate({
          where: {
            senderAccountId: senderAccount.id,
            status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
            createdAt: {
              gte: startOfMonth,
            },
          },
          _sum: {
            amount: true,
            fee: true,
          },
        });

        const monthlyTotal = (monthlyTransactions._sum.amount || 0) + (monthlyTransactions._sum.fee || 0);
        if (monthlyTotal + totalAmount > senderAccount.monthlyLimit) {
          throw new Error(`Monthly transfer limit exceeded. Monthly total: ${monthlyTotal}, Limit: ${senderAccount.monthlyLimit}`);
        }
      }

      // Generate unique transaction number
      const transactionNumber = DatabaseService.generateTransactionNumber();

      // Create transaction record with PENDING status
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          type: BANKING_CONSTANTS.TRANSACTION_TYPES.TRANSFER,
          category: this.getCategoryFromType('TRANSFER'),
          amount,
          fee,
          currency: senderAccount.currency,
          description,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
          senderAccountId: senderAccount.id,
          receiverAccountId: receiverAccount.id,
          userId,
          idempotencyKey,
        },
      });

      // Get user email for OTP
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Do NOT send OTP here. Just return transaction info and user email for OTP creation outside transaction.
      return {
        transactionId: transaction.id,
        transactionNumber: transaction.transactionNumber,
        status: transaction.status,
        amount,
        fee,
        fromAccount: {
          accountNumber: senderAccount.accountNumber,
          newBalance: Number(senderAccount.balance),
        },
        toAccount: {
          accountNumber: receiverAccount.accountNumber,
          newBalance: Number(receiverAccount.balance),
        },
        userEmail: user.email
      };
    });
  }

  // Verify OTP and complete transfer
  static async verifyOtpAndCompleteTransfer(
    userId: string,
    transactionId: string,
    otpCode: string
  ): Promise<Transaction> {
    // 1. Verify and update OTP OUTSIDE the transaction
    const twoFactorService = require('./two-factor.service').twoFactorService;
    const isValidOtp = await twoFactorService.verifyCode(userId, otpCode);
    if (!isValidOtp) {
      throw new Error('Invalid or expired OTP code');
    }

    // 2. Only if OTP is valid, start the DB transaction to complete the transfer
    return await DatabaseService.executeTransaction(async (tx) => {
      // Get pending transaction
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
        },
        include: {
          senderAccount: true,
          receiverAccount: true,
        },
      });

      if (!transaction) {
        throw new Error('Pending transaction not found or already processed');
      }

      const senderAccount = transaction.senderAccount;
      const receiverAccount = transaction.receiverAccount;
      const totalAmount = transaction.amount + transaction.fee;

      let updatedSenderAccount;
      let updatedReceiverAccount;
      if (senderAccount.id === receiverAccount.id) {
        // Self-transfer: chỉ trừ phí để tránh ghi đè số dư bằng giá trị ban đầu + amount
        updatedSenderAccount = await tx.account.update({
          where: { id: senderAccount.id },
          data: {
            balance: { decrement: transaction.fee },
            availableBalance: { decrement: transaction.fee },
            updatedAt: new Date(),
          },
        });
        updatedReceiverAccount = updatedSenderAccount;
      } else {
        // Khác tài khoản: trừ (amount + fee) ở sender, cộng amount ở receiver bằng phép atomic
        updatedSenderAccount = await tx.account.update({
          where: { id: senderAccount.id },
          data: {
            balance: { decrement: totalAmount },
            availableBalance: { decrement: totalAmount },
            updatedAt: new Date(),
          },
        });

        updatedReceiverAccount = await tx.account.update({
          where: { id: receiverAccount.id },
          data: {
            balance: { increment: transaction.amount },
            availableBalance: { increment: transaction.amount },
            updatedAt: new Date(),
          },
        });
      }

      // Update transaction status to COMPLETED
      const completedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.COMPLETED,
          processedAt: new Date(),
        },
      });

      // Lấy thông tin chi tiết tài khoản gửi/nhận
      const senderAccountFull = await tx.account.findUnique({ where: { id: senderAccount.id } });
      const receiverAccountFull = await tx.account.findUnique({ where: { id: receiverAccount.id } });

      // Create detailed audit log
      await DatabaseService.createAuditLog({
        action: 'TRANSFER_COMPLETED_OTP',
        tableName: 'transactions',
        recordId: transaction.id,
        userId,
        oldValues: {
          senderBalance: Number(senderAccount.balance),
          senderAvailableBalance: Number(senderAccount.availableBalance),
          receiverBalance: Number(receiverAccount.balance),
          receiverAvailableBalance: Number(receiverAccount.availableBalance),
        },
        newValues: {
          transactionNumber: transaction.transactionNumber,
          amount: transaction.amount,
          fee: transaction.fee,
          totalAmount,
          fromAccount: senderAccount.accountNumber,
          toAccount: receiverAccount.accountNumber,
          senderNewBalance: Number(updatedSenderAccount.balance),
          senderNewAvailableBalance: Number(updatedSenderAccount.availableBalance),
          receiverNewBalance: Number(updatedReceiverAccount.balance),
          receiverNewAvailableBalance: Number(updatedReceiverAccount.availableBalance),
          otpVerified: true,
        },
      });

      // Trả về transaction kèm thông tin tài khoản chi tiết
      return {
        ...completedTransaction,
        fromAccount: senderAccountFull,
        toAccount: receiverAccountFull,
      };
    });
  }

  // Resend OTP for pending transfer
  static async resendOtpForTransfer(
    userId: string,
    transactionId: string
  ): Promise<void> {
    // 1. Read transaction and user email inside transaction (read-only)
    const { userEmail, transactionNumber } = await DatabaseService.executeTransaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: {
          id: transactionId,
          userId,
          status: BANKING_CONSTANTS.TRANSACTION_STATUS.PENDING,
        },
      });

      if (!transaction) {
        throw new Error('Pending transaction not found or already processed');
      }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return { userEmail: user.email, transactionNumber: transaction.transactionNumber };
    });

    // 2. Create OTP for transfer OUTSIDE the transaction
    const twoFactorService = require('./two-factor.service').twoFactorService;
    await twoFactorService.createCodeForTransfer(userId, userEmail);
  }

  private static generateTransactionNumber(): string {
    return `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private static getCategoryFromType(type: string): string {
    switch (type) {
      case 'TRANSFER':
        return 'INTERNAL_TRANSFER';
      case 'DEPOSIT':
        return 'DEPOSIT';
      case 'WITHDRAWAL':
        return 'WITHDRAWAL';
      default:
        return 'OTHER';
    }
  }
}

export default TransactionService; 