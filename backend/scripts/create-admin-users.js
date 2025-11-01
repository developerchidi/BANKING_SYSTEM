const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUsers() {
  console.log('👥 Creating admin users for admin panel...');
  
  const saltRounds = 10;
  
  // Admin users data with studentId for login
  const adminUsers = [
    {
      email: 'admin@bank.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      studentId: 'ADMIN001',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'manager@bank.com',
      password: 'manager123',
      firstName: 'John',
      lastName: 'Manager',
      studentId: 'MANAGER001',
      role: 'MANAGER'
    },
    {
      email: 'teller@bank.com', 
      password: 'teller123',
      firstName: 'Jane',
      lastName: 'Teller',
      studentId: 'TELLER001',
      role: 'TELLER'
    },
    {
      email: 'compliance@bank.com',
      password: 'compliance123', 
      firstName: 'Mike',
      lastName: 'Compliance',
      studentId: 'COMPLIANCE001',
      role: 'COMPLIANCE'
    },
    {
      email: 'auditor@bank.com',
      password: 'auditor123',
      firstName: 'Sarah',
      lastName: 'Auditor', 
      studentId: 'AUDITOR001',
      role: 'AUDITOR'
    },
    {
      email: 'customer@bank.com',
      password: 'customer123',
      firstName: 'David',
      lastName: 'Customer',
      studentId: 'CUSTOMER001',
      role: 'CUSTOMER'
    }
  ];
  
  try {
    for (const userData of adminUsers) {
      // Check if user already exists by email or studentId
      const existingUser = await prisma.user.findFirst({
        where: { 
          OR: [
            { email: userData.email },
            { userProfile: { studentId: userData.studentId } }
          ]
        },
        include: { userProfile: true }
      });
      
      if (existingUser) {
        console.log(`✅ User ${userData.email} already exists`);
        
        // Update studentId if missing
        if (!existingUser.userProfile?.studentId) {
          await prisma.userProfile.upsert({
            where: { userId: existingUser.id },
            update: { studentId: userData.studentId },
            create: {
              userId: existingUser.id,
              studentId: userData.studentId,
              cohort: 'ADMIN',
              school: 'Banking System'
            }
          });
          console.log(`✅ Updated studentId for ${userData.email}`);
        }
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
          userProfile: {
            create: {
              studentId: userData.studentId,
              cohort: 'ADMIN',
              school: 'Banking System'
            }
          }
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
        
        console.log(`✅ Created user ${userData.email} (${userData.studentId}) with ${role.displayName} role`);
      } else {
        console.log(`❌ Role ${userData.role} not found for user ${userData.email}`);
      }
    }
    
    console.log('🎉 Admin users created successfully!');
    console.log('\n📋 Admin Login Credentials:');
    console.log('Admin: ADMIN001 / admin123');
    console.log('Manager: MANAGER001 / manager123');
    console.log('Teller: TELLER001 / teller123');
    console.log('Compliance: COMPLIANCE001 / compliance123');
    console.log('Auditor: AUDITOR001 / auditor123');
    console.log('Customer: CUSTOMER001 / customer123 (should be denied access)');
  } catch (error) {
    console.error('❌ Error creating admin users:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Creating admin users...');
  
  try {
    await createAdminUsers();
    console.log('🎉 Admin users creation completed!');
  } catch (error) {
    console.error('💥 Admin users creation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createAdminUsers };
