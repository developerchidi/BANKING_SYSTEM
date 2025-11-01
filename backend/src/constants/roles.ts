// Banking System Roles and Permissions
// This file defines all roles and their permissions for the banking system

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN', 
  MANAGER: 'MANAGER',
  TELLER: 'TELLER',
  CUSTOMER_SERVICE: 'CUSTOMER_SERVICE',
  COMPLIANCE: 'COMPLIANCE',
  AUDITOR: 'AUDITOR',
  CUSTOMER: 'CUSTOMER'
} as const;

export const PERMISSIONS = {
  // User Management
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  USER_ACTIVATE: 'user:activate',
  USER_DEACTIVATE: 'user:deactivate',
  
  // Account Management
  ACCOUNT_READ: 'account:read',
  ACCOUNT_WRITE: 'account:write',
  ACCOUNT_DELETE: 'account:delete',
  ACCOUNT_FREEZE: 'account:freeze',
  ACCOUNT_UNFREEZE: 'account:unfreeze',
  
  // Transaction Management
  TRANSACTION_READ: 'transaction:read',
  TRANSACTION_WRITE: 'transaction:write',
  TRANSACTION_APPROVE: 'transaction:approve',
  TRANSACTION_CANCEL: 'transaction:cancel',
  TRANSACTION_REVERSE: 'transaction:reverse',
  
  // KYC Management
  KYC_READ: 'kyc:read',
  KYC_APPROVE: 'kyc:approve',
  KYC_REJECT: 'kyc:reject',
  KYC_REVIEW: 'kyc:review',
  
  // Card Management
  CARD_READ: 'card:read',
  CARD_WRITE: 'card:write',
  CARD_BLOCK: 'card:block',
  CARD_UNBLOCK: 'card:unblock',
  
  // Loan Management
  LOAN_READ: 'loan:read',
  LOAN_WRITE: 'loan:write',
  LOAN_APPROVE: 'loan:approve',
  LOAN_REJECT: 'loan:reject',
  
  // Audit & Compliance
  AUDIT_READ: 'audit:read',
  AUDIT_WRITE: 'audit:write',
  COMPLIANCE_READ: 'compliance:read',
  COMPLIANCE_WRITE: 'compliance:write',
  
  // System Administration
  SYSTEM_CONFIG: 'system:config',
  ROLE_MANAGE: 'role:manage',
  PERMISSION_MANAGE: 'permission:manage',
  
  // Reports
  REPORT_READ: 'report:read',
  REPORT_EXPORT: 'report:export',
  
  // Customer Service
  CUSTOMER_SUPPORT: 'customer:support',
  REFUND_PROCESS: 'refund:process',
  
  // Banking Operations
  CASH_DEPOSIT: 'cash:deposit',
  CASH_WITHDRAWAL: 'cash:withdrawal',
  TRANSFER_PROCESS: 'transfer:process',
} as const;

