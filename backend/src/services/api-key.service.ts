import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

// Generate API key
export const generateApiKey = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'bk_';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create API key for user
// NOTE: ApiKey model doesn't exist in Prisma schema yet
// This service is kept for future implementation
export const createApiKey = async (userId: string, name: string, permissions: string[] = ['read']): Promise<ApiKey> => {
  const key = generateApiKey();
  
  // TODO: Uncomment when ApiKey model is added to schema.prisma
  /*
  const apiKey = await (prisma as any).apiKey.create({
    data: {
      key,
      name,
      userId,
      permissions: JSON.stringify(permissions),
      rateLimit: 1000, // Default rate limit
      isActive: true,
    }
  });

  return {
    ...apiKey,
    permissions: JSON.parse(apiKey.permissions),
  };
  */
  
  // Temporary return for compilation
  return {
    id: '',
    key,
    name,
    userId,
    permissions,
    rateLimit: 1000,
    isActive: true,
    createdAt: new Date(),
  };
};

// Validate API key
// NOTE: ApiKey model doesn't exist in Prisma schema yet
export const validateApiKey = async (key: string): Promise<ApiKey | null> => {
  // TODO: Uncomment when ApiKey model is added to schema.prisma
  // Temporary return null for compilation
  return null;
  /*
  const apiKey = await (prisma as any).apiKey.findFirst({
    where: {
      key,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  if (!apiKey) return null;

  // Update last used
  await (prisma as any).apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() }
  });

  return {
    ...apiKey,
    permissions: JSON.parse(apiKey.permissions),
  };
  */
};

// API Key middleware
export const authenticateApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      message: 'Please provide a valid API key'
    });
  }

  const validKey = await validateApiKey(apiKey);
  if (!validKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid or expired'
    });
  }

  req.apiKey = validKey;
  next();
};
