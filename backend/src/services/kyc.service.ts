// backend/src/services/kyc.service.ts
import { PrismaClient } from '@prisma/client';
import { KYCRequest, KYCCreateRequest, KYCUpdateRequest, KYCValidationResult, KYCDuplicateCheck } from '../models/kyc.model';
import crypto from 'crypto';
// import sharp from 'sharp';

const prisma = new PrismaClient();

export class KYCService {
  
  // Check for duplicate ID numbers
  static async checkDuplicateIdNumber(idNumber: string): Promise<KYCDuplicateCheck> {
    try {
      const existingKYC = await prisma.kYCRequest.findFirst({
        where: {
          // Fallback: match raw JSON string contains idNumber (SQLite JSON path not available)
          extractedData: { contains: `"idNumber":"${idNumber}` },
        },
        select: {
          id: true,
          userId: true,
          status: true,
          submittedAt: true,
        },
      });

      return {
        isDuplicate: !!existingKYC,
        existingKYC: existingKYC || undefined,
      };
    } catch (error) {
      console.error('Error checking duplicate ID number:', error);
      throw new Error('Failed to check duplicate ID number');
    }
  }

  // Validate KYC data
  static async validateKYCData(kycData: KYCCreateRequest): Promise<KYCValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!kycData.extractedData.fullName?.trim()) {
      errors.push('Họ tên không được để trống');
    }

    // Flexible validation by document type
    if (kycData.documentType === 'STUDENT_CARD') {
      if (!kycData.extractedData.studentId?.trim()) {
        errors.push('MSSV không được để trống');
      }
      if (!kycData.extractedData.university?.trim()) {
        errors.push('Trường không được để trống');
      }
      // Optional: academicYear/dateOfBirth for student card
    } else {
      if (!kycData.extractedData.idNumber?.trim()) {
        errors.push('Số CCCD/CMND không được để trống');
      }
      if (!kycData.extractedData.dateOfBirth?.trim()) {
        errors.push('Ngày sinh không được để trống');
      }
      if (!kycData.extractedData.address?.trim()) {
        errors.push('Địa chỉ không được để trống');
      }
    }

    // Validate ID number format
    if (kycData.extractedData.idNumber) {
      const idNumber = kycData.extractedData.idNumber.trim();
      
      // Check CCCD format (12 digits)
      if (kycData.documentType === 'CCCD' && !/^\d{12}$/.test(idNumber)) {
        errors.push('Số CCCD phải có đúng 12 chữ số');
      }
      
      // Check CMND format (9 digits)
      if (kycData.documentType === 'CMND' && !/^\d{9}$/.test(idNumber)) {
        errors.push('Số CMND phải có đúng 9 chữ số');
      }
      
      // Check Passport format (alphanumeric)
      if (kycData.documentType === 'PASSPORT' && !/^[A-Z0-9]{6,12}$/.test(idNumber)) {
        errors.push('Số Passport không hợp lệ');
      }
    }

    // Validate date of birth
    if (kycData.extractedData.dateOfBirth) {
      const birthDate = new Date(kycData.extractedData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        warnings.push('Người dùng chưa đủ 18 tuổi');
      }
      
      if (age > 100) {
        warnings.push('Tuổi có vẻ không hợp lệ');
      }
    }

    // Check for duplicate ID number
    if (kycData.extractedData.idNumber) {
      const duplicateCheck = await this.checkDuplicateIdNumber(kycData.extractedData.idNumber);
      if (duplicateCheck.isDuplicate) {
        errors.push(`Số ${kycData.documentType} đã được sử dụng bởi tài khoản khác`);
      }
    }

    // Validate images
    if (!kycData.frontImage) {
      errors.push('Ảnh mặt trước không được để trống');
    }

    if (kycData.documentType !== 'STUDENT_CARD' && !kycData.backImage) {
      errors.push('Ảnh mặt sau không được để trống');
    }

    if (!kycData.selfieImage) {
      errors.push('Ảnh selfie không được để trống');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Create KYC request
  static async createKYCRequest(kycData: KYCCreateRequest): Promise<KYCRequest> {
    try {
      // Validate data first
      const validation = await this.validateKYCData(kycData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Process and optimize images
      const processedImages = await this.processImages({
        front: Buffer.from(kycData.frontImage, 'base64'),
        back: kycData.backImage ? Buffer.from(kycData.backImage, 'base64') : undefined,
        selfie: Buffer.from(kycData.selfieImage, 'base64'),
      });

      // Create KYC request
      console.log('🔐 KYC Service: Creating KYC request with data:', {
        userId: kycData.userId,
        documentType: kycData.documentType,
        extractedDataType: typeof kycData.extractedData,
        extractedDataIsString: typeof kycData.extractedData === 'string',
        extractedDataPreview: typeof kycData.extractedData === 'string' 
          ? kycData.extractedData.substring(0, 100) + '...'
          : JSON.stringify(kycData.extractedData).substring(0, 100) + '...'
      });
      
      const kycRequest = await prisma.kYCRequest.create({
        data: {
          userId: kycData.userId,
          documentType: kycData.documentType,
          status: 'PENDING',
          frontImage: processedImages.front,
          backImage: processedImages.back || '',
          selfieImage: processedImages.selfie,
          extractedData: typeof kycData.extractedData === 'string' 
            ? kycData.extractedData 
            : JSON.stringify(kycData.extractedData),
          submittedAt: new Date(),
        },
      });

      return kycRequest as any;
    } catch (error) {
      console.error('Error creating KYC request:', error);
      throw error;
    }
  }

  // Process and optimize images
  static async processImages(images: { front: Buffer; back?: Buffer; selfie: Buffer }) {
    const processImage = async (buffer: Buffer) => {
      // If image optimization library is unavailable in env, just pass-through
      return buffer;
    };

    const [front, back, selfie] = await Promise.all([
      processImage(images.front),
      images.back ? processImage(images.back) : Promise.resolve(undefined),
      processImage(images.selfie),
    ]);

    return {
      front: front.toString('base64'),
      back: back ? back.toString('base64') : undefined,
      selfie: selfie.toString('base64'),
    };
  }

  // Get KYC request by ID
  static async getKYCRequestById(id: string): Promise<KYCRequest | null> {
    try {
      const kycRequest = await prisma.kYCRequest.findUnique({
        where: { id },
      });

      return kycRequest as any;
    } catch (error) {
      console.error('Error getting KYC request:', error);
      throw error;
    }
  }

  // Get KYC requests by user ID
  static async getKYCRequestsByUserId(userId: string): Promise<KYCRequest[]> {
    try {
      const kycRequests = await prisma.kYCRequest.findMany({
        where: { userId },
        orderBy: { submittedAt: 'desc' },
      });

      return kycRequests as any;
    } catch (error) {
      console.error('Error getting KYC requests by user:', error);
      throw error;
    }
  }

  // Get all pending KYC requests
  static async getPendingKYCRequests(page: number = 1, limit: number = 20): Promise<{
    data: KYCRequest[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    try {
      const offset = (page - 1) * limit;

      const [kycRequests, total] = await Promise.all([
        prisma.kYCRequest.findMany({
          where: { status: 'PENDING' },
          orderBy: { submittedAt: 'asc' },
          skip: offset,
          take: limit,
        }),
        prisma.kYCRequest.count({
          where: { status: 'PENDING' },
        }),
      ]);

      return {
        data: kycRequests as any,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error getting pending KYC requests:', error);
      throw error;
    }
  }

  // Update KYC request status
  static async updateKYCRequestStatus(
    id: string,
    updateData: KYCUpdateRequest
  ): Promise<KYCRequest> {
    try {
      const kycRequest = await prisma.kYCRequest.update({
        where: { id },
        data: {
          status: updateData.status,
          reviewedAt: new Date(),
          reviewedBy: updateData.reviewedBy,
          rejectionReason: updateData.rejectionReason,
          updatedAt: new Date(),
        },
      });

      // If approved, update user's KYC status
      if (updateData.status === 'APPROVED') {
        await prisma.user.update({
          where: { id: kycRequest.userId },
          data: {
            isKycVerified: true,
          },
        });
      }

      return kycRequest as any;
    } catch (error) {
      console.error('Error updating KYC request status:', error);
      throw error;
    }
  }

  // Bulk update KYC request statuses
  static async bulkUpdateKYCRequestStatuses(
    ids: string[],
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string,
    rejectionReason?: string
  ): Promise<{ count: number }> {
    try {
      const result = await prisma.kYCRequest.updateMany({
        where: { id: { in: ids } },
        data: {
          status,
          reviewedAt: new Date(),
          reviewedBy,
          rejectionReason,
          updatedAt: new Date(),
        },
      });

      // If approved, update users' KYC status
      if (status === 'APPROVED') {
        const kycRequests = await prisma.kYCRequest.findMany({
          where: { id: { in: ids } },
          select: { userId: true },
        });

        const userIds = kycRequests.map(kyc => kyc.userId);
        await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: {
            isKycVerified: true,
          },
        });
      }

      return result;
    } catch (error) {
      console.error('Error bulk updating KYC request statuses:', error);
      throw error;
    }
  }

  // Delete expired KYC requests
  static async deleteExpiredKYCRequests(): Promise<{ count: number }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.kYCRequest.deleteMany({
        where: {
          status: 'REJECTED',
          submittedAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      return result;
    } catch (error) {
      console.error('Error deleting expired KYC requests:', error);
      throw error;
    }
  }

  // Get KYC statistics
  static async getKYCStatistics(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
  }> {
    try {
      const [total, pending, approved, rejected, expired] = await Promise.all([
        prisma.kYCRequest.count(),
        prisma.kYCRequest.count({ where: { status: 'PENDING' } }),
        prisma.kYCRequest.count({ where: { status: 'APPROVED' } }),
        prisma.kYCRequest.count({ where: { status: 'REJECTED' } }),
        prisma.kYCRequest.count({ where: { status: 'EXPIRED' } }),
      ]);

      return {
        total,
        pending,
        approved,
        rejected,
        expired,
      };
    } catch (error) {
      console.error('Error getting KYC statistics:', error);
      throw error;
    }
  }
}
