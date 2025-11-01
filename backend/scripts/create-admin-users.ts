import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUsers() {
  console.log('👥 Creating admin users with studentId...');
  
  const saltRounds = 10;
  
  // Admin users data with studentId
  const adminUsers = [
    {
      email: 'admin@bank.com',
      studentId: 'ADMIN001',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN'
    },
    {
      email: 'manager@bank.com',
      studentId: 'MANAGER001',
      password: 'manager123',
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER'
    },
    {
      email: 'teller@bank.com',
      studentId: 'TELLER001',
      password: 'teller123',
      firstName: 'Teller',
      lastName: 'User',
      role: 'TELLER'
    },
    {
      email: 'compliance@bank.com',
      studentId: 'COMPLIANCE001',
      password: 'compliance123',
      firstName: 'Compliance',
      lastName: 'User',
      role: 'COMPLIANCE'
    },
    {
      email: 'auditor@bank.com',
      studentId: 'AUDITOR001',
      password: 'auditor123',
      firstName: 'Auditor',
      lastName: 'User',
      role: 'AUDITOR'
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
        console.log(`✅ User ${userData.email} (${userData.studentId}) already exists`);
        continue;
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      // Create user with userProfile
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

export { createAdminUsers };
