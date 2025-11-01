import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AccountService } from '../services/account.service';
import { TransactionService } from '../services/transaction.service';
import { CardService } from '../services/card.service';
import { prisma } from '../config/database';
import { getNotificationWebSocket } from '../services/websocket-instance';

export class BankingController {
  static async getAccounts(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const accounts = await AccountService.getUserAccounts(req.user.userId);
      return res.json({ success: true, message: 'Accounts retrieved successfully', data: { accounts } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve accounts', message: 'An error occurred while retrieving accounts' });
    }
  }

  static async lookupAccount(req: Request, res: Response) {
    const { accountNumber } = req.query;
    if (!accountNumber) return res.status(400).json({ message: 'Missing account number' });
    try {
      const account = await prisma.account.findUnique({ where: { accountNumber: String(accountNumber) } });
      if (!account) return res.status(404).json({ message: 'Account not found' });
      return res.json({ data: { account: { accountNumber: account.accountNumber, accountName: account.accountName } } });
    } catch (err) {
      return res.status(500).json({ message: 'Error looking up account' });
    }
  }

  static async getAccountById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const account = await AccountService.getAccountById(req.params.accountId, req.user.userId);
      if (!account) return res.status(404).json({ error: 'Account not found', message: 'Account not found or access denied' });
      return res.json({ success: true, message: 'Account retrieved successfully', data: { account } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve account', message: 'An error occurred while retrieving account' });
    }
  }

  static async createAccount(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const accountData = {
        accountType: req.body.accountType,
        accountName: req.body.accountName,
        currency: req.body.currency || 'VND',
        dailyLimit: req.body.dailyLimit,
        monthlyLimit: req.body.monthlyLimit,
        interestRate: req.body.interestRate,
      };
      const account = await AccountService.createAccount(req.user.userId, accountData);
      return res.status(201).json({ success: true, message: 'Account created successfully', data: { account } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account creation failed';
      return res.status(400).json({ error: 'Account creation failed', message: errorMessage });
    }
  }

  static async getAccountTransactions(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as string,
        status: req.query.status as string,
      };
      const result = await AccountService.getAccountTransactions(req.params.accountId, req.user.userId, options);
      return res.json({ success: true, message: 'Transactions retrieved successfully', data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve transactions';
      return res.status(400).json({ error: 'Failed to retrieve transactions', message: errorMessage });
    }
  }

  static async getAccountStatement(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);
      const statement = await AccountService.getAccountStatement(
        req.params.accountId,
        req.user.userId,
        startDate,
        endDate
      );
      return res.json({ success: true, message: 'Account statement retrieved successfully', data: statement });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve account statement';
      return res.status(400).json({ error: 'Failed to retrieve account statement', message: errorMessage });
    }
  }

