import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testRoleSystem() {
  console.log('🧪 Testing Role System...');
  
  try {
    // Test 1: Check if roles exist
    console.log('\n1️⃣ Checking roles...');
    const roles = await prisma.role.findMany({
      orderBy: { level: 'desc' }
    });
    
    console.log(`Found ${roles.length} roles:`);
    roles.forEach(role => {
      console.log(`  - ${role.displayName} (${role.name}) - Level ${role.level}`);
    });
    
    // Test 2: Check if admin user exists
    console.log('\n2️⃣ Checking admin user...');
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@bank.com' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (admin) {
      console.log(`✅ Admin user found: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Roles: ${admin.userRoles.map(ur => ur.role.displayName).join(', ')}`);
      
      // Test password
      const passwordMatch = await bcrypt.compare('admin123', admin.password);
      console.log(`   Password test: ${passwordMatch ? '✅ Valid' : '❌ Invalid'}`);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test 3: Check permissions
    console.log('\n3️⃣ Checking permissions...');
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });
    
    if (superAdminRole && superAdminRole.permissions) {
      const permissions = JSON.parse(superAdminRole.permissions);
      console.log(`✅ SUPER_ADMIN has ${permissions.length} permissions`);
      console.log(`   Sample permissions: ${permissions.slice(0, 5).join(', ')}...`);
    }
    
    // Test 4: Check user-role relationships
    console.log('\n4️⃣ Checking user-role relationships...');
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    
    console.log(`Found ${userRoles.length} user-role assignments:`);
    userRoles.forEach(ur => {
      console.log(`  - ${ur.user.firstName} ${ur.user.lastName} (${ur.user.email}) -> ${ur.role.displayName}`);
    });
    
    console.log('\n🎉 Role system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing role system:', error);
    throw error;
  }
}

async function main() {
  try {
    await testRoleSystem();
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { testRoleSystem };
