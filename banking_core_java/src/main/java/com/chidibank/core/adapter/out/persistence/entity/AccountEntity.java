package com.chidibank.core.adapter.out.persistence.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "accountNumber", unique = true, nullable = false)
    private String accountNumber;

    @Column(name = "accountType", nullable = false)
    private String accountType;

    @Column(name = "accountName", nullable = false)
    private String accountName;

    @Column(name = "currency", nullable = false)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "balance", nullable = false)
    @Builder.Default
    private Double balance = 0.0;

    @Column(name = "availableBalance", nullable = false)
    @Builder.Default
    private Double availableBalance = 0.0;

    @Column(name = "isActive", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "isFrozen", nullable = false)
    @Builder.Default
    private boolean isFrozen = false;

    @Column(name = "dailyLimit")
    private Double dailyLimit;

    @Column(name = "monthlyLimit")
    private Double monthlyLimit;

    @Column(name = "interestRate")
    private Double interestRate;

    @Column(name = "lastInterestDate")
    private LocalDateTime lastInterestDate;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @OneToMany(mappedBy = "senderAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TransactionEntity> sentTransactions;

    @OneToMany(mappedBy = "receiverAccount", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TransactionEntity> receivedTransactions;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CardEntity> cards;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoanEntity> loans;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BeneficiaryEntity> beneficiaries;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InterestEntity> interests;

    @CreationTimestamp
    @Column(name = "createdAt", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updatedAt")
    private LocalDateTime updatedAt;
}
