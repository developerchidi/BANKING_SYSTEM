import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';

// Type definitions for our banking system
export type UserWithAccounts = Prisma.UserGetPayload<{
  include: { accounts: true; cards: true; loans: true };
}>;

export type AccountWithTransactions = Prisma.AccountGetPayload<{
  include: { sentTransactions: true; receivedTransactions: true; cards: true };
}>;

export type TransactionWithDetails = Prisma.TransactionGetPayload<{
  include: { user: true; senderAccount: true; receiverAccount: true };
}>;

// Banking System Constants
export const BANKING_CONSTANTS = {
  // Account Types
  ACCOUNT_TYPES: {
    CHECKING: 'CHECKING',
    SAVINGS: 'SAVINGS', 
    BUSINESS: 'BUSINESS',
    JOINT: 'JOINT',
    STUDENT: 'STUDENT',
  },

  // Transaction Types
  TRANSACTION_TYPES: {
    TRANSFER: 'TRANSFER',
    DEPOSIT: 'DEPOSIT',
    WITHDRAWAL: 'WITHDRAWAL',
    BILL_PAYMENT: 'BILL_PAYMENT',
    CARD_PAYMENT: 'CARD_PAYMENT',
    LOAN_PAYMENT: 'LOAN_PAYMENT',
    INTEREST_CREDIT: 'INTEREST_CREDIT',
    FEE_DEBIT: 'FEE_DEBIT',
  },

  // Transaction Categories
  TRANSACTION_CATEGORIES: {
    INTERNAL_TRANSFER: 'INTERNAL_TRANSFER',
    EXTERNAL_TRANSFER: 'EXTERNAL_TRANSFER',
    BILL_PAYMENT: 'BILL_PAYMENT',
    MOBILE_TOPUP: 'MOBILE_TOPUP',
    ATM_WITHDRAWAL: 'ATM_WITHDRAWAL',
    CARD_PURCHASE: 'CARD_PURCHASE',
    LOAN_DISBURSEMENT: 'LOAN_DISBURSEMENT',
    LOAN_REPAYMENT: 'LOAN_REPAYMENT',
    INTEREST: 'INTEREST',
    FEES: 'FEES',
    OTHER: 'OTHER',
  },

  // Transaction Status
  TRANSACTION_STATUS: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED',
    REVERSED: 'REVERSED',
  },

  // Card Types
  CARD_TYPES: {
    DEBIT: 'DEBIT',
    CREDIT: 'CREDIT',
    PREPAID: 'PREPAID',
  },

  // Card Brands
  CARD_BRANDS: {
    VISA: 'VISA',
    MASTERCARD: 'MASTERCARD',
    AMERICAN_EXPRESS: 'AMERICAN_EXPRESS',
    DISCOVER: 'DISCOVER',
  },

  // KYC Status
  KYC_STATUS: {
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    EXPIRED: 'EXPIRED',
  },

  // Loan Types
  LOAN_TYPES: {
    PERSONAL: 'PERSONAL',
    HOME: 'HOME',
    AUTO: 'AUTO',
    BUSINESS: 'BUSINESS',
    EDUCATION: 'EDUCATION',
    CREDIT_LINE: 'CREDIT_LINE',
  },

  // Loan Status
  LOAN_STATUS: {
    PENDING: 'PENDING',
    UNDER_REVIEW: 'UNDER_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    DEFAULTED: 'DEFAULTED',
  },

  // Gender
  GENDER: {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
    OTHER: 'OTHER',
  },
} as const;

// Database Service Class
export class DatabaseService {
  // Convert Vietnamese name to uppercase without accents
  static formatUserName(firstName: string, lastName: string): string {
    // Combine first and last name
    const fullName = `${firstName} ${lastName}`;
    
    // Remove Vietnamese accents and convert to uppercase
    const normalizedName = fullName
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/đ/g, 'd') // Replace đ with d
      .replace(/Đ/g, 'D') // Replace Đ with D
      .toUpperCase() // Convert to uppercase
      .trim(); // Remove extra spaces
    
    return normalizedName;
  }

  // Generate unique account number (numeric only, max 12 digits)
  static generateAccountNumber(): string {
    // Generate a random number with max 12 digits
    // Using timestamp + random to ensure uniqueness
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0'); // 6 random digits
    
    // Combine timestamp + random = 12 digits total
    const accountNumber = timestamp + random;
    
    // Ensure it's exactly 12 digits
    return accountNumber.padStart(12, '0').slice(-12);
  }

  // Generate unique transaction number
  static generateTransactionNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `TXN${timestamp}${random}`;
  }

  // Generate unique loan number
  static generateLoanNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    return `LN${timestamp}${random}`;
  }

  // Generate unique card number (test purposes - in production use proper card number generation)
  static generateCardNumber(): string {
    const prefix = '4000'; // Visa test prefix
    const random = Math.floor(Math.random() * 999999999999).toString().padStart(12, '0');
    return `${prefix}${random}`;
  }

  // Get paginated results
  static getPaginationParams(page?: number, limit?: number) {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 10));
    const skip = (pageNum - 1) * limitNum;
    
    return {
      skip,
      take: limitNum,
      page: pageNum,
      limit: limitNum,
    };
  }

  // Convert string to JSON safely
  static parseJsonField(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  // Convert object to JSON string safely
  static stringifyJsonField(obj: any): string | null {
    if (!obj) return null;
    try {
      return JSON.stringify(obj);
    } catch {
      return null;
    }
  }

  // Validate account type
  static isValidAccountType(type: string): boolean {
    return Object.values(BANKING_CONSTANTS.ACCOUNT_TYPES).includes(type as any);
  }

  // Validate transaction type
  static isValidTransactionType(type: string): boolean {
    return Object.values(BANKING_CONSTANTS.TRANSACTION_TYPES).includes(type as any);
  }

  // Validate transaction status
  static isValidTransactionStatus(status: string): boolean {
    return Object.values(BANKING_CONSTANTS.TRANSACTION_STATUS).includes(status as any);
  }

  // Execute database transaction
  static async executeTransaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await prisma.$transaction(callback, {
      timeout: 10000, // Increased from 5000 to 10000 ms
      maxWait: 15000, // Maximum time to wait for transaction to start
      isolationLevel: 'Serializable' // Highest isolation level for banking operations
    });
  }

  // Create audit log entry
  static async createAuditLog({
    action,
    tableName,
    recordId,
    userId,
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  }: {
    action: string;
    tableName: string;
    recordId: string;
    userId: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Create audit log asynchronously without waiting
    prisma.auditLog.create({
      data: {
        action,
        resource: tableName,
        resourceId: recordId,
        userId,
        details: JSON.stringify({
          oldValues,
          newValues,
        }),
        ipAddress,
        userAgent,
      },
    }).catch(error => {
      // Log error but don't throw
      console.error('Failed to create audit log:', error);
    });
  }
}

export default DatabaseService; 