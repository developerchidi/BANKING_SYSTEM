const { PrismaClient } = require('@prisma/client');
const { MonthlyIncomeService } = require('../src/services/monthly-income.service');

const prisma = new PrismaClient();

async function testMonthlyIncomeCalculation() {
  console.log('🧪 Testing Monthly Income Calculation...\n');

  try {
    // Get a test user
    const testUser = await prisma.user.findFirst({
      where: { email: { contains: '@' } },
      include: {
        accounts: true
      }
    });

    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }

    console.log(`👤 Testing with user: ${testUser.email}`);
    console.log(`📊 Current monthlyIncome: ${testUser.monthlyIncome || 0} VND`);
    console.log(`🏦 Account count: ${testUser.accounts.length}\n`);

    // Calculate monthly income
    console.log('🔄 Calculating monthly income...');
    const calculatedIncome = await MonthlyIncomeService.calculateMonthlyIncome(testUser.id);
    console.log(`💰 Calculated monthly income: ${calculatedIncome.toLocaleString()} VND\n`);

    // Get breakdown
    console.log('📋 Getting income breakdown...');
    const breakdown = await MonthlyIncomeService.getMonthlyIncomeBreakdown(testUser.id);
    
    console.log('📊 Income Breakdown:');
    console.log(`   Total Income: ${breakdown.totalIncome.toLocaleString()} VND`);
    console.log(`   Balance Growth: ${breakdown.breakdown.balanceGrowth.toLocaleString()} VND`);
    console.log(`   Incoming Transactions: ${breakdown.breakdown.incomingTransactions.length} transactions`);
    console.log(`   Salary Transactions: ${breakdown.breakdown.salaryTransactions.length} transactions`);
    console.log(`   Interest Transactions: ${breakdown.breakdown.interestTransactions.length} transactions\n`);

    // Update user's monthly income
    console.log('💾 Updating user monthly income...');
    const updatedIncome = await MonthlyIncomeService.updateUserMonthlyIncome(testUser.id);
    console.log(`✅ Updated monthly income: ${updatedIncome.toLocaleString()} VND\n`);

    // Test tier upgrade with new income
    console.log('🎯 Testing tier upgrade with new income...');
    const user = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { accountTier: true, monthlyIncome: true, isKycVerified: true }
    });

    console.log(`   Current Tier: ${user.accountTier}`);
    console.log(`   Monthly Income: ${user.monthlyIncome.toLocaleString()} VND`);
    console.log(`   KYC Verified: ${user.isKycVerified ? 'Yes' : 'No'}`);

    // Check which tiers user can upgrade to
    const tierRequirements = {
      'STANDARD': { kycRequired: true, minIncome: 0 },
      'PREMIUM': { kycRequired: true, minIncome: 10000000 },
      'VIP': { kycRequired: true, minIncome: 50000000 }
    };

    console.log('\n🎯 Available Upgrades:');
    for (const [tier, req] of Object.entries(tierRequirements)) {
      const canUpgrade = (!req.kycRequired || user.isKycVerified) && 
                        user.monthlyIncome >= req.minIncome;
      console.log(`   ${tier}: ${canUpgrade ? '✅ Available' : '❌ Not Available'} (Need: ${req.minIncome.toLocaleString()} VND)`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function batchUpdateAllUsers() {
  console.log('🔄 Starting batch update for all users...\n');
  
  try {
    await MonthlyIncomeService.batchUpdateAllUsersMonthlyIncome();
    console.log('✅ Batch update completed successfully!');
  } catch (error) {
    console.error('❌ Batch update failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
const command = process.argv[2];

if (command === 'batch') {
  batchUpdateAllUsers();
} else {
  testMonthlyIncomeCalculation();
}
