import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VanityPriceResult {
  number: string;
  score: number;
  price: number; // in account currency units
  tier: 'FREE' | 'STANDARD' | 'PREMIUM' | 'VIP';
}

export class VanityService {
  // Ensure a 12-digit numeric string
  static normalizeCandidate(input: string): string | null {
    const digits = input.replace(/\D/g, '');
    if (digits.length < 6) return null;
    const normalized = digits.padStart(12, '0').slice(-12);
    return normalized;
  }

  static async isInUse(accountNumber: string): Promise<boolean> {
    const existing = await prisma.account.findUnique({ where: { accountNumber } });
    return !!existing;
  }

  // Basic beauty scoring: suffix repeats, sequences, palindromes, repeating groups
  static computeBeautyScore(accountNumber: string): number {
    let score = 0;
    const s = accountNumber;

    // Suffix repeats (e.g., 88, 888, 8888)
    const suffixMatches = s.match(/(\d)\1+$/);
    if (suffixMatches) {
      const len = suffixMatches[0].length;
      score += len * 10; // 10/20/30/40...
      if (len >= 4) score += 20; // bonus for tứ quý
    }

    // Sequential ascending (e.g., 1234, 123456)
    const seqAsc = /(0123|1234|2345|3456|4567|5678|6789)/.test(s);
    if (seqAsc) score += 20;
    if (/012345|123456|234567|345678|456789/.test(s)) score += 30;

    // Palindrome chunks
    const reversed = s.split('').reverse().join('');
    if (reversed === s) score += 40; // full palindrome (rare)
    else if (s.slice(6) === reversed.slice(0, 6)) score += 15; // half mirror

    // Repeating groups like 1212, 3434, 7878
    if (/(\d{2})\1{2,}$/.test(s)) score += 20; // xx xx xx at tail
    if (/(\d{3})\1$/.test(s)) score += 20; // xyz xyz at tail

    // User-friendly patterns (zero padded with trailing unique block)
    if (/^0{4,}\d+$/.test(s)) score += 5;

    return score;
  }

  static mapScoreToPrice(score: number): VanityPriceResult['tier'] | number {
    // Price ladder (example). You may tune later or move to DB config.
    if (score >= 80) return 'VIP';
    if (score >= 50) return 'PREMIUM';
    if (score >= 25) return 'STANDARD';
    return 'FREE';
  }

  static tierToAmount(tier: VanityPriceResult['tier']): number {
    switch (tier) {
      case 'VIP':
        return 200_000; // example fee
      case 'PREMIUM':
        return 100_000;
      case 'STANDARD':
        return 50_000;
      case 'FREE':
      default:
        return 0;
    }
  }

  static async getPrice(number: string): Promise<VanityPriceResult> {
    const normalized = this.normalizeCandidate(number);
    if (!normalized) {
      throw new Error('Invalid candidate number');
    }
    // If number is in inventory, prefer configured basePrice/tier
    const inv = await prisma.vanityNumber.findUnique({ where: { number: normalized } });
    if (inv && inv.status !== 'SOLD') {
      const tier = (inv.tier?.toUpperCase?.() as VanityPriceResult['tier']) || 'STANDARD';
      const price = Math.max(0, inv.basePrice || 0);
      const score = this.computeBeautyScore(normalized);
      return { number: normalized, score, price, tier };
    }
    const score = this.computeBeautyScore(normalized);
    const tier = this.mapScoreToPrice(score) as VanityPriceResult['tier'];
    const price = this.tierToAmount(tier);
    return { number: normalized, score, price, tier };
  }

  static async suggest(limit = 10, pattern?: string): Promise<string[]> {
    const results: string[] = [];
    const seen = new Set<string>();
    let attempts = 0;
    while (results.length < limit && attempts < limit * 100) {
      attempts += 1;
      const candidate = VanityService.normalizeCandidate(
        `${Date.now()}${Math.floor(Math.random() * 1e6)}`,
      );
      if (!candidate) continue;
      if (seen.has(candidate)) continue;
      if (pattern && !new RegExp(pattern).test(candidate)) continue;
      if (await this.isInUse(candidate)) continue;
      seen.add(candidate);
      results.push(candidate);
    }
    return results;
  }

