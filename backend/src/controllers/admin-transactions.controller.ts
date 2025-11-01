import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { getNotificationWebSocket } from '../services/websocket-instance';
import { v4 as uuidv4 } from 'uuid';

class AdminTransactionsController {
  static async topUp(req: Request, res: Response) {
    try {
      const { accountId, amount, currency = 'VND', reason, idempotencyKey } = req.body as {
        accountId: string;
        amount: number;
        currency?: string;
        reason?: string;
        idempotencyKey?: string;
      };

      if (!accountId || !amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'accountId và amount > 0 là bắt buộc' });
      }

      const idemKey = idempotencyKey || `TOPUP-${accountId}-${amount}-${new Date().toISOString()}`;

      // Idempotency check
      const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: idemKey } });
      if (existing) {
        return res.json({ success: true, data: existing, idempotent: true });
      }

      const account = await prisma.account.findUnique({ where: { id: accountId } });
      if (!account) {
        return res.status(404).json({ success: false, message: 'Account not found' });
      }

      const actorId = req.user?.id || 'SYSTEM_JOB';

      const result = await prisma.$transaction(async (tx) => {
        // Create transaction
        const transaction = await tx.transaction.create({
          data: {
            transactionNumber: uuidv4(),
            type: 'DEPOSIT',
            category: 'SYSTEM_TOPUP',
            amount,
            fee: 0,
            currency,
            // Không set senderAccountId để tránh gán nhầm tài khoản ADMIN
            senderAccountId: null,
            // Ghi nhận nguồn hệ thống cho UI hiển thị
            externalBankCode: 'SYSTEM',
            externalAccountNumber: 'SYSTEM',
            externalAccountName: 'Hệ thống',
            // Gắn nhãn nguồn để client quyết định ẩn tài khoản gửi
            sourceType: 'SYSTEM',
            initiatedBy: actorId,
            reason: reason || 'System top-up',
            receiverAccountId: accountId,
            idempotencyKey: idemKey,
            userId: account.userId,
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        // Update balance
        const updatedAccount = await tx.account.update({
          where: { id: accountId },
          data: {
            balance: (account.balance || 0) + amount,
            availableBalance: (account.availableBalance || 0) + amount,
          },
        });

        // Ledger entries
        await (tx as any).ledgerEntry.createMany({
          data: [
            {
              transactionId: transaction.id,
              accountId: null,
              ledgerAccount: 'SYSTEM_LEDGER',
              entryType: 'CREDIT',
              amount,
              currency,
            },
            {
              transactionId: transaction.id,
              accountId: accountId,
              ledgerAccount: 'CASH',
              entryType: 'DEBIT',
              amount,
              currency,
            },
          ],
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: actorId,
            action: 'TRANSACTION',
            resource: 'TOPUP',
            resourceId: transaction.id,
            details: JSON.stringify({ accountId, amount, currency, reason }),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || '',
          },
        });

        // Push notification to user device via WS
        const ws = getNotificationWebSocket();
        if (ws) {
          ws.sendToUser(account.userId, {
            type: 'admin_deposit',
            payload: {
              amount,
              currency,
              sourceType: 'SYSTEM',
              description: reason || 'Nạp tiền từ hệ thống',
              adminName: 'Hệ Thống',
              accountNumber: account.accountNumber,
              transactionNumber: transaction.transactionNumber,
              newBalance: updatedAccount.balance,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return transaction;
      });

      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      console.error('Admin top-up error:', error);
      return res.status(500).json({ success: false, message: 'Failed to top-up account' });
    }
  }
}

export default AdminTransactionsController;


