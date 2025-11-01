#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function testCronJobSimple() {
  console.log('🧪 Testing cron job logic manually...');
  
  try {
    // 1. Lấy tất cả tài khoản tiết kiệm
    const savingsAccounts = await prisma.account.findMany({
      where: {
        accountType: 'SAVINGS',
        balance: { gt: 0 },
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    console.log(`📊 Found ${savingsAccounts.length} savings accounts to process`);

    if (savingsAccounts.length === 0) {
      console.log('❌ No savings accounts found');
      return;
    }

    // 2. Lấy lãi suất cho SAVINGS
    const interestRate = await prisma.interestRate.findFirst({
      where: {
        accountType: 'SAVINGS',
        tier: 'STANDARD',
        isActive: true,
      },
    });

    if (!interestRate) {
      console.log('❌ No interest rate found for SAVINGS accounts');
      return;
    }

    console.log(`📈 Using interest rate: ${interestRate.annualRate}%/year`);

    let successCount = 0;
    let failureCount = 0;

    // 3. Xử lý từng tài khoản
    for (const account of savingsAccounts) {
      try {
        console.log(`\n🏦 Processing account: ${account.accountNumber}`);
        console.log(`   Balance: ${account.balance.toLocaleString('vi-VN')} VND`);
        console.log(`   User: ${account.user.firstName} ${account.user.lastName}`);

        // Tính lãi suất
        const annualRate = interestRate.annualRate / 100;
        const monthlyRate = annualRate / 12;
        const interestAmount = account.balance * monthlyRate;
        const totalAmount = account.balance + interestAmount;

        console.log(`   Interest amount: ${interestAmount.toLocaleString('vi-VN')} VND`);
        console.log(`   New balance: ${totalAmount.toLocaleString('vi-VN')} VND`);

        // Tạo bản ghi lãi suất
        const interest = await prisma.interest.create({
          data: {
            userId: account.userId,
            accountId: account.id,
            interestType: 'SAVINGS',
            interestRate: interestRate.annualRate,
            principalAmount: account.balance,
            interestAmount: interestAmount,
            totalAmount: totalAmount,
            calculationDate: new Date(),
            periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            periodEnd: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
            status: 'PENDING',
          },
        });

        // Tạo transaction
        const transactionNumber = `INT${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const transaction = await prisma.transaction.create({
          data: {
            userId: account.userId,
            transactionNumber: transactionNumber,
            type: 'INTEREST',
            category: 'INTEREST',
            amount: interestAmount,
            description: `Lãi suất SAVINGS - ${interestRate.annualRate}%/năm`,
            receiverAccountId: account.id,
            status: 'COMPLETED'
          }
        });

        // Cập nhật số dư
        await prisma.account.update({
          where: { id: account.id },
          data: {
            balance: totalAmount,
            availableBalance: totalAmount,
          },
        });

        // Cập nhật trạng thái lãi suất
        await prisma.interest.update({
          where: { id: interest.id },
          data: {
            status: 'POSTED',
            postedAt: new Date(),
            transactionId: transaction.id
          }
        });

        // Gửi thông báo push
        try {
          const notificationPayload = {
            userId: account.userId,
            type: 'interest_added',
            payload: {
              amount: interestAmount,
              accountNumber: account.accountNumber,
              description: `Lãi suất SAVINGS - ${interestRate.annualRate}%/năm`,
              transactionNumber: transactionNumber,
              newBalance: totalAmount,
              timestamp: new Date().toISOString(),
            }
          };

          const response = await fetch('http://localhost:3001/api/internal/send-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer internal-script'
            },
            body: JSON.stringify(notificationPayload)
          });

          if (response.ok) {
            console.log(`   📱 Push notification sent to ${account.user.email}`);
          } else {
            console.log(`   ⚠️ Failed to send push notification`);
          }
        } catch (notificationError) {
          console.log(`   ⚠️ Notification error: ${notificationError.message}`);
        }

        successCount++;
        console.log(`   ✅ Success!`);

      } catch (error) {
        failureCount++;
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Tóm tắt
    console.log('\n📊 Summary:');
    console.log(`   Total processed: ${savingsAccounts.length}`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);

  } catch (error) {
    console.error('❌ Critical error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testCronJobSimple();
}
