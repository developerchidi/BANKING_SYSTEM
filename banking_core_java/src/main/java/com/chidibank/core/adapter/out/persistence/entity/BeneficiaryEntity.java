package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "beneficiaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BeneficiaryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId")
    private UserEntity user;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accountId")
    private AccountEntity account;

    @Column(nullable = false)
    private String name;

    private String nickname;

    @Column()
    private String bankCode;

    @Column(nullable = false)
    private String accountNumber;

    @Column()
    private String accountName;

    @Column()
    private String bankName;

    private String relationship;

    @Column()
    private Double dailyLimit;

    @Column()
    private Double monthlyLimit;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
