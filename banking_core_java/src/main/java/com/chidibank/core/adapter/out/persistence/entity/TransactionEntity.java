package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String transactionNumber;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    @Builder.Default
    private Double fee = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "VND";

    @Column(nullable = false)
    @Builder.Default
    private String sourceType = "INTERNAL";

    @Column()
    private String initiatedBy;

    private String reason;

    @Column(columnDefinition = "TEXT")
    private String metadata;

    private String description;

    private String reference;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(unique = true)
    private String idempotencyKey;

    @Column()
    private LocalDateTime cancelledAt;

    @Column()
    private String cancellationReason;

    @Column()
    private LocalDateTime failedAt;

    @Column()
    private String failureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "senderAccountId")
    private AccountEntity senderAccount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiverAccountId")
    private AccountEntity receiverAccount;

    @Column()
    private String externalBankCode;

    @Column()
    private String externalAccountNumber;

    @Column()
    private String externalAccountName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column()
    private String billProvider;

    @Column()
    private String billAccountNumber;

    @Column()
    private LocalDateTime processedAt;

    @Column()
    private String batchId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
