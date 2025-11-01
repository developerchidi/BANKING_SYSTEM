import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class SecurityService {
  static async setTransactionPin(userId: string, pin: string) {
    if (!/^[0-9]{4,6}$/.test(pin)) throw new Error('PIN không hợp lệ');
    const hash = await bcrypt.hash(pin, 10);
    await prisma.securityInfo.upsert({
      where: { userId },
      update: { transactionPinHash: hash, pinUpdatedAt: new Date() },
      create: { userId, transactionPinHash: hash, pinUpdatedAt: new Date() },
    });
    return { success: true };
  }

  static async verifyTransactionPin(userId: string, pin: string) {
    const sec = await prisma.securityInfo.findUnique({ where: { userId } });
    if (!sec?.transactionPinHash) throw new Error('PIN chưa được thiết lập');
    const ok = await bcrypt.compare(pin, sec.transactionPinHash);
    if (!ok) throw new Error('PIN không đúng');
    return { success: true };
  }

  static async hasTransactionPin(userId: string) {
    const sec = await prisma.securityInfo.findUnique({ where: { userId } });
    return { hasPin: !!sec?.transactionPinHash };
  }
}

export default SecurityService;


