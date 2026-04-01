package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "loans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String loanNumber;

    @Column(nullable = false)
    private String loanType;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private Double interestRate;

    @Column(nullable = false)
    private Integer termMonths;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column()
    private Double disbursedAmount;

    @Column()
    private LocalDateTime disbursedAt;

    @Column()
    private Double monthlyPayment;

    @Column()
    private Double totalInterest;

    @Column()
    private Double remainingBalance;

    @Column()
    private LocalDateTime nextPaymentDate;

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
