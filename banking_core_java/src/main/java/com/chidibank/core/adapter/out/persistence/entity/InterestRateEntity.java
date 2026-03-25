package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "interest_rates", uniqueConstraints = {@UniqueConstraint(columnNames = {"account_type", "tier"})})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterestRateEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String accountType;

    @Column(nullable = false)
    @Builder.Default
    private String tier = "STANDARD";

    @Column(nullable = false)
    private Double annualRate;

    @Column(nullable = false)
    @Builder.Default
    private Double minimumBalance = 0.0;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime effectiveFrom = LocalDateTime.now();

    @Column()
    private LocalDateTime effectiveTo;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
