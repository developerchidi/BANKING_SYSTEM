import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to generate new numeric account number
function generateNewAccountNumber(): string {
  // Generate a random number with max 12 digits
  // Using timestamp + random to ensure uniqueness
  const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0'); // 6 random digits
  
  // Combine timestamp + random = 12 digits total
  const accountNumber = timestamp + random;
  
  // Ensure it's exactly 12 digits
  return accountNumber.padStart(12, '0').slice(-12);
}

interface MigrationError {
  accountId: string;
  oldAccountNumber: string;
  error: string;
}

async function migrateAccountNumbers(): Promise<void> {
  try {
    console.log('🔄 Starting account number migration...');
    
    // Get all accounts
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        userId: true,
      },
    });

    console.log(`📊 Found ${accounts.length} accounts to migrate`);

    if (accounts.length === 0) {
      console.log('✅ No accounts found. Migration completed.');
      return;
    }

    // Track migration results
    let successCount = 0;
    let errorCount = 0;
    const errors: MigrationError[] = [];

    // Process each account
    for (const account of accounts) {
      try {
        // Generate new account number
        let newAccountNumber: string;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          newAccountNumber = generateNewAccountNumber();
          attempts++;
          
          // Check if this number already exists
          const existingAccount = await prisma.account.findUnique({
            where: { accountNumber: newAccountNumber },
          });

          if (!existingAccount) {
            break; // Found unique number
          }

          if (attempts >= maxAttempts) {
            throw new Error(`Failed to generate unique account number after ${maxAttempts} attempts`);
          }
        } while (true);

        // Update the account
        await prisma.account.update({
          where: { id: account.id },
          data: { accountNumber: newAccountNumber },
        });

        console.log(`✅ Updated account ${account.id}: ${account.accountNumber} → ${newAccountNumber}`);
        successCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to update account ${account.id}:`, errorMessage);
        errors.push({
          accountId: account.id,
          oldAccountNumber: account.accountNumber,
          error: errorMessage,
        });
        errorCount++;
      }
    }

    // Print summary
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${successCount} accounts`);
    console.log(`❌ Failed to update: ${errorCount} accounts`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => {
        console.log(`  - Account ${error.accountId} (${error.oldAccountNumber}): ${error.error}`);
      });
    }

    console.log('\n🎉 Account number migration completed!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAccountNumbers();
