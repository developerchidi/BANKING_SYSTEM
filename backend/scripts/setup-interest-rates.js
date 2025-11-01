#!/usr/bin/env node

/**
 * Script đơn giản để khởi tạo lãi suất mặc định
 * Usage: node scripts/setup-interest-rates.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupInterestRates() {
  console.log('🏦 Setting up default interest rates...');
  
  try {
    // 1. Khởi tạo lãi suất mặc định
    console.log('📊 Creating default interest rates...');
    
    const defaultRates = [
      {
        accountType: 'SAVINGS',
        tier: 'STANDARD',
        annualRate: 6.0, // 6% per year
        minimumBalance: 0,
      },
      {
        accountType: 'SAVINGS',
        tier: 'PREMIUM',
        annualRate: 7.0, // 7% per year
        minimumBalance: 10000000, // 10M VND
      },
      {
        accountType: 'SAVINGS',
        tier: 'VIP',
        annualRate: 8.0, // 8% per year
        minimumBalance: 50000000, // 50M VND
      },
    ];

    for (const rate of defaultRates) {
      try {
        await prisma.interestRate.upsert({
          where: {
            accountType_tier: {
              accountType: rate.accountType,
              tier: rate.tier,
            },
          },
          update: {
            annualRate: rate.annualRate,
            minimumBalance: rate.minimumBalance,
            isActive: true,
          },
          create: {
            ...rate,
            effectiveFrom: new Date(),
          },
        });
        console.log(`✅ Created/Updated rate: ${rate.accountType} ${rate.tier} - ${rate.annualRate}%/year`);
      } catch (error) {
        console.error(`❌ Error creating rate ${rate.accountType} ${rate.tier}:`, error.message);
      }
    }

    // 2. Tạo user và tài khoản mẫu
    console.log('👥 Creating sample user and accounts...');
    
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('👤 Creating sample user...');
      user = await prisma.user.create({
        data: {
          email: 'test@chidibank.com',
          password: '$2b$10$example', // Hashed password
          firstName: 'Test',
          lastName: 'User',
          displayCurrency: 'VND',
        },
      });
      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`✅ Using existing user: ${user.email}`);
    }
    
    // Tạo tài khoản tiết kiệm mẫu
    const sampleAccounts = [
      {
        accountNumber: 'SAV001',
        accountName: 'Tài khoản tiết kiệm Test 1',
        accountType: 'SAVINGS',
        balance: 1000000, // 1M VND
        currency: 'VND',
        userId: user.id,
      },
      {
        accountNumber: 'SAV002', 
        accountName: 'Tài khoản tiết kiệm Test 2',
        accountType: 'SAVINGS',
        balance: 5000000, // 5M VND
        currency: 'VND',
        userId: user.id,
      },
      {
        accountNumber: 'SAV003',
        accountName: 'Tài khoản tiết kiệm Premium',
        accountType: 'SAVINGS',
        balance: 15000000, // 15M VND
        currency: 'VND',
        userId: user.id,
      },
    ];
    
    for (const accountData of sampleAccounts) {
      try {
        const existingAccount = await prisma.account.findUnique({
          where: { accountNumber: accountData.accountNumber },
        });
        
        if (!existingAccount) {
          await prisma.account.create({
            data: accountData,
          });
          console.log(`✅ Created account: ${accountData.accountNumber} - ${accountData.balance.toLocaleString('vi-VN')} VND`);
        } else {
          console.log(`⚠️ Account already exists: ${accountData.accountNumber}`);
        }
      } catch (error) {
        console.error(`❌ Error creating account ${accountData.accountNumber}:`, error.message);
      }
    }

    // 3. Hiển thị tổng kết
    console.log('\n📊 Summary:');
    
    const rates = await prisma.interestRate.findMany({
      where: { isActive: true },
    });
    console.log(`📈 Active interest rates: ${rates.length}`);
    rates.forEach(rate => {
      console.log(`   - ${rate.accountType} ${rate.tier}: ${rate.annualRate}%/year (min: ${rate.minimumBalance.toLocaleString('vi-VN')} VND)`);
    });
    
    const accounts = await prisma.account.findMany({
      where: { accountType: 'SAVINGS' },
    });
    console.log(`💰 Savings accounts: ${accounts.length}`);
    accounts.forEach(account => {
      console.log(`   - ${account.accountNumber}: ${account.balance.toLocaleString('vi-VN')} VND`);
    });
    
    console.log('\n✅ Interest system setup completed successfully!');
    console.log('🕐 Cron jobs will automatically calculate interest monthly');
    console.log('📧 Email notifications will be sent to users');
    
  } catch (error) {
    console.error('❌ Error setting up interest system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
if (require.main === module) {
  setupInterestRates();
}

module.exports = { setupInterestRates };
