// backend/src/models/kyc.model.ts
export interface KYCRequest {
  id: string;
  userId: string;
  documentType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  
  // Document Images
  frontImage: string;      // Base64 or URL
  backImage?: string;       // Base64 or URL
  selfieImage: string;     // Base64 or URL
  
  // Extracted Data (for uniqueness validation)
  extractedData: any;
  
  // Metadata
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCCreateRequest {
  userId: string;
  documentType: 'CCCD' | 'CMND' | 'PASSPORT' | 'STUDENT_CARD';
  frontImage: string;
  backImage?: string;
  selfieImage: string;
  extractedData: any;
}

export interface KYCUpdateRequest {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface KYCValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface KYCDuplicateCheck {
  isDuplicate: boolean;
  existingKYC?: {
    id: string;
    userId: string;
    status: string;
    submittedAt: Date;
  };
}
