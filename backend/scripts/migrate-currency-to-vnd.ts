import { PrismaClient } from '@prisma/client';

/**
 * Script: migrate-currency-to-vnd.ts
 * Purpose: Update all historical records from USD (and other non-VND) to VND for a unified currency.
 * Safety: Idempotent - running multiple times is safe.
 */
async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Starting currency migration to VND...');

    const updatedAccounts = await prisma.account.updateMany({
      where: { currency: { not: 'VND' } },
      data: { currency: 'VND' },
    });
    console.log(`Accounts updated: ${updatedAccounts.count}`);

    const updatedTransactions = await prisma.transaction.updateMany({
      where: { currency: { not: 'VND' } },
      data: { currency: 'VND' },
    });
    console.log(`Transactions updated: ${updatedTransactions.count}`);

    const updatedUsers = await prisma.user.updateMany({
      where: { displayCurrency: { not: 'VND' } },
      data: { displayCurrency: 'VND' },
    });
    console.log(`Users displayCurrency updated: ${updatedUsers.count}`);

    console.log('Currency migration completed ✅');
  } catch (e) {
    console.error('Currency migration failed:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();


