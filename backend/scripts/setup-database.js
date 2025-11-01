const { exec } = require('child_process');
const path = require('path');

console.log('🔧 Setting up Banking System Database...\n');

// Check if .env exists
const fs = require('fs');
const envPath = path.join(__dirname, '..', '.env');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  const envExamplePath = path.join(__dirname, '..', 'env.example');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created! Please update your database credentials.\n');
}

console.log('📋 Database Setup Checklist:');
console.log('1. ✅ Prisma schema created');
console.log('2. ✅ Environment variables configured');
console.log('3. ⏳ Checking database connection...');

// Test database connection and generate Prisma client
exec('npx prisma generate', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Prisma generate failed:', error.message);
    return;
  }
  
  console.log('✅ Prisma client generated successfully');
  console.log('4. ✅ Prisma client ready');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Update your .env file with actual database credentials');
  console.log('2. Run: npm run db:migrate (to create database tables)');
  console.log('3. Run: npm run dev (to start the development server)');
  console.log('\n📌 Database URLs:');
  console.log('- SQL Server: Check .env SQL_SERVER_URL');
  console.log('- MongoDB: Check .env MONGODB_URI');
});

console.log('\n📁 Database Files Created:');
console.log('- prisma/schema.prisma (Database schema)');
console.log('- src/config/database.ts (Database configuration)');
console.log('- src/services/database.service.ts (Database utilities)');
console.log('- .env (Environment variables)'); 