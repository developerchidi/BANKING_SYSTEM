import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function quickTest() {
  console.log('🧪 Quick Role System Test...');
  
  try {
    // Test roles
    const roles = await prisma.role.findMany();
    console.log(`✅ Found ${roles.length} roles`);
    
    // Test admin user
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@bank.com' }
    });
    
    if (admin) {
      console.log('✅ Admin user exists');
    } else {
      console.log('❌ Admin user not found - run seed script first');
    }
    
    // Test user roles
    const userRoles = await prisma.userRole.findMany();
    console.log(`✅ Found ${userRoles.length} user-role assignments`);
    
    console.log('🎉 Quick test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
