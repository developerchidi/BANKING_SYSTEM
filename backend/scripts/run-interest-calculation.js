#!/usr/bin/env node

/**
 * Script để tính và post lãi suất cho tất cả tài khoản tiết kiệm
 * Usage: node scripts/run-interest-calculation.js
 * Hoặc: node scripts/run-interest-calculation.js [accountNumber]
 */

const { PrismaClient } = require('@prisma/client');
const { InterestService } = require('../dist/services/interest.service');
const { InterestCronService } = require('../dist/services/interest-cron.service');

const prisma = new PrismaClient();

async function runInterestCalculation() {
  console.log('🏦 Running interest calculation...\n');

  try {
    // 1. Kiểm tra và setup interest rates nếu chưa có
    console.log('📊 Step 1: Checking interest rates...');
    const existingRates = await prisma.interestRate.findMany({
      where: { isActive: true },
    });

    if (existingRates.length === 0) {
      console.log('⚠️ No interest rates found. Setting up default rates...');
      await InterestService.initializeDefaultRates();
      console.log('✅ Default interest rates created\n');
    } else {
      console.log(`✅ Found ${existingRates.length} active interest rates\n`);
      existingRates.forEach(rate => {
        console.log(`   - ${rate.accountType} ${rate.tier}: ${rate.annualRate}%/year`);
      });
      console.log('');
    }

    // 2. Lấy account number từ argument hoặc dùng tài khoản đầu tiên
    const accountNumber = process.argv[2];
    let accounts;

    if (accountNumber) {
      console.log(`🔍 Step 2: Finding account ${accountNumber}...`);
      const account = await prisma.account.findUnique({
        where: { accountNumber },
        include: { user: true },
      });

      if (!account) {
        console.log(`❌ Account ${accountNumber} not found!`);
        return;
      }

      accounts = [account];
      console.log(`✅ Found account: ${account.accountNumber} - Balance: ${account.balance.toLocaleString('vi-VN')} VND\n`);
    } else {
      console.log('🔍 Step 2: Finding all SAVINGS accounts with balance > 0...');
      accounts = await prisma.account.findMany({
        where: {
          accountType: 'SAVINGS',
          balance: { gt: 0 },
          isActive: true,
        },
        include: { user: true },
      });

      if (accounts.length === 0) {
        console.log('⚠️ No SAVINGS accounts found. Looking for CHECKING accounts...');
        accounts = await prisma.account.findMany({
          where: {
            accountType: 'CHECKING',
            balance: { gt: 0 },
            isActive: true,
          },
          include: { user: true },
        });
      }

      if (accounts.length === 0) {
        console.log('❌ No accounts found with balance > 0');
        return;
      }

      console.log(`✅ Found ${accounts.length} accounts to process\n`);
    }

    // 3. Tính và post lãi suất cho từng tài khoản
    console.log('🧮 Step 3: Calculating and posting interest...\n');

    for (const account of accounts) {
      try {
        console.log(`📊 Processing account: ${account.accountNumber} (${account.accountName})`);
        console.log(`   - Current balance: ${account.balance.toLocaleString('vi-VN')} VND`);
        console.log(`   - Account type: ${account.accountType}`);

        // Tính lãi suất
        const calculation = await InterestService.calculateAccountInterest(account.id);

        if (!calculation) {
          console.log(`   ⚠️ No interest to calculate (balance too low or rate not found)\n`);
          continue;
        }

        console.log(`   - Interest rate: ${calculation.interestRate}%/year`);
        console.log(`   - Interest amount: ${calculation.interestAmount.toLocaleString('vi-VN')} VND`);
        console.log(`   - Period: ${calculation.periodStart.toLocaleDateString('vi-VN')} to ${calculation.periodEnd.toLocaleDateString('vi-VN')}`);

        // Post lãi suất (tạo transaction và cập nhật balance)
        const success = await InterestService.postInterest(calculation);

        if (success) {
          const updatedAccount = await prisma.account.findUnique({
            where: { id: account.id },
          });
          console.log(`   ✅ Interest posted successfully!`);
          console.log(`   - New balance: ${updatedAccount.balance.toLocaleString('vi-VN')} VND\n`);
        } else {
          console.log(`   ❌ Failed to post interest\n`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing account ${account.accountNumber}:`, error.message);
        console.log('');
      }
    }

    // 4. Tóm tắt
    console.log('📊 Step 4: Summary...');
    const allInterests = await prisma.interest.findMany({
      where: {
        accountId: { in: accounts.map(a => a.id) },
        status: 'POSTED',
      },
      orderBy: { calculationDate: 'desc' },
      take: 10,
    });

    console.log(`✅ Total interest records created: ${allInterests.length}`);
    if (allInterests.length > 0) {
      console.log('\n📋 Recent interest records:');
      allInterests.slice(0, 5).forEach(interest => {
        console.log(`   - ${interest.calculationDate.toLocaleDateString('vi-VN')}: ${interest.interestAmount.toLocaleString('vi-VN')} VND (${interest.interestRate}%/year)`);
      });
    }

    console.log('\n🎉 Interest calculation completed!');
    console.log('💡 You can now view interest history in the Flutter app');

  } catch (error) {
    console.error('❌ Error during interest calculation:', error);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  runInterestCalculation()
    .catch((e) => {
      console.error('❌ Script failed:', e);
      process.exit(1);
    });
}

module.exports = { runInterestCalculation };

