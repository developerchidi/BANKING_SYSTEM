const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createSampleUsers() {
  console.log('👥 Creating sample users with different roles...');
  
  const saltRounds = 10;
  
  // Sample users data
  const sampleUsers = [
    {
      email: 'manager@bank.com',
      password: 'manager123',
      firstName: 'John',
      lastName: 'Manager',
      role: 'MANAGER'
    },
    {
      email: 'teller@bank.com', 
      password: 'teller123',
      firstName: 'Jane',
      lastName: 'Teller',
      role: 'TELLER'
    },
    {
      email: 'compliance@bank.com',
      password: 'compliance123', 
      firstName: 'Mike',
      lastName: 'Compliance',
      role: 'COMPLIANCE'
    },
    {
      email: 'auditor@bank.com',
      password: 'auditor123',
      firstName: 'Sarah',
      lastName: 'Auditor', 
      role: 'AUDITOR'
    },
    {
      email: 'customer@bank.com',
      password: 'customer123',
      firstName: 'David',
      lastName: 'Customer',
      role: 'CUSTOMER'
    }
  ];
  
  try {
    for (const userData of sampleUsers) {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isEmailVerified: true,
          isKycVerified: true,
          kycStatus: 'APPROVED',
          isActive: true,
          twoFactorEnabled: false,
        }
      });
      
      // Get role
      const role = await prisma.role.findUnique({
        where: { name: userData.role }
      });
      
      if (role) {
        // Assign role to user
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            assignedBy: 'system',
          }
        });
        
        console.log(`✅ Created user ${userData.email} with ${role.displayName} role`);
      } else {
        console.log(`❌ Role ${userData.role} not found for user ${userData.email}`);
      }
    }
    
    console.log('🎉 Sample users created successfully!');
  } catch (error) {
    console.error('❌ Error creating sample users:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating sample users...');
  
  try {
    await createSampleUsers();
    console.log('🎉 Sample users creation completed!');
  } catch (error) {
    console.error('💥 Sample users creation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSampleUsers };
