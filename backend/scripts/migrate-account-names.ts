import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to format Vietnamese name to uppercase without accents
function formatUserName(firstName: string, lastName: string): string {
  // Combine first and last name
  const fullName = `${firstName} ${lastName}`;
  
  // Remove Vietnamese accents and convert to uppercase
  const normalizedName = fullName
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/đ/g, 'd') // Replace đ with d
    .replace(/Đ/g, 'D') // Replace Đ with D
    .toUpperCase() // Convert to uppercase
    .trim(); // Remove extra spaces
  
  return normalizedName;
}

async function migrateAccountNames() {
  try {
    console.log('🔄 Starting account name migration...');
    
    // Get all accounts with user information
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        accountNumber: true,
        accountName: true,
        userId: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
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
    const errors: any[] = [];

    // Process each account
    for (const account of accounts) {
      try {
        // Generate new account name
        const newAccountName = formatUserName(
          account.user.firstName,
          account.user.lastName
        );

        // Skip if account name is already in correct format
        if (account.accountName === newAccountName) {
          console.log(`⏭️  Skipped account ${account.id}: Already in correct format`);
          continue;
        }

        // Update the account
        await prisma.account.update({
          where: { id: account.id },
          data: { accountName: newAccountName },
        });

        console.log(`✅ Updated account ${account.id}: "${account.accountName}" → "${newAccountName}"`);
        successCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to update account ${account.id}:`, errorMessage);
        errors.push({
          accountId: account.id,
          oldAccountName: account.accountName,
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
        console.log(`  - Account ${error.accountId} (${error.oldAccountName}): ${error.error}`);
      });
    }

    console.log('\n🎉 Account name migration completed!');

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAccountNames();
