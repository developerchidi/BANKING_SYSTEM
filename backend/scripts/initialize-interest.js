#!/usr/bin/env node

/**
 * Script để khởi tạo lãi suất mặc định và test tính lãi suất
 * Usage: node scripts/initialize-interest.js
 */

const { PrismaClient } = require('@prisma/client');
const { InterestService } = require('../src/services/interest.service');
const { InterestCronService } = require('../src/services/interest-cron.service');

const prisma = new PrismaClient();

async function initializeInterestSystem() {
  console.log('🏦 Initializing Interest System...');
  
  try {
    // 1. Khởi tạo lãi suất mặc định
    console.log('📊 Setting up default interest rates...');
    await InterestService.initializeDefaultRates();
    
    // 2. Tạo một số tài khoản tiết kiệm mẫu để test
    console.log('👥 Creating sample savings accounts...');
    await createSampleAccounts();
    
    // 3. Test tính lãi suất
    console.log('🧪 Testing interest calculation...');
    await testInterestCalculation();
    
    console.log('✅ Interest system initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing interest system:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createSampleAccounts() {
  try {
    // Tìm user đầu tiên hoặc tạo user mẫu
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
      const existingAccount = await prisma.account.findUnique({
        where: { accountNumber: accountData.accountNumber },
      });
      
      if (!existingAccount) {
        await prisma.account.create({
          data: accountData,
        });
        console.log(`✅ Created account: ${accountData.accountNumber}`);
      } else {
        console.log(`⚠️ Account already exists: ${accountData.accountNumber}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating sample accounts:', error);
  }
}

async function testInterestCalculation() {
  try {
    // Test tính lãi suất cho một tài khoản
    const testAccount = await prisma.account.findFirst({
      where: { accountType: 'SAVINGS' },
    });
    
    if (!testAccount) {
      console.log('⚠️ No savings account found for testing');
      return;
    }
    
    console.log(`🧪 Testing interest calculation for account: ${testAccount.accountNumber}`);
    
    const calculation = await InterestService.calculateAccountInterest(testAccount.id);
    
    if (calculation) {
      console.log('📊 Interest calculation result:');
      console.log(`   Account: ${testAccount.accountNumber}`);
      console.log(`   Principal: ${calculation.principalAmount.toLocaleString('vi-VN')} VND`);
      console.log(`   Interest Rate: ${calculation.interestRate}%/year`);
      console.log(`   Interest Amount: ${calculation.interestAmount.toLocaleString('vi-VN')} VND`);
      console.log(`   Total Amount: ${calculation.totalAmount.toLocaleString('vi-VN')} VND`);
      console.log(`   Period: ${calculation.periodStart.toLocaleDateString('vi-VN')} - ${calculation.periodEnd.toLocaleDateString('vi-VN')}`);
      
      // Test post interest
      console.log('💰 Testing interest posting...');
      const success = await InterestService.postInterest(calculation);
      
      if (success) {
        console.log('✅ Interest posted successfully!');
        
        // Verify account balance updated
        const updatedAccount = await prisma.account.findUnique({
          where: { id: testAccount.id },
        });
        
        console.log(`📊 Updated balance: ${updatedAccount?.balance.toLocaleString('vi-VN')} VND`);
      } else {
        console.log('❌ Failed to post interest');
      }
    } else {
      console.log('⚠️ No interest calculation result');
    }
    
  } catch (error) {
    console.error('❌ Error testing interest calculation:', error);
  }
}

// Chạy script
if (require.main === module) {
  initializeInterestSystem();
}

module.exports = { initializeInterestSystem };
