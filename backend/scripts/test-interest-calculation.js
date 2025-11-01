#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function testInterestCalculation() {
  console.log('🏦 Testing interest calculation for account 999999999999...');

  try {
    // 1. Tìm tài khoản 999999999999
    console.log('🔍 Looking for account 999999999999...');
    const account = await prisma.account.findUnique({
      where: { accountNumber: '999999999999' },
      include: { user: true }
    });

    if (!account) {
      console.log('❌ Account 999999999999 not found!');
      return;
    }

    console.log(`✅ Found account: ${account.accountNumber}`);
    console.log(`   - Account Name: ${account.accountName}`);
    console.log(`   - Balance: ${account.balance.toLocaleString('vi-VN')} VND`);
    console.log(`   - Account Type: ${account.accountType}`);
    console.log(`   - User: ${account.user.firstName} ${account.user.lastName} (${account.user.email})`);

    // 2. Kiểm tra lãi suất hiện tại
    console.log('\n📊 Checking current interest rates...');
    const rates = await prisma.interestRate.findMany({
      where: { 
        accountType: account.accountType,
        isActive: true 
      }
    });

    if (rates.length === 0) {
      console.log(`❌ No interest rates found for account type: ${account.accountType}`);
      console.log('🔧 Creating interest rate for CHECKING accounts...');
      
      // Tạo lãi suất cho CHECKING accounts
      const checkingRate = await prisma.interestRate.create({
        data: {
          accountType: 'CHECKING',
          tier: 'STANDARD',
          annualRate: 3.0, // 3% cho tài khoản thanh toán
          minimumBalance: 0,
          isActive: true
        }
      });
      
      console.log(`✅ Created CHECKING rate: ${checkingRate.annualRate}%/year`);
      rates.push(checkingRate);
    }

    rates.forEach(rate => {
      console.log(`   - ${rate.tier}: ${rate.annualRate}%/year (min: ${rate.minimumBalance.toLocaleString('vi-VN')} VND)`);
    });

    // 3. Tính lãi suất cho tài khoản
    console.log('\n🧮 Calculating interest for account...');
    
    // Lấy lãi suất phù hợp với số dư
    const applicableRate = rates.find(rate => account.balance >= rate.minimumBalance);
    if (!applicableRate) {
      console.log('❌ Account balance is below minimum for any interest rate');
      return;
    }

    console.log(`   - Using rate: ${applicableRate.tier} - ${applicableRate.annualRate}%/year`);
    
    // Tính lãi suất hàng tháng (annual rate / 12)
    const monthlyRate = applicableRate.annualRate / 12 / 100;
    const interestAmount = account.balance * monthlyRate;
    const totalAmount = account.balance + interestAmount;

    console.log(`   - Monthly interest rate: ${(monthlyRate * 100).toFixed(4)}%`);
    console.log(`   - Interest amount: ${interestAmount.toLocaleString('vi-VN')} VND`);
    console.log(`   - Total after interest: ${totalAmount.toLocaleString('vi-VN')} VND`);

    // 4. Tạo bản ghi Interest
    console.log('\n💾 Creating interest record...');
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const interest = await prisma.interest.create({
      data: {
        userId: account.userId,
        accountId: account.id,
        interestType: 'SAVINGS',
        interestRate: applicableRate.annualRate,
        principalAmount: account.balance,
        interestAmount: interestAmount,
        totalAmount: totalAmount,
        calculationDate: now,
        periodStart: lastMonth,
        periodEnd: thisMonth,
        status: 'PENDING'
      }
    });

    console.log(`✅ Interest record created: ${interest.id}`);

    // 5. Tạo transaction cho lãi suất
    console.log('\n💰 Creating interest transaction...');
    
    // Tạo transaction number duy nhất
    const transactionNumber = `INT${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        userId: account.userId,
        transactionNumber: transactionNumber,
        type: 'INTEREST',
        category: 'INTEREST',
        amount: interestAmount,
        description: `Lãi suất ${applicableRate.accountType} ${applicableRate.tier} - ${applicableRate.annualRate}%/năm`,
        receiverAccountId: account.id,
        status: 'COMPLETED'
      }
    });

    console.log(`✅ Transaction created: ${transaction.id}`);

    // 6. Cập nhật số dư tài khoản
    console.log('\n🔄 Updating account balance...');
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        balance: totalAmount,
        availableBalance: totalAmount
      }
    });

    console.log(`✅ Account balance updated: ${updatedAccount.balance.toLocaleString('vi-VN')} VND`);

    // 7. Cập nhật trạng thái Interest
    console.log('\n📝 Updating interest status...');
    await prisma.interest.update({
      where: { id: interest.id },
      data: {
        status: 'POSTED',
        postedAt: now,
        transactionId: transaction.id
      }
    });

    console.log('✅ Interest status updated to POSTED');

    // 8. Gửi thông báo cho user
    console.log('\n📱 Sending push notification to user...');
    try {
      // Gọi API để gửi thông báo qua WebSocket
      const fetch = require('node-fetch');
      
      const notificationPayload = {
        userId: account.userId,
        type: 'interest_added',
        payload: {
          amount: interestAmount,
          accountNumber: account.accountNumber,
          description: `Lãi suất ${applicableRate.accountType} ${applicableRate.tier} - ${applicableRate.annualRate}%/năm`,
          transactionNumber: transaction.transactionNumber,
          newBalance: totalAmount,
          timestamp: new Date().toISOString(),
        }
      };
      
      // Gọi API internal để gửi thông báo
      const response = await fetch('http://localhost:3001/api/internal/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer internal-script' // Token nội bộ cho script
        },
        body: JSON.stringify(notificationPayload)
      });
      
      if (response.ok) {
        console.log(`✅ Push notification sent via API to user ${account.user.email}`);
        console.log(`   - Type: interest_added`);
        console.log(`   - Amount: ${interestAmount.toLocaleString('vi-VN')} VND`);
        console.log(`   - Account: ${account.accountNumber}`);
        console.log(`   - New Balance: ${totalAmount.toLocaleString('vi-VN')} VND`);
      } else {
        console.log('⚠️ Failed to send notification via API');
      }
      
    } catch (notificationError) {
      console.log('⚠️ Failed to send notification:', notificationError.message);
    }

    // 9. Tóm tắt kết quả
    console.log('\n🎉 Interest calculation completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Account: ${account.accountNumber}`);
    console.log(`   - Original Balance: ${account.balance.toLocaleString('vi-VN')} VND`);
    console.log(`   - Interest Rate: ${applicableRate.annualRate}%/year (${applicableRate.tier})`);
    console.log(`   - Interest Amount: ${interestAmount.toLocaleString('vi-VN')} VND`);
    console.log(`   - New Balance: ${totalAmount.toLocaleString('vi-VN')} VND`);
    console.log(`   - Interest Record: ${interest.id}`);
    console.log(`   - Transaction: ${transaction.id}`);

  } catch (error) {
    console.error('❌ Error during interest calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testInterestCalculation()
    .catch((e) => {
      console.error('❌ Script failed:', e);
      process.exit(1);
    });
}