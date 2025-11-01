import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  jwt: {
    accessSecret: process.env.JWT_SECRET || 'your-access-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    accessExpiresIn: '24h', // Tăng từ 15m lên 24h
    refreshExpiresIn: '7d',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
}; 