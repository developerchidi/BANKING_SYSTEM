// Types for Banking Admin Panel
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isKycVerified: boolean;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  userRoles?: UserRole[];
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions?: string[];
  level: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedBy?: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'FIXED_DEPOSIT';
  balance: number;
  availableBalance: number;
  currency: string;
  isActive: boolean;
  isFrozen: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  senderAccountId?: string;
  receiverAccountId?: string;
  amount: number;
  fee?: number;
  description?: string;
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT' | 'BILL_PAYMENT' | 'CARD_PAYMENT' | 'LOAN_PAYMENT' | 'INTEREST_CREDIT' | 'FEE_DEBIT';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REVERSED';
  createdAt: string;
  processedAt?: string;
  senderAccount?: {
    accountNumber: string;
    accountName: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  receiverAccount?: {
    accountNumber: string;
    accountName: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface Card {
  id: string;
  cardNumber: string;
  cardBrand: 'VISA' | 'MASTERCARD' | 'AMEX';
  expiryMonth: number;
  expiryYear: number;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  todayTransactions: number;
  monthlyRevenue: number;
  activeAccounts: number;
  userGrowth: number;
  transactionGrowth: number;
  revenueGrowth: number;
  accountGrowth: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning' | 'error';
}
