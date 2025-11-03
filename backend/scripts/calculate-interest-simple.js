#!/usr/bin/env node

/**
 * Script đơn giản để tính và tạo lãi suất cho tài khoản
 * Usage: 
 *   node scripts/calculate-interest-simple.js                    (tất cả tài khoản SAVINGS)
 *   node scripts/calculate-interest-simple.js 999999999999        (tài khoản cụ thể)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function calculateInterest() {
  console.log('🏦 Tính lãi suất tiết kiệm...\n');

  try {
    // 1. Setup interest rates nếu chưa có
    console.log('📊 Bước 1: Kiểm tra và tạo lãi suất...');
    let rates = await prisma.interestRate.findMany({
      where: { isActive: true },
    });

    // Định nghĩa tất cả lãi suất mặc định
    const defaultRates = [
      // Lãi suất cho SAVINGS
      { accountType: 'SAVINGS', tier: 'STANDARD', annualRate: 6.0, minimumBalance: 0 },
      { accountType: 'SAVINGS', tier: 'PREMIUM', annualRate: 7.0, minimumBalance: 10000000 },
      { accountType: 'SAVINGS', tier: 'VIP', annualRate: 8.0, minimumBalance: 50000000 },
      // Lãi suất cho CHECKING (thấp hơn SAVINGS)
      { accountType: 'CHECKING', tier: 'STANDARD', annualRate: 3.0, minimumBalance: 0 },
      { accountType: 'CHECKING', tier: 'PREMIUM', annualRate: 3.5, minimumBalance: 10000000 },
      { accountType: 'CHECKING', tier: 'VIP', annualRate: 4.0, minimumBalance: 50000000 },
    ];

    // Kiểm tra và tạo từng rate nếu chưa có
    let createdCount = 0;
    for (const rate of defaultRates) {
      const existing = rates.find(r => 
        r.accountType === rate.accountType && r.tier === rate.tier
      );
      
      if (!existing) {
        await prisma.interestRate.upsert({
          where: { accountType_tier: { accountType: rate.accountType, tier: rate.tier } },
          update: rate,
          create: { ...rate, effectiveFrom: new Date(), isActive: true },
        });
        createdCount++;
        console.log(`   ✅ Tạo lãi suất: ${rate.accountType} ${rate.tier} - ${rate.annualRate}%/năm`);
      }
    }

    if (createdCount > 0) {
      console.log(`✅ Đã tạo ${createdCount} mức lãi suất mới\n`);
    } else {
      console.log(`✅ Đã có đầy đủ ${rates.length} mức lãi suất\n`);
    }
    
    // Load lại rates sau khi tạo
    rates = await prisma.interestRate.findMany({
      where: { isActive: true },
    });

    // 2. Tìm tài khoản
    const accountNumber = process.argv[2];
    let accounts;

    if (accountNumber) {
      const account = await prisma.account.findUnique({
        where: { accountNumber },
        include: { user: true },
      });
      if (!account) {
        console.log(`❌ Không tìm thấy tài khoản ${accountNumber}`);
        return;
      }
      accounts = [account];
    } else {
      accounts = await prisma.account.findMany({
        where: {
          accountType: { in: ['SAVINGS', 'CHECKING'] },
          balance: { gt: 0 },
          isActive: true,
        },
        include: { user: true },
        take: 10, // Giới hạn 10 tài khoản
      });
    }

    if (accounts.length === 0) {
      console.log('❌ Không tìm thấy tài khoản nào');
      return;
    }

    console.log(`📊 Bước 2: Tìm thấy ${accounts.length} tài khoản\n`);

    // 3. Tính và tạo lãi suất
    for (const account of accounts) {
      try {
        console.log(`\n💰 Xử lý tài khoản: ${account.accountNumber}`);
        console.log(`   - Loại tài khoản: ${account.accountType}`);
        console.log(`   - Số dư: ${account.balance.toLocaleString('vi-VN')} VND`);
        
        // Lấy user tier và map BASIC -> STANDARD
        const rawUserTier = account.user.accountTier || 'STANDARD';
        const userTier = rawUserTier === 'BASIC' ? 'STANDARD' : rawUserTier;
        console.log(`   - User tier: ${rawUserTier}${rawUserTier !== userTier ? ` (mapped to ${userTier})` : ''}`);

        // Debug: Hiển thị các rates có sẵn cho accountType này
        const availableRates = rates.filter(r => r.accountType === account.accountType);
        console.log(`   - Có ${availableRates.length} mức lãi suất cho ${account.accountType}:`);
        availableRates.forEach(r => {
          console.log(`     • ${r.tier}: ${r.annualRate}%/năm (min: ${r.minimumBalance.toLocaleString('vi-VN')} VND)`);
        });

        // Tìm lãi suất: ưu tiên cùng accountType và tier, sau đó chỉ cần cùng accountType
        const eligibleRates = rates.filter(r => 
          r.accountType === account.accountType && 
          account.balance >= r.minimumBalance
        );

        if (eligibleRates.length === 0) {
          console.log(`   ⚠️ Không có lãi suất phù hợp!`);
          console.log(`     - Account type: ${account.accountType}`);
          console.log(`     - Balance: ${account.balance.toLocaleString('vi-VN')} VND`);
          console.log(`     - Available rates: ${availableRates.map(r => `${r.tier} (min ${r.minimumBalance.toLocaleString('vi-VN')})`).join(', ')}`);
          continue;
        }

        // Sắp xếp: ưu tiên tier khớp user tier, sau đó tier cao nhất
        const applicableRate = eligibleRates.sort((a, b) => {
          // Ưu tiên tier khớp với user tier
          if (a.tier === userTier && b.tier !== userTier) return -1;
          if (b.tier === userTier && a.tier !== userTier) return 1;
          // Nếu cùng tier, ưu tiên tier cao hơn (VIP > PREMIUM > STANDARD)
          const tierOrder = { 'VIP': 3, 'PREMIUM': 2, 'STANDARD': 1, 'BASIC': 0 };
          return (tierOrder[b.tier] || 0) - (tierOrder[a.tier] || 0);
        })[0];

        // Tính thời gian (30 ngày gần nhất)
        const now = new Date();
        const periodStart = account.lastInterestDate || 
          new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const periodEnd = new Date(now);
        const daysInPeriod = Math.floor((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) || 30;

        // Tính lãi suất
        const dailyRate = applicableRate.annualRate / 365 / 100;
        const interestAmount = Math.round(account.balance * dailyRate * daysInPeriod);
        const totalAmount = account.balance + interestAmount;

        console.log(`   ✅ Tìm thấy lãi suất: ${applicableRate.annualRate}%/năm (${applicableRate.tier})`);
        console.log(`   - Kỳ tính lãi: ${daysInPeriod} ngày`);
        console.log(`   - Lãi tính được: ${interestAmount.toLocaleString('vi-VN')} VND`);

        // Tạo Interest record
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
            periodStart,
            periodEnd,
            status: 'POSTED',
            postedAt: now,
          },
        });

        // Tạo Transaction
        const transaction = await prisma.transaction.create({
          data: {
            userId: account.userId,
            transactionNumber: `INT${Date.now()}${Math.floor(Math.random() * 1000)}`,
            type: 'INTEREST_CREDIT',
            category: 'INTEREST',
            amount: interestAmount,
            fee: 0,
            description: `Lãi suất tiết kiệm ${applicableRate.annualRate}%/năm - ${daysInPeriod} ngày`,
            receiverAccountId: account.id,
            status: 'COMPLETED',
            processedAt: now,
          },
        });

        // Cập nhật Interest với transactionId
        await prisma.interest.update({
          where: { id: interest.id },
          data: { transactionId: transaction.id },
        });

        // Cập nhật số dư
        await prisma.account.update({
          where: { id: account.id },
          data: {
            balance: totalAmount,
            availableBalance: totalAmount,
            lastInterestDate: periodEnd,
          },
        });

        console.log(`   ✅ Đã tạo: Interest ID ${interest.id}, Transaction ${transaction.transactionNumber}`);
        console.log(`   - Số dư mới: ${totalAmount.toLocaleString('vi-VN')} VND`);

        // Tạo và gửi thông báo cho user (giống như transfer)
        try {
          console.log(`   📱 Đang tạo và gửi thông báo...`);
          
          // 1. Tạo notification record trong database
          const systemUser = await prisma.user.findFirst({
            where: {
              userRoles: {
                some: {
                  role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } },
                  isActive: true
                }
              }
            },
            select: { id: true }
          });

          const senderId = systemUser?.id || account.userId; // Dùng admin làm sender hoặc chính user đó
          
          const notification = await prisma.notification.create({
            data: {
              title: '💰 Lãi suất đã được cộng vào tài khoản',
              content: `Tài khoản ${account.accountNumber} đã nhận được ${interestAmount.toLocaleString('vi-VN')} VND lãi suất (${applicableRate.annualRate}%/năm, kỳ ${daysInPeriod} ngày). Số dư mới: ${totalAmount.toLocaleString('vi-VN')} VND.`,
              senderId: senderId,
              receiverId: account.userId,
              type: 'TRANSACTION',
              priority: 'NORMAL',
              category: 'INTEREST',
              relatedType: 'TRANSACTION',
              relatedId: transaction.id,
              isRead: false,
            }
          });

          // 2. Gửi thông báo real-time qua WebSocket (nếu server đang chạy)
          try {
            const fetch = require('node-fetch');
            const apiUrl = process.env.API_URL || 'http://localhost:3001';
            
            const notificationPayload = {
              userId: account.userId,
              type: 'interest_added',
              payload: {
                id: notification.id,
                title: notification.title,
                content: notification.content,
                amount: interestAmount,
                accountNumber: account.accountNumber,
                description: transaction.description,
                transactionNumber: transaction.transactionNumber,
                newBalance: totalAmount,
                interestRate: applicableRate.annualRate,
                period: `${daysInPeriod} ngày`,
                timestamp: new Date().toISOString(),
              }
            };

            const response = await fetch(`${apiUrl}/api/internal/send-notification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer internal-script'
              },
              body: JSON.stringify(notificationPayload),
              timeout: 3000
            });

            if (response.ok) {
              console.log(`   ✅ Đã gửi thông báo real-time cho user ${account.user.email}`);
            } else {
              // Server có thể chưa chạy, không sao
              console.log(`   ℹ️  Server chưa chạy, thông báo sẽ hiển thị khi user đăng nhập`);
            }
          } catch (wsError) {
            // WebSocket có thể không available, không sao
            console.log(`   ℹ️  WebSocket không khả dụng, thông báo đã được lưu trong database`);
          }

          console.log(`   ✅ Đã tạo thông báo trong database (ID: ${notification.id})`);
        } catch (notificationError) {
          console.log(`   ⚠️ Lỗi tạo thông báo: ${notificationError.message}`);
          // Không fail cả script nếu thông báo lỗi
        }

        console.log('');

      } catch (error) {
        console.error(`   ❌ Lỗi: ${error.message}\n`);
      }
    }

    console.log('🎉 Hoàn thành! Bạn có thể xem dữ liệu lãi suất trên app Flutter.');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    if (error.stack) console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  calculateInterest();
}

