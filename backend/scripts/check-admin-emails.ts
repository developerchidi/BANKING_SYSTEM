import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminEmails() {
  console.log('🔍 Checking admin emails...\n');

  try {
    const admins = await prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: { in: ['ADMIN', 'SUPER_ADMIN'] },
            },
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userRoles: {
          where: {
            isActive: true,
          },
          include: {
            role: {
              select: {
                name: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    console.log(`📊 Found ${admins.length} admin users:\n`);

    const invalidEmails: any[] = [];

    admins.forEach((admin, index) => {
      const roles = admin.userRoles.map(ur => ur.role.name).join(', ');
      const isValidEmail = admin.email && admin.email.includes('@') && admin.email.includes('.');
      
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
      console.log(`   Email: ${admin.email || '(NULL)'}`);
      console.log(`   Roles: ${roles}`);
      console.log(`   Valid: ${isValidEmail ? '✅' : '❌'}`);
      console.log('');

      if (!isValidEmail) {
        invalidEmails.push(admin);
      }
    });

    if (invalidEmails.length > 0) {
      console.log(`\n⚠️  Found ${invalidEmails.length} admin(s) with invalid emails:\n`);
      invalidEmails.forEach(admin => {
        console.log(`   - ${admin.firstName} ${admin.lastName}: ${admin.email || '(NULL)'}`);
      });
      console.log('\n💡 Please update or delete these admin users to prevent email sending errors.');
    } else {
      console.log('\n✅ All admin emails are valid!');
    }

  } catch (error) {
    console.error('❌ Error checking admin emails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminEmails();