// Role Definitions with Permissions
export const ROLE_DEFINITIONS = [
  {
    name: ROLES.SUPER_ADMIN,
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 100,
    permissions: Object.values(PERMISSIONS)
  },
  {
    name: ROLES.ADMIN,
    displayName: 'Administrator', 
    description: 'System administration with most permissions',
    level: 90,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.USER_WRITE,
      PERMISSIONS.USER_ACTIVATE,
      PERMISSIONS.USER_DEACTIVATE,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.ACCOUNT_WRITE,
      PERMISSIONS.ACCOUNT_FREEZE,
      PERMISSIONS.ACCOUNT_UNFREEZE,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.TRANSACTION_WRITE,
      PERMISSIONS.TRANSACTION_APPROVE,
      PERMISSIONS.TRANSACTION_CANCEL,
      PERMISSIONS.KYC_READ,
      PERMISSIONS.KYC_APPROVE,
      PERMISSIONS.KYC_REJECT,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.CARD_WRITE,
      PERMISSIONS.CARD_BLOCK,
      PERMISSIONS.CARD_UNBLOCK,
      PERMISSIONS.LOAN_READ,
      PERMISSIONS.LOAN_WRITE,
      PERMISSIONS.LOAN_APPROVE,
      PERMISSIONS.LOAN_REJECT,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.COMPLIANCE_READ,
      PERMISSIONS.SYSTEM_CONFIG,
      PERMISSIONS.ROLE_MANAGE,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_EXPORT,
    ]
  },
  {
    name: ROLES.MANAGER,
    displayName: 'Branch Manager',
    description: 'Branch management with operational permissions',
    level: 80,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.ACCOUNT_WRITE,
      PERMISSIONS.ACCOUNT_FREEZE,
      PERMISSIONS.ACCOUNT_UNFREEZE,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.TRANSACTION_WRITE,
      PERMISSIONS.TRANSACTION_APPROVE,
      PERMISSIONS.KYC_READ,
      PERMISSIONS.KYC_APPROVE,
      PERMISSIONS.KYC_REJECT,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.CARD_WRITE,
      PERMISSIONS.CARD_BLOCK,
      PERMISSIONS.CARD_UNBLOCK,
      PERMISSIONS.LOAN_READ,
      PERMISSIONS.LOAN_WRITE,
      PERMISSIONS.LOAN_APPROVE,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_EXPORT,
    ]
  },
  {
    name: ROLES.TELLER,
    displayName: 'Bank Teller',
    description: 'Cash operations and basic transactions',
    level: 60,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.TRANSACTION_WRITE,
      PERMISSIONS.CASH_DEPOSIT,
      PERMISSIONS.CASH_WITHDRAWAL,
      PERMISSIONS.TRANSFER_PROCESS,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.CARD_BLOCK,
      PERMISSIONS.CUSTOMER_SUPPORT,
    ]
  },
  {
    name: ROLES.CUSTOMER_SERVICE,
    displayName: 'Customer Service Representative',
    description: 'Customer support and basic account management',
    level: 50,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.KYC_READ,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.CUSTOMER_SUPPORT,
      PERMISSIONS.REFUND_PROCESS,
    ]
  },
  {
    name: ROLES.COMPLIANCE,
    displayName: 'Compliance Officer',
    description: 'KYC review and compliance monitoring',
    level: 70,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.KYC_READ,
      PERMISSIONS.KYC_APPROVE,
      PERMISSIONS.KYC_REJECT,
      PERMISSIONS.KYC_REVIEW,
      PERMISSIONS.COMPLIANCE_READ,
      PERMISSIONS.COMPLIANCE_WRITE,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.REPORT_READ,
    ]
  },
  {
    name: ROLES.AUDITOR,
    displayName: 'Internal Auditor',
    description: 'Audit and compliance review',
    level: 75,
    permissions: [
      PERMISSIONS.USER_READ,
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.KYC_READ,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.LOAN_READ,
      PERMISSIONS.AUDIT_READ,
      PERMISSIONS.AUDIT_WRITE,
      PERMISSIONS.COMPLIANCE_READ,
      PERMISSIONS.REPORT_READ,
      PERMISSIONS.REPORT_EXPORT,
    ]
  },
  {
    name: ROLES.CUSTOMER,
    displayName: 'Customer',
    description: 'Regular banking customer with basic access',
    level: 10,
    permissions: [
      PERMISSIONS.ACCOUNT_READ,
      PERMISSIONS.TRANSACTION_READ,
      PERMISSIONS.CARD_READ,
      PERMISSIONS.LOAN_READ,
      PERMISSIONS.TRANSFER_PROCESS,
    ]
  }
];

// Helper functions
export const getRolePermissions = (roleName: string): string[] => {
  const role = ROLE_DEFINITIONS.find(r => r.name === roleName);
  return role ? role.permissions : [];
};

export const hasPermission = (userPermissions: string[], requiredPermission: string): boolean => {
  return userPermissions.includes(requiredPermission);
};

export const getRoleLevel = (roleName: string): number => {
  const role = ROLE_DEFINITIONS.find(r => r.name === roleName);
  return role ? role.level : 0;
};

export const canManageRole = (userRoleLevel: number, targetRoleLevel: number): boolean => {
  return userRoleLevel > targetRoleLevel;
};
