import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Prisma Client with PostgreSQL via env DATABASE_URL
export const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Configure Prisma with timeout settings
prisma.$connect().then(() => {
  console.log('✅ Prisma database connected successfully');
}).catch((error) => {
  console.error('❌ Prisma connection error:', error);
});

// Helper function to add timeout to queries
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
    )
  ]);
};

// MongoDB connection
export const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/banking_system';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    // Check PostgreSQL connection
    await prisma.$queryRaw`SELECT 1`;
    const sqlServerStatus = true;

    // Check MongoDB connection
    const mongodbStatus = mongoose.connection.readyState === 1;

    return {
      sqlServer: sqlServerStatus,
      mongodb: mongodbStatus
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      sqlServer: false,
      mongodb: false
    };
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async () => {
  try {
    await prisma.$disconnect();
    await mongoose.connection.close();
    console.log('✅ Database connections closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connections:', error);
    throw error;
  }
};

// Handle process termination
process.on('beforeExit', async () => {
  await closeDatabaseConnections();
});

process.on('SIGINT', async () => {
  await closeDatabaseConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDatabaseConnections();
  process.exit(0);
}); 