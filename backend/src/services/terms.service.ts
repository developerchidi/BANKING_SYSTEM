import { prisma } from '../config/database';

export interface TermsAcceptanceData {
  userId: string;
  termsVersion: string;
  termsType: string;
  ipAddress?: string;
  userAgent?: string;
  acceptanceMethod?: string;
}

export class TermsService {
  /**
   * Record terms acceptance for a user
   */
  static async recordTermsAcceptance(data: TermsAcceptanceData) {
    return await prisma.termsAcceptance.create({
      data: {
        userId: data.userId,
        termsVersion: data.termsVersion,
        termsType: data.termsType,
        acceptedAt: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        acceptanceMethod: data.acceptanceMethod || 'WEB',
      },
    });
  }

  /**
   * Get terms acceptance history for a user
   */
  static async getUserTermsHistory(userId: string) {
    return await prisma.termsAcceptance.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  /**
   * Check if user has accepted latest terms version
   */
  static async hasAcceptedLatestTerms(userId: string, termsVersion: string, termsType: string = 'REGISTRATION') {
    const acceptance = await prisma.termsAcceptance.findFirst({
      where: {
        userId,
        termsVersion,
        termsType,
      },
      orderBy: { acceptedAt: 'desc' },
    });

    return acceptance !== null;
  }

  /**
   * Get latest terms acceptance for a user
   */
  static async getLatestTermsAcceptance(userId: string, termsType: string = 'REGISTRATION') {
    return await prisma.termsAcceptance.findFirst({
      where: {
        userId,
        termsType,
      },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  /**
   * Get terms acceptance statistics for admin
   */
  static async getTermsAcceptanceStats() {
    const stats = await prisma.termsAcceptance.groupBy({
      by: ['termsVersion', 'termsType'],
      _count: {
        id: true,
      },
      orderBy: {
        termsVersion: 'desc',
      },
    });

    return stats;
  }

  /**
   * Get all terms acceptances with user info (for admin)
   */
  static async getAllTermsAcceptances(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;
    
    const [acceptances, total] = await Promise.all([
      prisma.termsAcceptance.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { acceptedAt: 'desc' },
      }),
      prisma.termsAcceptance.count(),
    ]);

    return {
      acceptances,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
