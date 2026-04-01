package com.chidibank.core.domain;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class User {
    private String id;
    private String studentId;
    private String email;
    private String phone;
    private String password;
    private String firstName;
    private String lastName;
    private String middleName;
    private LocalDateTime dateOfBirth;
    private String gender;
    private String nationality;
    @Builder.Default
    private String displayCurrency = "VND";
    
    // KYC
    private boolean isEmailVerified;
    private boolean isPhoneVerified;
    private boolean isKycVerified;
    
    @Builder.Default
    private String kycStatus = "PENDING";
    
    private String kycDocuments; // JSON String

    // KYC Admin
    private LocalDateTime kycApprovedAt;
    private String kycApprovedBy;
    private LocalDateTime kycRejectedAt;
    private String kycRejectedBy;
    private String kycReviewNotes;

    // Security
    private boolean twoFactorEnabled;
    private String twoFactorSecret;
    private String twoFactorMethod;
    private LocalDateTime lastLoginAt;
    private String lastLoginIp;

    @Builder.Default
    private boolean isActive = true;

    private boolean isLocked;
    private LocalDateTime lockedUntil;
    private int failedLoginAttempts;

    // Profile
    private String profilePicture;
    private String address; // JSON String
    private String occupation;
    private Double monthlyIncome;

    @Builder.Default
    private String accountTier = "BASIC";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
