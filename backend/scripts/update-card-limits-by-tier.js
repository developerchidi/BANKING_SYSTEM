const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Tier default limits (VND)
const tierLimits = {
  'BASIC': { dailyLimit: 20000000, monthlyLimit: 200000000, atmDailyLimit: 5000000 },
  'STANDARD': { dailyLimit: 100000000, monthlyLimit: 1000000000, atmDailyLimit: 10000000 },
  'PREMIUM': { dailyLimit: 300000000, monthlyLimit: 3000000000, atmDailyLimit: 20000000 },
  'VIP': { dailyLimit: 500000000, monthlyLimit: 5000000000, atmDailyLimit: 50000000 },
};

async function updateCardLimitsByTier() {
  try {
    console.log('🔄 Bắt đầu cập nhật hạn mức thẻ theo tier...');
    
    // Lấy tất cả thẻ
    const cards = await prisma.card.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            accountTier: true,
          },
        },
      },
    });

    console.log(`📊 Tìm thấy ${cards.length} thẻ`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const card of cards) {
      const tier = card.user.accountTier || 'BASIC';
      const limits = tierLimits[tier];
      
      if (!limits) {
        console.log(`⚠️  Tier không hợp lệ: ${tier} cho thẻ ${card.id}`);
        skippedCount++;
        continue;
      }

      // Kiểm tra xem thẻ đã có hạn mức chưa
      const hasLimits = card.dailyLimit !== null || card.monthlyLimit !== null || card.atmDailyLimit !== null;
      
      if (hasLimits) {
        console.log(`⏭️  Thẻ ${card.id} đã có hạn mức, bỏ qua`);
        skippedCount++;
        continue;
      }

      // Cập nhật hạn mức theo tier
      await prisma.card.update({
        where: { id: card.id },
        data: {
          dailyLimit: limits.dailyLimit,
          monthlyLimit: limits.monthlyLimit,
          atmDailyLimit: limits.atmDailyLimit,
        },
      });

      console.log(`✅ Cập nhật thẻ ${card.id} (${card.user.email}) - Tier: ${tier}`);
      console.log(`   Daily: ${limits.dailyLimit}, Monthly: ${limits.monthlyLimit}, ATM: ${limits.atmDailyLimit}`);
      updatedCount++;
    }

    console.log('\n📈 Kết quả:');
    console.log(`✅ Đã cập nhật: ${updatedCount} thẻ`);
    console.log(`⏭️  Đã bỏ qua: ${skippedCount} thẻ`);
    console.log(`📊 Tổng cộng: ${cards.length} thẻ`);

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
updateCardLimitsByTier();