  // Inventory (admin-driven)
  static async market(params: { tier?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const where: any = { status: 'AVAILABLE', ...(params.tier ? { tier: params.tier } : {}) };
    const [total, items] = await Promise.all([
      prisma.vanityNumber.count({ where }),
      prisma.vanityNumber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { total, page, limit, items };
  }

  static async availability(number: string) {
    const normalized = this.normalizeCandidate(number);
    if (!normalized) throw new Error('Invalid candidate number');
    const inAccounts = await this.isInUse(normalized);
    const inInventory = await prisma.vanityNumber.findUnique({ where: { number: normalized } });
    return {
      number: normalized,
      existsInAccounts: inAccounts,
      inventoryStatus: inInventory?.status || null,
    };
  }

  // Admin inventory CRUD
  static async adminAddNumbers(params: { numbers: Array<{ number: string; tier?: string; basePrice?: number }> }) {
    const created: any[] = [];
    for (const n of params.numbers) {
      const normalized = this.normalizeCandidate(n.number);
      if (!normalized) continue;
      try {
        const item = await prisma.vanityNumber.create({
          data: {
            number: normalized,
            tier: n.tier || 'STANDARD',
            basePrice: Math.max(0, Math.floor(n.basePrice ?? 0)),
            status: 'AVAILABLE',
          },
        });
        created.push(item);
      } catch {
        // ignore duplicates
      }
    }
    return created;
  }

  static async adminListNumbers(params: { status?: string; tier?: string; page?: number; limit?: number }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const where: any = { ...(params.status ? { status: params.status } : {}), ...(params.tier ? { tier: params.tier } : {}) };
    const [total, items] = await Promise.all([
      prisma.vanityNumber.count({ where }),
      prisma.vanityNumber.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
    ]);
    return { total, page, limit, items };
  }

  static async adminUpdateNumber(id: string, data: { tier?: string; basePrice?: number; status?: string; heldUntil?: Date | null }) {
    const current = await prisma.vanityNumber.findUnique({ where: { id } });
    if (!current) throw new Error('Number not found');
    // Prevent reopening SOLD numbers
    if (current.status === 'SOLD' && data.status && data.status !== 'SOLD') {
      throw new Error('Cannot change status of SOLD number');
    }
    const updated = await prisma.vanityNumber.update({
      where: { id },
      data: {
        ...(data.tier ? { tier: data.tier } : {}),
        ...(typeof data.basePrice === 'number' ? { basePrice: Math.max(0, Math.floor(data.basePrice)) } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.heldUntil !== undefined ? { heldUntil: data.heldUntil } : {}),
      },
    });
    return updated;
  }

  static async adminDeleteNumber(id: string) {
    await prisma.vanityNumber.delete({ where: { id } });
    return { success: true };
  }

  static async purchaseAccountNumber(params: {
    accountId: string;
    newNumber: string;
    userId: string;
  }): Promise<{ success: boolean; fee: number; newNumber: string }>
  {
    const normalized = this.normalizeCandidate(params.newNumber);
    if (!normalized) throw new Error('Invalid account number');

    const inUse = await this.isInUse(normalized);
    if (inUse) throw new Error('Account number already in use');

    // Determine price: prefer inventory basePrice if listed
    let priceInfo = await prisma.vanityNumber.findUnique({ where: { number: normalized } });
    let price = 0;
    let tier: VanityPriceResult['tier'] = 'STANDARD';
    if (priceInfo) {
      if (priceInfo.status === 'SOLD') throw new Error('This number is already sold');
      price = Math.max(0, priceInfo.basePrice || 0);
      tier = (priceInfo.tier?.toUpperCase?.() as VanityPriceResult['tier']) || 'STANDARD';
    } else {
      const p = await this.getPrice(normalized);
      price = p.price;
      tier = p.tier;
    }

    return await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: params.accountId } });
      if (!account) throw new Error('Account not found');
      if (account.userId !== params.userId) throw new Error('Unauthorized account');

      if (price > 0) {
        if (account.availableBalance < price) throw new Error('Insufficient balance to pay vanity fee');

        // Deduct fee
        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance - price,
            availableBalance: account.availableBalance - price,
          },
        });

        // Record fee transaction
        await tx.transaction.create({
          data: {
            transactionNumber: `FEE-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
            type: 'FEE_DEBIT',
            category: `VANITY_${tier}`,
            amount: price,
            fee: 0,
            description: `Vanity account fee for ${normalized}`,
            currency: account.currency,
            status: 'COMPLETED',
            senderAccountId: account.id,
            userId: params.userId,
          },
        });
      }

      // Update account number
      await tx.account.update({
        where: { id: account.id },
        data: { accountNumber: normalized },
      });

      // If listed in inventory, mark as SOLD; otherwise, record a SOLD entry for audit/visibility
      if (priceInfo) {
        await tx.vanityNumber.update({
          where: { id: priceInfo.id },
          data: { status: 'SOLD', heldUntil: null },
        });
      } else {
        // Create a SOLD record so admin can filter and see history
        try {
          await tx.vanityNumber.create({
            data: {
              number: normalized,
              tier,
              basePrice: price,
              status: 'SOLD',
            },
          });
        } catch (_) {
          // ignore if conflict
        }
      }

      // Audit
      await tx.auditLog.create({
        data: {
          userId: params.userId,
          action: 'ACCOUNT_UPDATE',
          resource: 'Account',
          resourceId: account.id,
          details: JSON.stringify({ from: account.accountNumber, to: normalized, fee: price }),
          ipAddress: undefined,
        },
      });

      return { success: true, fee: price, newNumber: normalized };
    });
  }
}

export const vanityService = VanityService;


