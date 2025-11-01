require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unlockUser(email) {
  try {
    console.log(`🔓 Unlocking user account: ${email}\n`);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isLocked: true,
        lockedUntil: true,
        isActive: true
      }
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }

    console.log(`👤 Found user: ${user.firstName} ${user.lastName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`🔒 Locked: ${user.isLocked ? 'YES' : 'NO'}`);
    console.log(`⏰ Locked until: ${user.lockedUntil ? user.lockedUntil.toLocaleString() : 'N/A'}`);
    console.log(`✅ Active: ${user.isActive ? 'YES' : 'NO'}\n`);

    if (!user.isLocked) {
      console.log('ℹ️  User account is not locked');
      return;
    }

    // Unlock user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        isLocked: false,
        lockedUntil: null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isLocked: true,
        lockedUntil: true,
        isActive: true
      }
    });

    console.log('✅ User account unlocked successfully!');
    console.log(`🔒 New lock status: ${updatedUser.isLocked ? 'LOCKED' : 'UNLOCKED'}`);
    console.log('\n🎯 Now the user can login again');

  } catch (error) {
    console.error('❌ Error unlocking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'nguyenchidi.dev@gmail.com';
unlockUser(email); 