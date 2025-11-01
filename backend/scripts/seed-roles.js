const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Define roles directly in the script instead of importing
const ROLE_DEFINITIONS = [
  {
    name: 'SUPER_ADMIN',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 100,
    permissions: [
      'user:read', 'user:write', 'user:delete', 'user:activate', 'user:deactivate',
      'account:read', 'account:write', 'account:delete', 'account:freeze', 'account:unfreeze',
      'transaction:read', 'transaction:write', 'transaction:approve', 'transaction:cancel', 'transaction:reverse',
      'kyc:read', 'kyc:approve', 'kyc:reject', 'kyc:review',
      'card:read', 'card:write', 'card:block', 'card:unblock',
      'loan:read', 'loan:write', 'loan:approve', 'loan:reject',
      'audit:read', 'audit:write', 'compliance:read', 'compliance:write',
      'system:config', 'role:manage', 'permission:manage',
      'report:read', 'report:export', 'customer:support', 'refund:process',
      'cash:deposit', 'cash:withdrawal', 'transfer:process'
    ]
  },
  {
    name: 'ADMIN',
    displayName: 'Administrator',
    description: 'System administration with most permissions',
    level: 90,
    permissions: [
      'user:read', 'user:write', 'user:activate', 'user:deactivate',
      'account:read', 'account:write', 'account:freeze', 'account:unfreeze',
      'transaction:read', 'transaction:write', 'transaction:approve', 'transaction:cancel',
      'kyc:read', 'kyc:approve', 'kyc:reject',
      'card:read', 'card:write', 'card:block', 'card:unblock',
      'loan:read', 'loan:write', 'loan:approve', 'loan:reject',
      'audit:read', 'compliance:read', 'system:config', 'role:manage',
      'report:read', 'report:export'
    ]
  },
  {
    name: 'MANAGER',
    displayName: 'Branch Manager',
    description: 'Branch management with operational permissions',
    level: 80,
    permissions: [
      'user:read', 'account:read', 'account:write', 'account:freeze', 'account:unfreeze',
      'transaction:read', 'transaction:write', 'transaction:approve',
      'kyc:read', 'kyc:approve', 'kyc:reject',
      'card:read', 'card:write', 'card:block', 'card:unblock',
      'loan:read', 'loan:write', 'loan:approve',
      'audit:read', 'report:read', 'report:export'
    ]
  },
  {
    name: 'TELLER',
    displayName: 'Bank Teller',
    description: 'Cash operations and basic transactions',
    level: 60,
    permissions: [
      'user:read', 'account:read', 'transaction:read', 'transaction:write',
      'cash:deposit', 'cash:withdrawal', 'transfer:process',
      'card:read', 'card:block', 'customer:support'
    ]
  },
  {
    name: 'CUSTOMER_SERVICE',
    displayName: 'Customer Service Representative',
    description: 'Customer support and basic account management',
    level: 50,
    permissions: [
      'user:read', 'account:read', 'transaction:read', 'kyc:read',
      'card:read', 'customer:support', 'refund:process'
    ]
  },
  {
    name: 'COMPLIANCE',
    displayName: 'Compliance Officer',
    description: 'KYC review and compliance monitoring',
    level: 70,
    permissions: [
      'user:read', 'account:read', 'transaction:read',
      'kyc:read', 'kyc:approve', 'kyc:reject', 'kyc:review',
      'compliance:read', 'compliance:write', 'audit:read', 'report:read'
    ]
  },
  {
    name: 'AUDITOR',
    displayName: 'Internal Auditor',
    description: 'Audit and compliance review',
    level: 75,
    permissions: [
      'user:read', 'account:read', 'transaction:read', 'kyc:read',
      'card:read', 'loan:read', 'audit:read', 'audit:write',
      'compliance:read', 'report:read', 'report:export'
    ]
  },
  {
    name: 'CUSTOMER',
    displayName: 'Customer',
    description: 'Regular banking customer with basic access',
    level: 10,
    permissions: [
      'account:read', 'transaction:read', 'card:read', 'loan:read', 'transfer:process'
    ]
  }
];

const prisma = new PrismaClient();

async function seedRoles() {
  console.log('🌱 Seeding roles...');
  
  try {
    // Create roles
    for (const roleDef of ROLE_DEFINITIONS) {
      const role = await prisma.role.upsert({
        where: { name: roleDef.name },
        update: {
          displayName: roleDef.displayName,
          description: roleDef.description,
          permissions: JSON.stringify(roleDef.permissions),
          level: roleDef.level,
        },
        create: {
          name: roleDef.name,
          displayName: roleDef.displayName,
          description: roleDef.description,
          permissions: JSON.stringify(roleDef.permissions),
          level: roleDef.level,
        },
      });
      
      console.log(`✅ Created/Updated role: ${role.displayName}`);
    }
    
    console.log('🎉 Roles seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding roles:', error);
    throw error;
  }
}

async function createDefaultAdmin() {
  console.log('👤 Creating default admin user...');
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@bank.com' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return existingAdmin;
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@bank.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isEmailVerified: true,
        isKycVerified: true,
        kycStatus: 'APPROVED',
        isActive: true,
        twoFactorEnabled: false,
      }
    });
    
    // Assign SUPER_ADMIN role
    const superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });
    
    if (superAdminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
          assignedBy: 'system',
        }
      });
      
      console.log('✅ Default admin user created with SUPER_ADMIN role');
    }
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database seeding...');
  
  try {
    await seedRoles();
    await createDefaultAdmin();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedRoles, createDefaultAdmin };
