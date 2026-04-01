package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String cardNumber;

    @Column(nullable = false)
    private String cardType;

    @Column(nullable = false)
    private String cardBrand;

    @Column(nullable = false)
    private Integer expiryMonth;

    @Column(nullable = false)
    private Integer expiryYear;

    @Column(nullable = false)
    private String cvv;

    @Column(nullable = false)
    private String cardholderName;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean isBlocked = false;

    @Column()
    private String blockReason;

    @Column()
    private Double dailyLimit;

    @Column()
    private Double monthlyLimit;

    @Column()
    private Double atmDailyLimit;

    @Column()
    private String pinHash;

    @Column(nullable = false)
    @Builder.Default
    private int pinAttempts = 0;

    @Column()
    private LocalDateTime pinLockedUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountId", nullable = false)
    private AccountEntity account;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
