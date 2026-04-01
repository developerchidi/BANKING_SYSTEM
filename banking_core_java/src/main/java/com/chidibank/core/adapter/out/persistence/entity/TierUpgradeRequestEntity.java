package com.chidibank.core.adapter.out.persistence.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "tier_upgrade_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TierUpgradeRequestEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserEntity user;

    @Column(nullable = false)
    private String currentTier;

    @Column(nullable = false)
    private String targetTier;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    private String reason;

    @Column()
    @Builder.Default
    private LocalDateTime requestedAt = LocalDateTime.now();

    @Column()
    private LocalDateTime reviewedAt;

    @Column()
    private String reviewedBy;

    @Column()
    private String rejectionReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column()
    private LocalDateTime updatedAt;
}