  static async updateAccountLimits(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const limits = { dailyLimit: req.body.dailyLimit, monthlyLimit: req.body.monthlyLimit };
      const account = await AccountService.updateAccountLimits(req.params.accountId, req.user.userId, limits);
      return res.json({ success: true, message: 'Account limits updated successfully', data: { account } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update account limits';
      return res.status(400).json({ error: 'Failed to update account limits', message: errorMessage });
    }
  }

  static async toggleAccountFreeze(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const account = await AccountService.toggleAccountFreeze(
        req.params.accountId,
        req.user.userId,
        req.body.freeze,
        req.body.reason
      );
      return res.json({ success: true, message: `Account ${req.body.freeze ? 'frozen' : 'unfrozen'} successfully`, data: { account } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update account status';
      return res.status(400).json({ error: 'Failed to update account status', message: errorMessage });
    }
  }

  static async getCards(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const cards = await CardService.getCardsByUserId(req.user.userId);
      return res.json({ success: true, message: 'Cards retrieved successfully', data: { cards } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve cards', message: 'An error occurred while retrieving cards' });
    }
  }

  static async createCard(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { accountId, cardType, pin } = req.body;
      const card = await CardService.createCard(req.user.userId, accountId, cardType, pin);
      return res.status(201).json({ success: true, message: 'Card issued successfully', data: { card } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to issue card';
      return res.status(400).json({ error: 'Failed to issue card', message });
    }
  }

  static async updateCardLimits(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      // Enforce server-side policy: limits are determined by user's tier, not client input
      const existing = await CardService.getCardById(req.params.cardId);
      if (!existing) return res.status(404).json({ error: 'Card not found' });
      const tier = await CardService.inferUserTier(existing.userId);
      const defaults = CardService.getTierDefaultLimits(tier);

      const card = await CardService.updateCardLimits(req.params.cardId, {
        dailyLimit: defaults.dailyLimit,
        monthlyLimit: defaults.monthlyLimit,
        atmDailyLimit: defaults.atmDailyLimit,
      });
      return res.json({ success: true, message: 'Card limits updated', data: { card } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update card limits';
      return res.status(400).json({ error: 'Failed to update card limits', message });
    }
  }

  static async toggleCardBlock(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { block, reason } = req.body;
      const card = await CardService.updateCardStatus(req.params.cardId, !block, block, reason);
      return res.json({ success: true, message: block ? 'Card blocked' : 'Card unblocked', data: { card } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update card status';
      return res.status(400).json({ error: 'Failed to update card status', message });
    }
  }

  static async createVirtualCard(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { accountId, pin } = req.body;
      const card = await CardService.createVirtualCard(req.user.userId, accountId, pin);
      return res.status(201).json({ success: true, message: 'Virtual card created', data: { card } });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create virtual card';
      return res.status(400).json({ error: 'Failed to create virtual card', message });
    }
  }

  static async getCardById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const card = await CardService.getCardById(req.params.cardId);
      if (!card) return res.status(404).json({ error: 'Card not found', message: 'Card not found or access denied' });
      return res.json({ success: true, message: 'Card retrieved successfully', data: { card } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve card', message: 'An error occurred while retrieving card' });
    }
  }

  static async verifyAccountNumber(req: Request, res: Response) {
    try {
      const { accountNumber } = req.params;
      if (!accountNumber || accountNumber.length < 6 || accountNumber.length > 12 || !/^\d+$/.test(accountNumber)) {
        return res.status(400).json({ success: false, message: 'Số tài khoản không hợp lệ (chỉ được chứa số, độ dài 6-12 chữ số)' });
      }
      const account = await prisma.account.findFirst({
        where: { accountNumber: accountNumber, isActive: true },
        select: { id: true, accountNumber: true, accountName: true, accountType: true, currency: true, isActive: true },
      });
      if (!account) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
      return res.json({ success: true, data: { accountId: account.id, accountNumber: account.accountNumber, accountName: account.accountName, accountType: account.accountType, currency: account.currency, isActive: account.isActive } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi xác thực tài khoản' });
    }
  }

  static async transfer(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { fromAccountId, toAccountId, toAccountNumber, amount, description, transferType } = req.body;
      const idempotencyKey = (req.headers['x-idempotency-key'] as string) || `${req.user.userId}-${fromAccountId}-${toAccountId}-${amount}-${Date.now()}`;
      const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
      const result = await TransactionService.createPendingTransfer(
        req.user.userId,
        fromAccountId,
        toAccountId,
        amountNum,
        description,
        idempotencyKey,
        transferType,
        toAccountNumber
      );
      try {
        const twoFactorService = require('../services/two-factor.service').twoFactorService;
        await twoFactorService.createCode(req.user.userId, result.userEmail);
      } catch (otpError) {
        return res.status(500).json({ error: 'Failed to send OTP for transfer', message: otpError instanceof Error ? otpError.message : otpError });
      }
      return res.json({ success: true, message: 'Transfer initiated. OTP required to complete.', data: { transactionId: result.transactionId, transactionNumber: result.transactionNumber, status: result.status, amount: result.amount, fee: result.fee, fromAccount: result.fromAccount, toAccount: result.toAccount, requiresOtp: true } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer initiation failed';
      if (errorMessage.includes('Duplicate transaction')) {
        return res.status(409).json({ error: 'Duplicate transaction', message: 'This transaction has already been processed' });
      }
      return res.status(400).json({ error: 'Transfer initiation failed', message: errorMessage });
    }
  }

  static async verifyTransferOtp(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { transactionId, otpCode } = req.body;
      const transaction = await TransactionService.verifyOtpAndCompleteTransfer(req.user.userId, transactionId, otpCode);
      return res.json({ success: true, message: 'Transfer completed successfully', data: { transaction } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'OTP verification failed';
      return res.status(400).json({ error: 'OTP verification failed', message: errorMessage });
    }
  }

  static async resendTransferOtp(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const { transactionId } = req.body;
      await TransactionService.resendOtpForTransfer(req.user.userId, transactionId);
      return res.json({ success: true, message: 'OTP resent successfully. Please check your email.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend OTP';
      return res.status(400).json({ error: 'Failed to resend OTP', message: errorMessage });
    }
  }

  static async getUserTransactions(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const options = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        type: req.query.type as string,
        status: req.query.status as string,
        accountId: req.query.accountId as string,
      };
      const result = await TransactionService.getUserTransactions(req.user.userId, options);
      return res.json({ success: true, message: 'Transactions retrieved successfully', data: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve transactions';
      return res.status(400).json({ error: 'Failed to retrieve transactions', message: errorMessage });
    }
  }

  static async getUserAccountsAdmin(req: Request, res: Response) {
    try {
      const { userId } = req.params;
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
          dailyLimit: true,
          monthlyLimit: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return res.json({ success: true, data: accounts });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get user accounts', error: error instanceof Error ? error.message : error });
    }
  }

  static async adminDeposit(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      const { userId, accountId, amount, description, adminName } = req.body;
      const adminUserId = req.user?.id;
      const adminUser = await prisma.user.findUnique({ where: { id: adminUserId }, select: { id: true, firstName: true, lastName: true, email: true } });
      const finalAdminName = adminName || `${adminUser?.firstName || ''} ${adminUser?.lastName || ''}`.trim() || 'Admin';
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, firstName: true, lastName: true, email: true } });
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      const account = await prisma.account.findFirst({ where: { id: accountId, userId: userId } });
      if (!account) return res.status(404).json({ success: false, message: 'Account not found or does not belong to user' });
      let adminAccount = await prisma.account.findFirst({ where: { accountNumber: 'ADMIN001', accountName: 'Hệ Thống Ngân Hàng' } });
      if (!adminAccount) {
        adminAccount = await prisma.account.create({
          data: {
            accountNumber: 'ADMIN001',
            accountName: 'Hệ Thống Ngân Hàng',
            accountType: 'CHECKING',
            balance: 999999999,
            availableBalance: 999999999,
            currency: 'VND',
            isActive: true,
            isFrozen: false,
            dailyLimit: 999999999,
            monthlyLimit: 999999999,
            userId: adminUserId || 'system',
          },
        });
      }
      const transaction = await prisma.transaction.create({
        data: {
          transactionNumber: `DEP${Date.now()}`,
          senderAccountId: adminAccount.id,
          receiverAccountId: accountId,
          amount: amount,
          description: description || `Nạp tiền từ ${finalAdminName}`,
          type: 'TRANSFER',
          category: 'ADMIN_DEPOSIT',
          status: 'COMPLETED',
          userId: userId,
          processedAt: new Date(),
        },
      });
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount }, availableBalance: { increment: amount } },
      });
      const notificationWS = getNotificationWebSocket();
      if (notificationWS) {
        notificationWS.sendToUser(userId, {
          type: 'admin_deposit',
          payload: {
            amount: amount,
            adminName: finalAdminName,
            description: description || `Nạp tiền từ ${finalAdminName}`,
            accountNumber: account.accountNumber,
            transactionNumber: transaction.transactionNumber,
            newBalance: updatedAccount.balance,
            timestamp: new Date().toISOString(),
          },
        });
      }
      return res.json({ success: true, message: 'Deposit successful', data: { transaction, account: updatedAccount, user, adminAccount: { accountNumber: adminAccount.accountNumber, accountName: adminAccount.accountName }, adminUser: { name: finalAdminName, email: adminUser?.email } } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to process deposit', error: error instanceof Error ? error.message : error });
    }
  }

  static async getAdminTransactions(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = (req.query.search as string) || '';
      const type = req.query.type as string;
      const status = req.query.status as string;
      const userId = req.query.userId as string;
      const skip = (page - 1) * limit;
      const whereClause: any = {};
      if (search) {
        whereClause.OR = [{ id: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }];
      }
      if (type) whereClause.type = type;
      if (status) whereClause.status = status;
      if (userId) {
        // filter transactions related to a specific user (initiator or account owner)
        whereClause.AND = [
          {
            OR: [
              { userId: userId },
              { senderAccount: { userId: userId } },
              { receiverAccount: { userId: userId } },
            ],
          },
        ];
      }
      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
          include: {
            senderAccount: { select: { accountNumber: true, accountName: true, user: { select: { firstName: true, lastName: true, email: true } } } },
            receiverAccount: { select: { accountNumber: true, accountName: true, user: { select: { firstName: true, lastName: true, email: true } } } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);
      return res.json({ success: true, data: { transactions, total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to get transactions', error: error instanceof Error ? error.message : error });
    }
  }

  static async getTransactionById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const transaction = await TransactionService.getTransactionById(req.params.transactionId, req.user.userId);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found', message: 'Transaction not found or access denied' });
      return res.json({ success: true, message: 'Transaction retrieved successfully', data: { transaction } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve transaction';
      return res.status(400).json({ error: 'Failed to retrieve transaction', message: errorMessage });
    }
  }

  static async cancelTransaction(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const transaction = await TransactionService.cancelTransaction(req.params.transactionId, req.user.userId, req.body.reason);
      return res.json({ success: true, message: 'Transaction cancelled successfully', data: { transaction } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel transaction';
      return res.status(400).json({ error: 'Failed to cancel transaction', message: errorMessage });
    }
  }

  static async getBeneficiaries(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const beneficiaries = await AccountService.getBeneficiariesByUserId(req.user.userId);
      return res.json({ success: true, message: 'Beneficiaries retrieved successfully', data: { beneficiaries } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve beneficiaries', message: 'An error occurred while retrieving beneficiaries' });
    }
  }

  static async addBeneficiary(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      const beneficiaryData = {
        name: req.body.name,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName,
        bankCode: req.body.bankCode,
      };
      const beneficiary = await AccountService.addBeneficiary(
        req.body.accountId,
        beneficiaryData,
        req.user.userId
      );
      return res.status(201).json({ success: true, message: 'Beneficiary added successfully', data: { beneficiary } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add beneficiary';
      return res.status(400).json({ error: 'Failed to add beneficiary', message: errorMessage });
    }
  }

  static async removeBeneficiary(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });
      await AccountService.removeBeneficiary(req.params.beneficiaryId, req.user.userId);
      return res.json({ success: true, message: 'Beneficiary removed successfully' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove beneficiary';
      return res.status(400).json({ error: 'Failed to remove beneficiary', message: errorMessage });
    }
  }
}

export default BankingController;

