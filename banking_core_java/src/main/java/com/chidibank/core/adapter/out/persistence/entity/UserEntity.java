package com.chidibank.core.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    @Column(name = "phone", unique = true)
    private String phone;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "firstName", nullable = false)
    private String firstName;

    @Column(name = "lastName", nullable = false)
    private String lastName;

    @Column(name = "middleName")
    private String middleName;

    @Column(name = "dateOfBirth")
    private LocalDateTime dateOfBirth;

    @Column(name = "gender")
    private String gender;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "displayCurrency")
    @Builder.Default
    private String displayCurrency = "USD";

    // KYC & Verification
    @Column(name = "isEmailVerified", nullable = false)
    @Builder.Default
    private boolean isEmailVerified = false;

    @Column(name = "isPhoneVerified", nullable = false)
    @Builder.Default
    private boolean isPhoneVerified = false;

    @Column(name = "isKycVerified", nullable = false)
    @Builder.Default
    private boolean isKycVerified = false;

    @Column(name = "kycStatus", nullable = false)
    @Builder.Default
    private String kycStatus = "PENDING";

    @Column(name = "kycDocuments", columnDefinition = "TEXT")
    private String kycDocuments;

    // KYC Admin Fields
    @Column(name = "kycApprovedAt")
    private LocalDateTime kycApprovedAt;

    @Column(name = "kycApprovedBy")
    private String kycApprovedBy;

    @Column(name = "kycRejectedAt")
    private LocalDateTime kycRejectedAt;

    @Column(name = "kycRejectedBy")
    private String kycRejectedBy;

    @Column(name = "kycReviewNotes", columnDefinition = "TEXT")
    private String kycReviewNotes;

    // Security
    @Column(name = "twoFactorEnabled", nullable = false)
    @Builder.Default
    private boolean twoFactorEnabled = false;

    @Column(name = "twoFactorSecret")
    private String twoFactorSecret;

    @Column(name = "twoFactorMethod")
    private String twoFactorMethod;

    @Column(name = "lastLoginAt")
    private LocalDateTime lastLoginAt;

    @Column(name = "lastLoginIp")
    private String lastLoginIp;

    @Column(name = "isActive", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "isLocked", nullable = false)
    @Builder.Default
    private boolean isLocked = false;

    @Column(name = "lockedUntil")
    private LocalDateTime lockedUntil;

    @Column(name = "failedLoginAttempts", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    // Profile
    @Column(name = "profilePicture")
    private String profilePicture;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "monthlyIncome")
    private Double monthlyIncome;

    @Column(name = "accountTier", nullable = false)
    @Builder.Default
    private String accountTier = "BASIC";

    // Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AccountEntity> accounts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TransactionEntity> transactions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CardEntity> cards;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoanEntity> loans;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<AuditLogEntity> auditLogs;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoginSessionEntity> loginSessions;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private UserProfileEntity userProfile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private EmploymentInfoEntity employmentInfo;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private SecurityInfoEntity securityInfo;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserDocumentEntity> userDocuments;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoginHistoryEntity> loginHistory;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PasswordResetEntity> passwordResets;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<EmailVerificationEntity> emailVerifications;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TwoFactorCodeEntity> twoFactorCodes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserRoleEntity> userRoles;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<KYCRequestEntity> kycRequests;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TermsAcceptanceEntity> termsAcceptances;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InterestEntity> interests;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TierUpgradeRequestEntity> tierUpgradeRequests;

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<NotificationEntity> receivedNotifications;

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<NotificationEntity> sentNotifications;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}
