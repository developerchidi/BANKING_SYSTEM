const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing Database Connection...');
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test roles table
    const roles = await prisma.role.findMany();
    console.log(`✅ Found ${roles.length} roles in database`);
    
    // Test users table
    const users = await prisma.user.findMany();
    console.log(`✅ Found ${users.length} users in database`);
    
    // Test userRoles table
    const userRoles = await prisma.userRole.findMany();
    console.log(`✅ Found ${userRoles.length} user-role assignments`);
    
    console.log('🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
