-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "currency" SET DEFAULT 'VND';

-- AlterTable
ALTER TABLE "ledger_entries" ALTER COLUMN "currency" SET DEFAULT 'VND';

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'VND';
