package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "interests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountId", nullable = false)
    private AccountEntity account;

    @Column(nullable = false)
    private String interestType;

    @Column(nullable = false)
    private Double interestRate;

    @Column(nullable = false)
    private Double principalAmount;

    @Column(nullable = false)
    private Double interestAmount;

    @Column(nullable = false)
    private Double totalAmount;

    @Column()
    @Builder.Default
    private LocalDateTime calculationDate = LocalDateTime.now();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
